import { getContext, setContext } from 'svelte';
import type {
	FlowNode,
	FlowEdge,
	Flow,
	Viewport,
	NodeState,
	HandleState,
	DraftConnection,
	Position,
	FlowConfig,
	FlowCallbacks,
} from '../types/index.js';

const FLOW_CONTEXT_KEY = Symbol.for('kaykay-flow');

// Flow state class using Svelte 5 runes
export class FlowState {
	// Core state
	nodes = $state<NodeState[]>([]);
	edges = $state<FlowEdge[]>([]);
	viewport = $state<Viewport>({ x: 0, y: 0, zoom: 1 });

	// Handle positions tracked separately for reactivity
	// Key format: "node_id:handle_id"
	handle_positions = $state<Record<string, Position>>({});

	// Handle registry for reactivity (Maps inside nodes aren't reactive)
	// Key format: "node_id:handle_id"
	handle_registry = $state<Record<string, HandleState>>({});

	// Selection state
	selected_node_ids = $state<Set<string>>(new Set());
	selected_edge_ids = $state<Set<string>>(new Set());

	// Draft connection state (while dragging)
	draft_connection = $state<DraftConnection | null>(null);

	// Canvas dimensions (set by Canvas component)
	canvas_width = $state<number>(800);
	canvas_height = $state<number>(600);

	// Configuration
	config = $state<FlowConfig>({});
	callbacks: FlowCallbacks;

	constructor(
		initial_nodes: FlowNode[] = [],
		initial_edges: FlowEdge[] = [],
		config: FlowConfig = {},
		callbacks: FlowCallbacks = {}
	) {
		this.config = {
			min_zoom: 0.1,
			max_zoom: 4,
			snap_to_grid: false,
			grid_size: 10,
			allow_delete: true,
			default_edge_type: 'bezier',
			locked: false,
			...config,
		};
		this.callbacks = callbacks;

		// Initialize nodes with runtime state
		this.nodes = initial_nodes.map((node) => ({
			...node,
			handles: new Map(),
			computed_width: node.width ?? 0,
			computed_height: node.height ?? 0,
		}));

		this.edges = [...initial_edges];
	}

	// ============ Node Operations ============

	addNode(node: FlowNode): void {
		const node_state: NodeState = {
			...node,
			handles: new Map(),
			computed_width: node.width ?? 0,
			computed_height: node.height ?? 0,
		};
		this.nodes.push(node_state);
	}

	removeNode(node_id: string): void {
		// Remove child nodes first (recursively)
		const children = this.getChildNodes(node_id);
		children.forEach((child) => this.removeNode(child.id));

		// Remove connected edges
		this.edges = this.edges.filter((e) => e.source !== node_id && e.target !== node_id);
		// Remove node
		this.nodes = this.nodes.filter((n) => n.id !== node_id);
		const new_selected = new Set(this.selected_node_ids);
		new_selected.delete(node_id);
		this.selected_node_ids = new_selected;
	}

	updateNodePosition(node_id: string, position: Position): void {
		const node = this.nodes.find((n) => n.id === node_id);
		if (node) {
			// Apply grid snapping if enabled
			if (this.config.snap_to_grid && this.config.grid_size) {
				position = {
					x: Math.round(position.x / this.config.grid_size) * this.config.grid_size,
					y: Math.round(position.y / this.config.grid_size) * this.config.grid_size,
				};
			}
			node.position = position;
		}
	}

	updateNodeData<T>(node_id: string, data: Partial<T>): void {
		const node = this.nodes.find((n) => n.id === node_id);
		if (node) {
			node.data = { ...node.data, ...data };
		}
	}

	updateNodeDimensions(node_id: string, width: number, height: number): void {
		const node = this.nodes.find((n) => n.id === node_id);
		if (node) {
			node.computed_width = width;
			node.computed_height = height;
		}
	}

	resizeNode(node_id: string, width: number, height: number): void {
		const node = this.nodes.find((n) => n.id === node_id);
		if (node) {
			node.width = width;
			node.height = height;
			node.computed_width = width;
			node.computed_height = height;
		}
	}

	// Update which nodes belong to a group based on current bounds
	updateGroupMembership(group_id: string): void {
		const group = this.getNode(group_id);
		if (!group || group.type !== 'group') return;

		const group_abs_pos = this.getAbsolutePosition(group_id);
		const group_bounds = {
			left: group_abs_pos.x,
			top: group_abs_pos.y,
			right: group_abs_pos.x + group.computed_width,
			bottom: group_abs_pos.y + group.computed_height,
		};

		// Check all non-group nodes
		for (const node of this.nodes) {
			if (node.id === group_id || node.type === 'group') continue;

			const node_abs_pos = this.getAbsolutePosition(node.id);
			const node_center = {
				x: node_abs_pos.x + node.computed_width / 2,
				y: node_abs_pos.y + node.computed_height / 2,
			};

			const is_inside_group =
				node_center.x >= group_bounds.left &&
				node_center.x <= group_bounds.right &&
				node_center.y >= group_bounds.top &&
				node_center.y <= group_bounds.bottom;

			if (is_inside_group && node.parent_id !== group_id) {
				// Node is inside group but not a child - add it
				// Only add if not already in another group, or if this group is smaller (more specific)
				if (!node.parent_id) {
					this.setNodeParent(node.id, group_id);
				} else {
					// Check if this group is smaller (more nested)
					const current_parent = this.getNode(node.parent_id);
					if (current_parent) {
						const current_area = current_parent.computed_width * current_parent.computed_height;
						const this_area = group.computed_width * group.computed_height;
						if (this_area < current_area) {
							this.setNodeParent(node.id, group_id);
						}
					}
				}
			} else if (!is_inside_group && node.parent_id === group_id) {
				// Node is outside group but is a child - remove it
				this.setNodeParent(node.id, undefined);
			}
		}
	}

	getNode(node_id: string): NodeState | undefined {
		return this.nodes.find((n) => n.id === node_id);
	}

	// ============ Group Operations ============

	// Get children of a group node
	getChildNodes(parent_id: string): NodeState[] {
		return this.nodes.filter((n) => n.parent_id === parent_id);
	}

	// Get absolute position of a node (accounting for parent hierarchy)
	getAbsolutePosition(node_id: string): Position {
		const node = this.getNode(node_id);
		if (!node) return { x: 0, y: 0 };

		if (!node.parent_id) {
			return { ...node.position };
		}

		const parent_pos = this.getAbsolutePosition(node.parent_id);
		return {
			x: parent_pos.x + node.position.x,
			y: parent_pos.y + node.position.y,
		};
	}

	// Set parent of a node (for grouping/ungrouping)
	setNodeParent(node_id: string, parent_id: string | undefined): void {
		const node = this.getNode(node_id);
		if (!node) return;

		// Prevent circular references
		if (parent_id && this.isDescendantOf(parent_id, node_id)) {
			return;
		}

		const old_absolute = this.getAbsolutePosition(node_id);

		if (parent_id) {
			// Setting a new parent - convert position to relative
			const parent_absolute = this.getAbsolutePosition(parent_id);
			node.position = {
				x: old_absolute.x - parent_absolute.x,
				y: old_absolute.y - parent_absolute.y,
			};
		} else if (node.parent_id) {
			// Removing parent - convert position to absolute
			node.position = old_absolute;
		}

		node.parent_id = parent_id;
	}

	// Check if a node is a descendant of another node
	isDescendantOf(node_id: string, potential_ancestor_id: string): boolean {
		const node = this.getNode(node_id);
		if (!node || !node.parent_id) return false;
		if (node.parent_id === potential_ancestor_id) return true;
		return this.isDescendantOf(node.parent_id, potential_ancestor_id);
	}

	// Find which group node contains a point (for drag-and-drop into groups)
	findGroupAtPosition(position: Position, exclude_ids: string[] = []): NodeState | undefined {
		// Find all group nodes (nodes with type 'group') that contain the position
		// Return the smallest one (most deeply nested)
		const groups = this.nodes
			.filter((n) => n.type === 'group' && !exclude_ids.includes(n.id))
			.filter((n) => {
				const abs_pos = this.getAbsolutePosition(n.id);
				return (
					position.x >= abs_pos.x &&
					position.x <= abs_pos.x + n.computed_width &&
					position.y >= abs_pos.y &&
					position.y <= abs_pos.y + n.computed_height
				);
			})
			.sort((a, b) => {
				// Sort by area (smallest first)
				const area_a = a.computed_width * a.computed_height;
				const area_b = b.computed_width * b.computed_height;
				return area_a - area_b;
			});

		return groups[0];
	}

	// ============ Handle Operations ============

	registerHandle(node_id: string, handle: HandleState): void {
		const node = this.nodes.find((n) => n.id === node_id);
		if (node) {
			node.handles.set(handle.id, handle);
		}
		// Also add to reactive registry
		const key = `${node_id}:${handle.id}`;
		this.handle_registry[key] = handle;
	}

	unregisterHandle(node_id: string, handle_id: string): void {
		const node = this.nodes.find((n) => n.id === node_id);
		if (node) {
			node.handles.delete(handle_id);
		}
		// Also remove from reactive registry
		const key = `${node_id}:${handle_id}`;
		delete this.handle_registry[key];
	}

	updateHandlePosition(node_id: string, handle_id: string, absolute_position: Position): void {
		const key = `${node_id}:${handle_id}`;
		
		// Update node's handle map
		const node = this.nodes.find((n) => n.id === node_id);
		if (node) {
			const handle = node.handles.get(handle_id);
			if (handle) {
				handle.absolute_position = absolute_position;
			}
		}
		
		// Update reactive registry - mutate in place to avoid triggering unnecessary re-renders
		const existing_handle = this.handle_registry[key];
		if (existing_handle) {
			existing_handle.absolute_position = absolute_position;
		}
		
		// Update reactive handle positions record
		this.handle_positions[key] = absolute_position;
	}

	getHandle(node_id: string, handle_id: string): HandleState | undefined {
		// Use reactive registry for proper reactivity
		const key = `${node_id}:${handle_id}`;
		return this.handle_registry[key];
	}

	getHandlePosition(node_id: string, handle_id: string): Position | undefined {
		const key = `${node_id}:${handle_id}`;
		return this.handle_positions[key];
	}

	// ============ Edge Operations ============

	addEdge(edge: FlowEdge): boolean {
		// Validate connection
		if (!this.canConnect(edge.source, edge.source_handle, edge.target, edge.target_handle)) {
			return false;
		}

		// Check for duplicate
		const exists = this.edges.some(
			(e) =>
				e.source === edge.source &&
				e.source_handle === edge.source_handle &&
				e.target === edge.target &&
				e.target_handle === edge.target_handle
		);

		if (exists) return false;

		this.edges.push({
			...edge,
			type: edge.type ?? this.config.default_edge_type,
		});

		this.callbacks.on_connect?.(edge);
		return true;
	}

	removeEdge(edge_id: string): void {
		this.edges = this.edges.filter((e) => e.id !== edge_id);
		const new_selected = new Set(this.selected_edge_ids);
		new_selected.delete(edge_id);
		this.selected_edge_ids = new_selected;
	}

	getEdge(edge_id: string): FlowEdge | undefined {
		return this.edges.find((e) => e.id === edge_id);
	}

	updateEdge(edge_id: string, updates: Partial<FlowEdge>): void {
		const edge = this.edges.find((e) => e.id === edge_id);
		if (edge) {
			Object.assign(edge, updates);
		}
	}

	// ============ Edge Waypoints ============

	addEdgeWaypoint(edge_id: string, position: Position, index?: number): void {
		const edge = this.edges.find((e) => e.id === edge_id);
		if (!edge) return;

		if (!edge.waypoints) {
			edge.waypoints = [];
		}

		if (index !== undefined && index >= 0 && index <= edge.waypoints.length) {
			edge.waypoints.splice(index, 0, position);
		} else {
			edge.waypoints.push(position);
		}
	}

	updateEdgeWaypoint(edge_id: string, waypoint_index: number, position: Position): void {
		const edge = this.edges.find((e) => e.id === edge_id);
		if (!edge || !edge.waypoints) return;

		if (waypoint_index >= 0 && waypoint_index < edge.waypoints.length) {
			edge.waypoints[waypoint_index] = position;
		}
	}

	removeEdgeWaypoint(edge_id: string, waypoint_index: number): void {
		const edge = this.edges.find((e) => e.id === edge_id);
		if (!edge || !edge.waypoints) return;

		if (waypoint_index >= 0 && waypoint_index < edge.waypoints.length) {
			edge.waypoints.splice(waypoint_index, 1);
			// Clean up empty waypoints array
			if (edge.waypoints.length === 0) {
				edge.waypoints = undefined;
			}
		}
	}

	clearEdgeWaypoints(edge_id: string): void {
		const edge = this.edges.find((e) => e.id === edge_id);
		if (edge) {
			edge.waypoints = undefined;
		}
	}

	// ============ Connection Validation ============

	canConnect(
		source_node_id: string,
		source_handle_id: string,
		target_node_id: string,
		target_handle_id: string
	): boolean {
		// Cannot connect to self
		if (source_node_id === target_node_id) return false;

		const source_handle = this.getHandle(source_node_id, source_handle_id);
		const target_handle = this.getHandle(target_node_id, target_handle_id);

		if (!source_handle || !target_handle) return false;

		// Must be output -> input
		if (source_handle.type !== 'output' || target_handle.type !== 'input') return false;

		// Port type validation
		return this.canConnectPorts(source_handle.port, target_handle.port, target_handle.accept);
	}

	canConnectPorts(source_port: string, target_port: string, target_accept?: string[]): boolean {
		// Exact match
		if (source_port === target_port) return true;

		// Check accept array
		if (target_accept && target_accept.indexOf(source_port) !== -1) return true;

		return false;
	}

	// ============ Selection ============

	selectNode(node_id: string, additive = false): void {
		if (!additive) {
			this.selected_node_ids = new Set([node_id]);
			this.selected_edge_ids = new Set();
		} else {
			this.selected_node_ids = new Set([...this.selected_node_ids, node_id]);
		}
		this.callbacks.on_node_click?.(node_id);
	}

	selectEdge(edge_id: string, additive = false): void {
		if (!additive) {
			this.selected_node_ids = new Set();
			this.selected_edge_ids = new Set([edge_id]);
		} else {
			this.selected_edge_ids = new Set([...this.selected_edge_ids, edge_id]);
		}
		this.callbacks.on_edge_click?.(edge_id);
	}

	clearSelection(): void {
		this.selected_node_ids = new Set();
		this.selected_edge_ids = new Set();
	}

	deleteSelected(): void {
		if (!this.config.allow_delete || this.config.locked) return;

		const node_ids = Array.from(this.selected_node_ids);
		const edge_ids = Array.from(this.selected_edge_ids);

		node_ids.forEach((id) => this.removeNode(id));
		edge_ids.forEach((id) => this.removeEdge(id));

		this.callbacks.on_delete?.(node_ids, edge_ids);
	}

	// ============ Lock State ============

	get locked(): boolean {
		return this.config.locked ?? false;
	}

	setLocked(locked: boolean): void {
		this.config = { ...this.config, locked };
	}

	toggleLocked(): void {
		this.setLocked(!this.locked);
	}

	// ============ Canvas Dimensions ============

	setCanvasDimensions(width: number, height: number): void {
		this.canvas_width = width;
		this.canvas_height = height;
	}

	// ============ Viewport ============

	setViewport(viewport: Viewport): void {
		this.viewport = {
			x: viewport.x,
			y: viewport.y,
			zoom: Math.max(this.config.min_zoom!, Math.min(this.config.max_zoom!, viewport.zoom)),
		};
		this.callbacks.on_viewport_change?.(this.viewport);
	}

	pan(dx: number, dy: number): void {
		this.setViewport({
			...this.viewport,
			x: this.viewport.x + dx,
			y: this.viewport.y + dy,
		});
	}

	zoom(delta: number, center: Position): void {
		const new_zoom = Math.max(
			this.config.min_zoom!,
			Math.min(this.config.max_zoom!, this.viewport.zoom * (1 + delta))
		);

		// Zoom towards center point
		const scale = new_zoom / this.viewport.zoom;
		this.setViewport({
			x: center.x - (center.x - this.viewport.x) * scale,
			y: center.y - (center.y - this.viewport.y) * scale,
			zoom: new_zoom,
		});
	}

	// Zoom in by a fixed step (default 20%)
	zoomIn(step: number = 0.2): void {
		const new_zoom = Math.min(this.config.max_zoom!, this.viewport.zoom * (1 + step));
		this.setViewport({
			...this.viewport,
			zoom: new_zoom,
		});
	}

	// Zoom out by a fixed step (default 20%)
	zoomOut(step: number = 0.2): void {
		const new_zoom = Math.max(this.config.min_zoom!, this.viewport.zoom * (1 - step));
		this.setViewport({
			...this.viewport,
			zoom: new_zoom,
		});
	}

	// Reset zoom to 100%
	resetZoom(): void {
		this.setViewport({
			...this.viewport,
			zoom: 1,
		});
	}

	// Set zoom to a specific level
	setZoom(zoom: number): void {
		const clamped_zoom = Math.max(this.config.min_zoom!, Math.min(this.config.max_zoom!, zoom));
		this.setViewport({
			...this.viewport,
			zoom: clamped_zoom,
		});
	}

	// Fit all nodes in view
	fitView(padding: number = 50): void {
		if (this.nodes.length === 0) {
			this.resetZoom();
			return;
		}

		// Calculate bounding box of all nodes
		let min_x = Infinity;
		let min_y = Infinity;
		let max_x = -Infinity;
		let max_y = -Infinity;

		for (const node of this.nodes) {
			const abs_pos = this.getAbsolutePosition(node.id);
			min_x = Math.min(min_x, abs_pos.x);
			min_y = Math.min(min_y, abs_pos.y);
			max_x = Math.max(max_x, abs_pos.x + node.computed_width);
			max_y = Math.max(max_y, abs_pos.y + node.computed_height);
		}

		// Use stored canvas dimensions
		const canvas_width = this.canvas_width;
		const canvas_height = this.canvas_height;

		const content_width = max_x - min_x + padding * 2;
		const content_height = max_y - min_y + padding * 2;

		const zoom_x = canvas_width / content_width;
		const zoom_y = canvas_height / content_height;
		const new_zoom = Math.max(this.config.min_zoom!, Math.min(this.config.max_zoom!, Math.min(zoom_x, zoom_y, 1)));

		const center_x = (min_x + max_x) / 2;
		const center_y = (min_y + max_y) / 2;

		this.setViewport({
			x: canvas_width / 2 - center_x * new_zoom,
			y: canvas_height / 2 - center_y * new_zoom,
			zoom: new_zoom,
		});
	}

	// ============ Draft Connection ============

	startConnection(
		source_node_id: string,
		source_handle_id: string,
		source_port: string,
		source_handle_position: import('../types/index.js').HandlePosition,
		source_position: Position
	): void {
		this.draft_connection = {
			source_node_id,
			source_handle_id,
			source_port,
			source_handle_position,
			source_position,
			target_position: source_position,
		};
	}

	updateConnection(target_position: Position): void {
		if (this.draft_connection) {
			this.draft_connection.target_position = target_position;
		}
	}

	finishConnection(target_node_id: string, target_handle_id: string): boolean {
		if (!this.draft_connection) return false;

		const success = this.addEdge({
			id: `e-${this.draft_connection.source_node_id}-${this.draft_connection.source_handle_id}-${target_node_id}-${target_handle_id}`,
			source: this.draft_connection.source_node_id,
			source_handle: this.draft_connection.source_handle_id,
			target: target_node_id,
			target_handle: target_handle_id,
		});

		this.draft_connection = null;
		return success;
	}

	cancelConnection(): void {
		this.draft_connection = null;
	}

	// ============ Coordinate Transforms ============

	screenToCanvas(screen_pos: Position): Position {
		return {
			x: (screen_pos.x - this.viewport.x) / this.viewport.zoom,
			y: (screen_pos.y - this.viewport.y) / this.viewport.zoom,
		};
	}

	canvasToScreen(canvas_pos: Position): Position {
		return {
			x: canvas_pos.x * this.viewport.zoom + this.viewport.x,
			y: canvas_pos.y * this.viewport.zoom + this.viewport.y,
		};
	}

	// ============ Serialization ============

	toJSON(): Flow {
		return {
			nodes: this.nodes.map((node) => ({
				id: node.id,
				type: node.type,
				position: { ...node.position },
				data: { ...node.data },
				width: node.width,
				height: node.height,
				parent_id: node.parent_id,
				z_index: node.z_index,
			})),
			edges: this.edges.map((edge) => ({
				id: edge.id,
				source: edge.source,
				source_handle: edge.source_handle,
				target: edge.target,
				target_handle: edge.target_handle,
				type: edge.type,
				label: edge.label,
				waypoints: edge.waypoints ? edge.waypoints.map((wp) => ({ ...wp })) : undefined,
				style: edge.style,
				animated: edge.animated,
				color: edge.color,
			})),
		};
	}

	fromJSON(flow: Flow): void {
		this.nodes = flow.nodes.map((node) => ({
			...node,
			handles: new Map(),
			computed_width: node.width ?? 0,
			computed_height: node.height ?? 0,
		}));
		this.edges = [...flow.edges];
		this.clearSelection();
	}
}

// Create and provide flow context
export function createFlow(
	initial_nodes: FlowNode[] = [],
	initial_edges: FlowEdge[] = [],
	config: FlowConfig = {},
	callbacks: FlowCallbacks = {}
): FlowState {
	const flow = new FlowState(initial_nodes, initial_edges, config, callbacks);
	setContext(FLOW_CONTEXT_KEY, flow);
	return flow;
}

// Get flow from context
export function getFlow(): FlowState {
	const flow = getContext<FlowState>(FLOW_CONTEXT_KEY);
	if (!flow) {
		throw new Error('getFlow must be called within a Canvas component');
	}
	return flow;
}

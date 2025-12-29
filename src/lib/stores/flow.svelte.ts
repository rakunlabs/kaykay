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

	// Selection rectangle state (for Ctrl+drag selection)
	selection_rect = $state<{ start: Position; end: Position } | null>(null);

	// Clipboard state (for copy/paste)
	clipboard = $state<{ nodes: FlowNode[]; edges: FlowEdge[] } | null>(null);

	// Auto-incrementing node ID counter
	private next_node_id = 1;

	// History state for undo/redo
	private history_stack = $state<Flow[]>([]);
	private redo_stack = $state<Flow[]>([]);
	private is_restoring = false; // Prevent recursive history saving during undo/redo

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

		// Initialize next_node_id based on existing nodes
		this.initializeNextNodeId();
	}

	// ============ Node Operations ============

	addNode(node: FlowNode): string {
		this.pushSnapshot();
		const node_id = node.id || this.generateNodeId();
		const node_state: NodeState = {
			...node,
			id: node_id,
			handles: new Map(),
			computed_width: node.width ?? 0,
			computed_height: node.height ?? 0,
		};
		this.nodes.push(node_state);
		return node_id;
	}

	removeNode(node_id: string): void {
		this.pushSnapshot();
		this.removeNodeInternal(node_id);
	}

	// Internal remove without snapshot (for recursive calls and batch operations)
	private removeNodeInternal(node_id: string): void {
		// Remove child nodes first (recursively)
		const children = this.getChildNodes(node_id);
		children.forEach((child) => this.removeNodeInternal(child.id));

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
		this.pushSnapshot();
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
		this.pushSnapshot();
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
					this.setNodeParentInternal(node.id, group_id);
				} else {
					// Check if this group is smaller (more nested)
					const current_parent = this.getNode(node.parent_id);
					if (current_parent) {
						const current_area = current_parent.computed_width * current_parent.computed_height;
						const this_area = group.computed_width * group.computed_height;
						if (this_area < current_area) {
							this.setNodeParentInternal(node.id, group_id);
						}
					}
				}
			} else if (!is_inside_group && node.parent_id === group_id) {
				// Node is outside group but is a child - remove it
				this.setNodeParentInternal(node.id, undefined);
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
		this.pushSnapshot();
		this.setNodeParentInternal(node_id, parent_id);
	}

	// Internal setNodeParent without snapshot (for batch operations like after drag)
	setNodeParentInternal(node_id: string, parent_id: string | undefined): void {
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

		this.pushSnapshot();
		this.edges.push({
			...edge,
			type: edge.type ?? this.config.default_edge_type,
		});

		this.callbacks.on_connect?.(edge);
		return true;
	}

	removeEdge(edge_id: string): void {
		this.pushSnapshot();
		this.removeEdgeInternal(edge_id);
	}

	// Internal remove without snapshot (for batch operations)
	private removeEdgeInternal(edge_id: string): void {
		this.edges = this.edges.filter((e) => e.id !== edge_id);
		const new_selected = new Set(this.selected_edge_ids);
		new_selected.delete(edge_id);
		this.selected_edge_ids = new_selected;
	}

	getEdge(edge_id: string): FlowEdge | undefined {
		return this.edges.find((e) => e.id === edge_id);
	}

	updateEdge(edge_id: string, updates: Partial<FlowEdge>): void {
		this.pushSnapshot();
		const edge = this.edges.find((e) => e.id === edge_id);
		if (edge) {
			Object.assign(edge, updates);
		}
	}

	// ============ Edge Waypoints ============

	addEdgeWaypoint(edge_id: string, position: Position, index?: number): void {
		const edge = this.edges.find((e) => e.id === edge_id);
		if (!edge) return;

		this.pushSnapshot();

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
			this.pushSnapshot();
			edge.waypoints[waypoint_index] = position;
		}
	}

	removeEdgeWaypoint(edge_id: string, waypoint_index: number): void {
		const edge = this.edges.find((e) => e.id === edge_id);
		if (!edge || !edge.waypoints) return;

		if (waypoint_index >= 0 && waypoint_index < edge.waypoints.length) {
			this.pushSnapshot();
			edge.waypoints.splice(waypoint_index, 1);
			// Clean up empty waypoints array
			if (edge.waypoints.length === 0) {
				edge.waypoints = undefined;
			}
		}
	}

	clearEdgeWaypoints(edge_id: string): void {
		const edge = this.edges.find((e) => e.id === edge_id);
		if (edge && edge.waypoints) {
			this.pushSnapshot();
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

		if (node_ids.length === 0 && edge_ids.length === 0) return;

		this.pushSnapshot();
		node_ids.forEach((id) => this.removeNodeInternal(id));
		edge_ids.forEach((id) => this.removeEdgeInternal(id));

		this.callbacks.on_delete?.(node_ids, edge_ids);
	}

	// Log selected nodes and edges as JSON to console
	logSelected(): void {
		const selected_nodes = this.nodes
			.filter((n) => this.selected_node_ids.has(n.id))
			.map((n) => ({
				id: n.id,
				type: n.type,
				position: { ...n.position },
				data: { ...n.data },
				width: n.width,
				height: n.height,
				parent_id: n.parent_id,
				z_index: n.z_index,
			}));

		// Get explicitly selected edges
		const explicitly_selected_edges = this.edges
			.filter((e) => this.selected_edge_ids.has(e.id));

		// Get edges between selected nodes (not already selected)
		const edges_between_selected = this.edges
			.filter((e) => 
				this.selected_node_ids.has(e.source) && 
				this.selected_node_ids.has(e.target) &&
				!this.selected_edge_ids.has(e.id)
			);

		// Combine and map both
		const all_edges = [...explicitly_selected_edges, ...edges_between_selected]
			.map((e) => ({
				id: e.id,
				source: e.source,
				source_handle: e.source_handle,
				target: e.target,
				target_handle: e.target_handle,
				type: e.type,
				label: e.label,
				waypoints: e.waypoints,
				style: e.style,
				animated: e.animated,
				color: e.color,
			}));

		const output = {
			nodes: selected_nodes,
			edges: all_edges,
		};

		console.log('Selected nodes and edges:');
		console.log(JSON.stringify(output, null, 2));
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
		// Re-initialize next_node_id based on loaded nodes
		this.initializeNextNodeId();
		// Clear history when loading a new flow
		if (!this.is_restoring) {
			this.history_stack = [];
			this.redo_stack = [];
		}
	}

	// ============ Undo/Redo ============

	// Save current state before an undoable operation
	pushSnapshot(): void {
		if (this.is_restoring) return;
		const snapshot = this.toJSON();
		const max_history = this.config.max_history ?? 50;
		this.history_stack = [...this.history_stack.slice(-(max_history - 1)), snapshot];
		this.redo_stack = []; // Clear redo stack on new action
	}

	// Undo the last operation
	undo(): boolean {
		if (this.history_stack.length === 0) return false;
		this.is_restoring = true;
		try {
			const current = this.toJSON();
			this.redo_stack = [...this.redo_stack, current];
			const previous = this.history_stack[this.history_stack.length - 1];
			this.history_stack = this.history_stack.slice(0, -1);
			this.restoreFromSnapshot(previous);
			this.callbacks.on_undo?.();
			return true;
		} finally {
			this.is_restoring = false;
		}
	}

	// Redo the last undone operation
	redo(): boolean {
		if (this.redo_stack.length === 0) return false;
		this.is_restoring = true;
		try {
			const current = this.toJSON();
			this.history_stack = [...this.history_stack, current];
			const next = this.redo_stack[this.redo_stack.length - 1];
			this.redo_stack = this.redo_stack.slice(0, -1);
			this.restoreFromSnapshot(next);
			this.callbacks.on_redo?.();
			return true;
		} finally {
			this.is_restoring = false;
		}
	}

	// Restore state from a snapshot (without clearing history)
	private restoreFromSnapshot(flow: Flow): void {
		this.nodes = flow.nodes.map((node) => ({
			...node,
			handles: new Map(),
			computed_width: node.width ?? 0,
			computed_height: node.height ?? 0,
		}));
		this.edges = [...flow.edges];
		this.clearSelection();
		this.initializeNextNodeId();
	}

	// Check if undo is available
	get canUndo(): boolean {
		return this.history_stack.length > 0;
	}

	// Check if redo is available
	get canRedo(): boolean {
		return this.redo_stack.length > 0;
	}

	// Clear all history
	clearHistory(): void {
		this.history_stack = [];
		this.redo_stack = [];
	}

	// ============ Node ID Generation ============

	private initializeNextNodeId(): void {
		let max_id = 0;
		for (const node of this.nodes) {
			const num = parseInt(node.id, 10);
			if (!isNaN(num) && num > max_id) {
				max_id = num;
			}
		}
		this.next_node_id = max_id + 1;
	}

	generateNodeId(): string {
		// Find next ID that doesn't exist
		while (this.nodes.some((n) => n.id === String(this.next_node_id))) {
			this.next_node_id++;
		}
		return String(this.next_node_id++);
	}

	// ============ Selection Rectangle ============

	startSelectionRect(start: Position): void {
		this.selection_rect = { start, end: start };
	}

	updateSelectionRect(end: Position): void {
		if (this.selection_rect) {
			this.selection_rect = { ...this.selection_rect, end };
		}
	}

	finishSelectionRect(): void {
		if (!this.selection_rect) return;

		const rect = this.getNormalizedRect(this.selection_rect);
		const nodes_in_rect = this.getNodesInRect(rect);

		// Toggle selection for nodes in rectangle
		const new_selected = new Set(this.selected_node_ids);
		for (const node of nodes_in_rect) {
			if (new_selected.has(node.id)) {
				new_selected.delete(node.id); // Unselect if already selected
			} else {
				new_selected.add(node.id); // Select if not selected
			}
		}
		this.selected_node_ids = new_selected;
		this.selection_rect = null;
	}

	cancelSelectionRect(): void {
		this.selection_rect = null;
	}

	private getNormalizedRect(rect: { start: Position; end: Position }): {
		x: number;
		y: number;
		width: number;
		height: number;
	} {
		return {
			x: Math.min(rect.start.x, rect.end.x),
			y: Math.min(rect.start.y, rect.end.y),
			width: Math.abs(rect.end.x - rect.start.x),
			height: Math.abs(rect.end.y - rect.start.y),
		};
	}

	private getNodesInRect(rect: { x: number; y: number; width: number; height: number }): NodeState[] {
		return this.nodes.filter((node) => {
			const node_pos = this.getAbsolutePosition(node.id);
			const node_right = node_pos.x + node.computed_width;
			const node_bottom = node_pos.y + node.computed_height;
			const rect_right = rect.x + rect.width;
			const rect_bottom = rect.y + rect.height;

			// Check intersection (node overlaps with rectangle)
			return !(
				node_right < rect.x ||
				node_pos.x > rect_right ||
				node_bottom < rect.y ||
				node_pos.y > rect_bottom
			);
		});
	}

	// ============ Copy/Paste ============

	// Get all descendant node IDs of a node (recursive)
	private getAllDescendantIds(node_id: string): string[] {
		const descendants: string[] = [];
		const children = this.getChildNodes(node_id);
		for (const child of children) {
			descendants.push(child.id);
			descendants.push(...this.getAllDescendantIds(child.id));
		}
		return descendants;
	}

	copySelected(): void {
		if (this.selected_node_ids.size === 0) return;

		// Expand selection to include all children of selected groups
		const expanded_ids = new Set(this.selected_node_ids);
		for (const node_id of this.selected_node_ids) {
			const node = this.getNode(node_id);
			if (node?.type === 'group') {
				const descendants = this.getAllDescendantIds(node_id);
				descendants.forEach((id) => expanded_ids.add(id));
			}
		}

		// Copy selected nodes (serialize to plain objects)
		const copied_nodes: FlowNode[] = this.nodes
			.filter((n) => expanded_ids.has(n.id))
			.map((n) => ({
				id: n.id,
				type: n.type,
				position: { ...n.position },
				data: { ...n.data },
				width: n.width,
				height: n.height,
				parent_id: n.parent_id,
				z_index: n.z_index,
			}));

		// Copy edges where BOTH source and target are in expanded selection
		const copied_edges: FlowEdge[] = this.edges
			.filter((e) => expanded_ids.has(e.source) && expanded_ids.has(e.target))
			.map((e) => ({
				id: e.id,
				source: e.source,
				source_handle: e.source_handle,
				target: e.target,
				target_handle: e.target_handle,
				type: e.type,
				label: e.label,
				waypoints: e.waypoints?.map((wp) => ({ ...wp })),
				style: e.style,
				animated: e.animated,
				color: e.color,
			}));

		this.clipboard = { nodes: copied_nodes, edges: copied_edges };

		// Also write to system clipboard for cross-tab/cross-browser paste
		const clipboard_data = {
			kaykay: true, // Marker to identify kaykay clipboard data
			nodes: copied_nodes,
			edges: copied_edges,
		};
		navigator.clipboard.writeText(JSON.stringify(clipboard_data)).catch((err) => {
			console.warn('Failed to write to system clipboard:', err);
		});
	}

	// Paste from internal clipboard or provided data
	paste(position?: Position, clipboard_data?: { nodes: FlowNode[]; edges: FlowEdge[] }): void {
		const data = clipboard_data ?? this.clipboard;
		if (!data || data.nodes.length === 0) return;
		if (this.locked) return;

		this.pushSnapshot();

		const paste_pos = position ?? { x: 100, y: 100 };

		// Build a set of node IDs in clipboard to check parent relationships
		const clipboard_ids = new Set(data.nodes.map((n) => n.id));

		// Find top-level nodes (nodes whose parent is not in the clipboard)
		const top_level_nodes = data.nodes.filter(
			(n) => !n.parent_id || !clipboard_ids.has(n.parent_id)
		);

		// Calculate bounding box using only top-level nodes (they have absolute positions)
		let min_x = Infinity;
		let min_y = Infinity;
		let max_x = -Infinity;
		let max_y = -Infinity;

		for (const node of top_level_nodes) {
			min_x = Math.min(min_x, node.position.x);
			min_y = Math.min(min_y, node.position.y);
			max_x = Math.max(max_x, node.position.x);
			max_y = Math.max(max_y, node.position.y);
		}

		// Calculate offset from center of top-level nodes to paste position
		const center_x = (min_x + max_x) / 2;
		const center_y = (min_y + max_y) / 2;
		const offset = {
			x: paste_pos.x - center_x,
			y: paste_pos.y - center_y,
		};

		// Map old IDs to new IDs
		const id_map = new Map<string, string>();

		// Create new nodes with new IDs
		const new_nodes: FlowNode[] = data.nodes.map((node) => {
			const new_id = this.generateNodeId();
			id_map.set(node.id, new_id);

			// Check if this node's parent is in the clipboard
			const parent_in_clipboard = node.parent_id && clipboard_ids.has(node.parent_id);

			return {
				...node,
				id: new_id,
				position: parent_in_clipboard
					? { ...node.position } // Keep relative position for child nodes
					: {
							// Apply offset only to top-level nodes
							x: node.position.x + offset.x,
							y: node.position.y + offset.y,
						},
				// Clear parent_id for now (will be set later if parent was copied)
				parent_id: undefined,
			};
		});

		// Update parent_id for nodes whose parent was also copied
		for (let i = 0; i < data.nodes.length; i++) {
			const original_parent_id = data.nodes[i].parent_id;
			if (original_parent_id && id_map.has(original_parent_id)) {
				new_nodes[i].parent_id = id_map.get(original_parent_id);
			}
		}

		// Create new edges with updated node references
		const new_edges: FlowEdge[] = data.edges.map((edge) => {
			const new_source = id_map.get(edge.source)!;
			const new_target = id_map.get(edge.target)!;
			return {
				...edge,
				id: `e-${new_source}-${edge.source_handle}-${new_target}-${edge.target_handle}`,
				source: new_source,
				target: new_target,
				type: edge.type ?? this.config.default_edge_type,
				waypoints: edge.waypoints?.map((wp) => ({
					x: wp.x + offset.x,
					y: wp.y + offset.y,
				})),
			};
		});

		// Add nodes and edges directly (without calling public methods that would create snapshots)
		// Note: We add edges directly to the array instead of using addEdge()
		// because addEdge() validates connections via canConnect(), which requires
		// handles to be registered. But handles are registered when Handle components
		// mount, which happens after paste() completes.
		for (const node of new_nodes) {
			const node_state: NodeState = {
				...node,
				handles: new Map(),
				computed_width: node.width ?? 0,
				computed_height: node.height ?? 0,
			};
			this.nodes.push(node_state);
		}
		this.edges.push(...new_edges);

		// Select the newly pasted nodes
		this.selected_node_ids = new Set(new_nodes.map((n) => n.id));
		this.selected_edge_ids = new Set();
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

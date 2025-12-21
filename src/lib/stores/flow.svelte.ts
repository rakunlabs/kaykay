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

const FLOW_CONTEXT_KEY = Symbol('kaykay-flow');

/**
 * Flow state class using Svelte 5 runes
 */
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

	// Configuration
	config: FlowConfig;
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
			grid_size: 20,
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
		// Remove connected edges first
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

	getNode(node_id: string): NodeState | undefined {
		return this.nodes.find((n) => n.id === node_id);
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
			})),
			edges: this.edges.map((edge) => ({
				id: edge.id,
				source: edge.source,
				source_handle: edge.source_handle,
				target: edge.target,
				target_handle: edge.target_handle,
				type: edge.type,
				label: edge.label,
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

/**
 * Create and provide flow context
 */
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

/**
 * Get flow from context
 */
export function getFlow(): FlowState {
	const flow = getContext<FlowState>(FLOW_CONTEXT_KEY);
	if (!flow) {
		throw new Error('getFlow must be called within a Canvas component');
	}
	return flow;
}

import type { Component } from 'svelte';

// Position in 2D space
export interface Position {
	x: number;
	y: number;
}

// Handle position on a node
export type HandlePosition = 'left' | 'right' | 'top' | 'bottom';

// Handle type (input or output)
export type HandleType = 'input' | 'output';

// Handle definition for a node
export interface HandleDefinition {
	// Unique handle ID within the node
	id: string;
	// Whether this is an input or output handle
	type: HandleType;
	// Custom port type name (e.g., "raw", "processed", "signal")
	port: string;
	// Position on the node
	position: HandlePosition;
	// Optional: additional port types this input accepts
	accept?: string[];
	// Optional: label to display
	label?: string;
}

// Runtime handle state with computed position
export interface HandleState extends HandleDefinition {
	// Absolute position in canvas coordinates
	absolute_position: Position;
}

// Flow node definition
export interface FlowNode<T = Record<string, unknown>> {
	// Unique node ID
	id: string;
	// Node type - maps to a custom component
	type: string;
	// Position in canvas coordinates (relative to parent if has parent_id)
	position: Position;
	// Custom data for the node
	data: T;
	// Optional: fixed width
	width?: number;
	// Optional: fixed height
	height?: number;
	// Optional: whether the node is selected
	selected?: boolean;
	// Optional: parent group node ID (for grouping)
	parent_id?: string;
	// Optional: z-index for layering (groups typically have lower z-index)
	z_index?: number;
}

// Runtime node state with computed values
export interface NodeState<T = Record<string, unknown>> extends FlowNode<T> {
	// Registered handles with their absolute positions
	handles: Map<string, HandleState>;
	// Computed dimensions from DOM
	computed_width: number;
	computed_height: number;
}

// Edge type for rendering
export type EdgeType = 'bezier' | 'straight' | 'step';

// Edge stroke style
export type EdgeStyle = 'solid' | 'dashed' | 'dotted';

// Flow edge definition
export interface FlowEdge {
	// Unique edge ID
	id: string;
	// Source node ID
	source: string;
	// Source handle ID
	source_handle: string;
	// Target node ID
	target: string;
	// Target handle ID
	target_handle: string;
	// Edge rendering type
	type?: EdgeType;
	// Optional label
	label?: string;
	// Optional: whether the edge is selected
	selected?: boolean;
	// Optional: waypoints for custom edge routing
	waypoints?: Position[];
	// Optional: stroke style (solid, dashed, dotted)
	style?: EdgeStyle;
	// Optional: whether the edge is animated (dashed lines move)
	animated?: boolean;
	// Optional: custom stroke color
	color?: string;
}

// Complete flow definition (JSON export format)
export interface Flow {
	nodes: FlowNode[];
	edges: FlowEdge[];
}

// Viewport state for pan/zoom
export interface Viewport {
	x: number;
	y: number;
	zoom: number;
}

// Props passed to custom node components
export interface NodeProps<T = Record<string, unknown>> {
	// Node ID
	id: string;
	// Custom data
	data: T;
	// Whether the node is selected
	selected: boolean;
}

// Connection being dragged
export interface DraftConnection {
	// Source node ID
	source_node_id: string;
	// Source handle ID
	source_handle_id: string;
	// Source handle port type
	source_port: string;
	// Source handle position type (left, right, top, bottom)
	source_handle_position: HandlePosition;
	// Source handle absolute position
	source_position: Position;
	// Current mouse position
	target_position: Position;
}

// Node type registry mapping type names to Svelte components
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type NodeTypes = Record<string, Component<NodeProps<any>>>;

// Configuration for flow behavior
export interface FlowConfig {
	// Minimum zoom level
	min_zoom?: number;
	// Maximum zoom level
	max_zoom?: number;
	// Snap nodes to grid
	snap_to_grid?: boolean;
	// Grid size for snapping
	grid_size?: number;
	// Allow deleting nodes/edges
	allow_delete?: boolean;
	// Default edge type
	default_edge_type?: EdgeType;
	// Lock the flow to prevent modifications (nodes can't be moved, edges can't be created/deleted)
	locked?: boolean;
}

// Event callbacks
export interface FlowCallbacks {
	on_node_click?: (node_id: string) => void;
	on_node_drag_start?: (node_id: string) => void;
	on_node_drag_end?: (node_id: string, position: Position) => void;
	on_connect?: (edge: FlowEdge) => void;
	on_edge_click?: (edge_id: string) => void;
	on_delete?: (node_ids: string[], edge_ids: string[]) => void;
	on_viewport_change?: (viewport: Viewport) => void;
}

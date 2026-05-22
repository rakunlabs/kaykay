import type { FlowEdge, FlowNode, NodeState, Rect, Viewport } from '../types/index.js';

type BoundsNode = FlowNode | NodeState;

function nodeWidth(node: BoundsNode): number {
	return node.width ?? ('computed_width' in node ? node.computed_width : 0);
}

function nodeHeight(node: BoundsNode): number {
	return node.height ?? ('computed_height' in node ? node.computed_height : 0);
}

export function isNode(value: unknown): value is FlowNode {
	if (typeof value !== 'object' || value === null) return false;
	const node = value as Partial<FlowNode>;
	return (
		typeof node.id === 'string' &&
		typeof node.type === 'string' &&
		typeof node.position === 'object' &&
		node.position !== null &&
		typeof node.position.x === 'number' &&
		typeof node.position.y === 'number'
	);
}

export function isEdge(value: unknown): value is FlowEdge {
	if (typeof value !== 'object' || value === null) return false;
	const edge = value as Partial<FlowEdge>;
	return (
		typeof edge.id === 'string' &&
		typeof edge.source === 'string' &&
		typeof edge.source_handle === 'string' &&
		typeof edge.target === 'string' &&
		typeof edge.target_handle === 'string'
	);
}

export function getConnectedEdges(nodes: FlowNode[], edges: FlowEdge[]): FlowEdge[] {
	const node_ids = new Set(nodes.map((node) => node.id));
	return edges.filter((edge) => node_ids.has(edge.source) || node_ids.has(edge.target));
}

export function getIncomers(node: FlowNode, nodes: FlowNode[], edges: FlowEdge[]): FlowNode[] {
	const incoming_ids = new Set(edges.filter((edge) => edge.target === node.id).map((edge) => edge.source));
	return nodes.filter((candidate) => incoming_ids.has(candidate.id));
}

export function getOutgoers(node: FlowNode, nodes: FlowNode[], edges: FlowEdge[]): FlowNode[] {
	const outgoing_ids = new Set(edges.filter((edge) => edge.source === node.id).map((edge) => edge.target));
	return nodes.filter((candidate) => outgoing_ids.has(candidate.id));
}

export function getNodesBounds(nodes: BoundsNode[]): Rect {
	if (nodes.length === 0) {
		return { x: 0, y: 0, width: 0, height: 0 };
	}

	let min_x = Infinity;
	let min_y = Infinity;
	let max_x = -Infinity;
	let max_y = -Infinity;

	for (const node of nodes) {
		min_x = Math.min(min_x, node.position.x);
		min_y = Math.min(min_y, node.position.y);
		max_x = Math.max(max_x, node.position.x + nodeWidth(node));
		max_y = Math.max(max_y, node.position.y + nodeHeight(node));
	}

	return {
		x: min_x,
		y: min_y,
		width: max_x - min_x,
		height: max_y - min_y,
	};
}

export function getViewportForBounds(
	bounds: Rect,
	width: number,
	height: number,
	min_zoom = 0.1,
	max_zoom = 4,
	padding = 0
): Viewport {
	if (bounds.width <= 0 || bounds.height <= 0 || width <= 0 || height <= 0) {
		return { x: 0, y: 0, zoom: 1 };
	}

	const content_width = bounds.width + padding * 2;
	const content_height = bounds.height + padding * 2;
	const zoom = Math.max(min_zoom, Math.min(max_zoom, Math.min(width / content_width, height / content_height)));
	const center_x = bounds.x + bounds.width / 2;
	const center_y = bounds.y + bounds.height / 2;

	return {
		x: width / 2 - center_x * zoom,
		y: height / 2 - center_y * zoom,
		zoom,
	};
}

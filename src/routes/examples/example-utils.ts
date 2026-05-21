import type { Flow, FlowEdge, FlowNode } from '../../lib/types/index.js';

function cloneSerializable<T>(value: T): T {
	if (value === undefined) return value;

	if (typeof structuredClone === 'function') {
		try {
			return structuredClone(value);
		} catch {
			// Fall through for plain serializable demo data.
		}
	}

	return JSON.parse(JSON.stringify(value)) as T;
}

export function cloneFlowNodes(nodes: FlowNode[]): FlowNode[] {
	return nodes.map((node) => ({
		...node,
		position: { ...node.position },
		data: cloneSerializable(node.data),
	}));
}

export function cloneFlowEdges(edges: FlowEdge[]): FlowEdge[] {
	return edges.map((edge) => ({
		...edge,
		waypoints: edge.waypoints?.map((waypoint) => ({ ...waypoint })),
	}));
}

export function cloneFlow(flow: Flow): Flow {
	return {
		nodes: cloneFlowNodes(flow.nodes),
		edges: cloneFlowEdges(flow.edges),
	};
}

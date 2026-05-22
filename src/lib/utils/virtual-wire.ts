import type {
	Flow,
	FlowEdge,
	FlowNode,
	NodeState,
	VirtualWireChannel,
	VirtualWireResolvedEdgeData,
	VirtualWireNodeData,
} from '../types/index.js';

export const VIRTUAL_WIRE_INPUT_TYPE = 'virtual-wire-input';
export const VIRTUAL_WIRE_OUTPUT_TYPE = 'virtual-wire-output';

type AnyNode = FlowNode | NodeState;
type VirtualWireEdgeMetadata = VirtualWireResolvedEdgeData['kaykay_virtual_wire'];

interface VirtualWireDirectEdge {
	edge: FlowEdge;
	metadata: VirtualWireEdgeMetadata;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

function getNodeData(node: AnyNode): Record<string, unknown> | null {
	return isRecord(node.data) ? node.data : null;
}

function cloneSerializable<T>(value: T): T {
	if (value === undefined) return value;
	return JSON.parse(JSON.stringify(value)) as T;
}

function cloneNode(node: FlowNode): FlowNode {
	return {
		...node,
		position: { ...node.position },
		data: cloneSerializable(node.data),
	};
}

function cloneEdge(edge: FlowEdge): FlowEdge {
	return {
		...edge,
		waypoints: edge.waypoints?.map((waypoint) => ({ ...waypoint })),
		data: edge.data === undefined ? undefined : cloneSerializable(edge.data),
	};
}

function isVirtualWireTypedNode(node: AnyNode): boolean {
	return node.type === VIRTUAL_WIRE_INPUT_TYPE || node.type === VIRTUAL_WIRE_OUTPUT_TYPE;
}

function getVirtualWireEdgeMetadata(edge: FlowEdge): VirtualWireEdgeMetadata | null {
	const data = isRecord(edge.data) ? edge.data : null;
	const metadata = data?.kaykay_virtual_wire;
	if (!isRecord(metadata)) return null;
	if (
		metadata.version !== 1 ||
		typeof metadata.pair_id !== 'string' ||
		typeof metadata.channel_id !== 'string' ||
		typeof metadata.input_node_id !== 'string' ||
		typeof metadata.output_node_id !== 'string' ||
		typeof metadata.input_edge_id !== 'string' ||
		typeof metadata.output_edge_id !== 'string'
	) {
		return null;
	}

	return {
		version: 1,
		pair_id: metadata.pair_id,
		channel_id: metadata.channel_id,
		input_node_id: metadata.input_node_id,
		output_node_id: metadata.output_node_id,
		input_edge_id: metadata.input_edge_id,
		output_edge_id: metadata.output_edge_id,
	};
}

function attachVirtualWireEdgeMetadata(edge: FlowEdge, metadata: VirtualWireEdgeMetadata): FlowEdge {
	const cloned_edge = cloneEdge(edge);
	const data = isRecord(cloned_edge.data) ? cloned_edge.data : {};
	return {
		...cloned_edge,
		data: {
			...data,
			kaykay_virtual_wire: metadata,
		},
	};
}

function getVirtualWireResolvedEdgeId(input_edge_id: string, output_edge_id: string): string {
	return `virtual:${input_edge_id}:${output_edge_id}`;
}

function createVirtualWireSegment(
	edge: FlowEdge,
	updates: Pick<FlowEdge, 'source' | 'source_handle' | 'target' | 'target_handle'>
): FlowEdge {
	return {
		...cloneEdge(edge),
		...updates,
	};
}

function normalizeChannel(channel: unknown): VirtualWireChannel | null {
	if (!isRecord(channel) || typeof channel.id !== 'string' || channel.id.length === 0) return null;
	return {
		id: channel.id,
		label: typeof channel.label === 'string' ? channel.label : undefined,
		port: typeof channel.port === 'string' ? channel.port : undefined,
	};
}

function sortChannels(channels: VirtualWireChannel[]): VirtualWireChannel[] {
	return channels.sort((a, b) => {
		const a_num = Number(a.id);
		const b_num = Number(b.id);
		if (Number.isFinite(a_num) && Number.isFinite(b_num)) return a_num - b_num;
		return a.id.localeCompare(b.id);
	});
}

export function normalizeVirtualWireChannels(channels: unknown): VirtualWireChannel[] {
	if (!Array.isArray(channels)) return [{ id: '1', label: '1' }];

	const seen = new Set<string>();
	const normalized: VirtualWireChannel[] = [];
	for (const channel of channels) {
		const normalized_channel = normalizeChannel(channel);
		if (!normalized_channel || seen.has(normalized_channel.id)) continue;
		seen.add(normalized_channel.id);
		normalized.push(normalized_channel);
	}

	return normalized.length > 0 ? sortChannels(normalized) : [{ id: '1', label: '1' }];
}

export function getNextVirtualWireChannelId(channels: VirtualWireChannel[]): string {
	let max_id = 0;
	for (const channel of channels) {
		const numeric_id = Number(channel.id);
		if (Number.isInteger(numeric_id) && numeric_id > max_id) {
			max_id = numeric_id;
		}
	}
	return String(max_id + 1);
}

export function getVirtualWireInputHandleId(channel_id: string): string {
	return `in-${channel_id}`;
}

export function getVirtualWireOutputHandleId(channel_id: string): string {
	return `out-${channel_id}`;
}

export function getVirtualWireInputChannelId(handle_id: string): string | null {
	return handle_id.startsWith('in-') ? handle_id.slice(3) : null;
}

export function getVirtualWireOutputChannelId(handle_id: string): string | null {
	return handle_id.startsWith('out-') ? handle_id.slice(4) : null;
}

export function getVirtualWirePairId(node: AnyNode): string | null {
	const data = getNodeData(node);
	return typeof data?.pair_id === 'string' && data.pair_id.length > 0 ? data.pair_id : null;
}

export function isVirtualWireInputNode(node: AnyNode): boolean {
	return node.type === VIRTUAL_WIRE_INPUT_TYPE && getVirtualWirePairId(node) !== null;
}

export function isVirtualWireOutputNode(node: AnyNode): boolean {
	return node.type === VIRTUAL_WIRE_OUTPUT_TYPE && getVirtualWirePairId(node) !== null;
}

export function isVirtualWireNode(node: AnyNode): boolean {
	return isVirtualWireInputNode(node) || isVirtualWireOutputNode(node);
}

export function getVirtualWireNodeChannels(node: AnyNode): VirtualWireChannel[] {
	return normalizeVirtualWireChannels(getNodeData(node)?.channels);
}

export function mergeVirtualWireChannels(nodes: AnyNode[]): VirtualWireChannel[] {
	const channels_by_id = new Map<string, VirtualWireChannel>();
	for (const node of nodes) {
		for (const channel of getVirtualWireNodeChannels(node)) {
			if (!channels_by_id.has(channel.id)) {
				channels_by_id.set(channel.id, channel);
			}
		}
	}
	return sortChannels([...channels_by_id.values()]);
}

export function resolveVirtualWireEdges(nodes: FlowNode[], edges: FlowEdge[]): FlowEdge[] {
	const nodes_by_id = new Map(nodes.map((node) => [node.id, node]));
	const virtual_node_ids = new Set(nodes.filter(isVirtualWireTypedNode).map((node) => node.id));
	const resolved_edges: FlowEdge[] = [];

	for (const edge of edges) {
		if (!virtual_node_ids.has(edge.source) && !virtual_node_ids.has(edge.target)) {
			resolved_edges.push(cloneEdge(edge));
		}
	}

	const input_nodes = nodes.filter(isVirtualWireInputNode);
	const output_nodes = nodes.filter(isVirtualWireOutputNode);

	for (const input_node of input_nodes) {
		const pair_id = getVirtualWirePairId(input_node);
		if (!pair_id) continue;

		const matching_outputs = output_nodes.filter((node) => getVirtualWirePairId(node) === pair_id);
		if (matching_outputs.length === 0) continue;

		const incoming_edges = edges.filter((edge) => edge.target === input_node.id);
		for (const incoming_edge of incoming_edges) {
			const channel_id = getVirtualWireInputChannelId(incoming_edge.target_handle);
			if (!channel_id) continue;

			for (const output_node of matching_outputs) {
				const output_handle = getVirtualWireOutputHandleId(channel_id);
				const outgoing_edges = edges.filter((edge) => edge.source === output_node.id && edge.source_handle === output_handle);

				for (const outgoing_edge of outgoing_edges) {
					if (!nodes_by_id.has(incoming_edge.source) || !nodes_by_id.has(outgoing_edge.target)) continue;

					const metadata: VirtualWireEdgeMetadata = {
						version: 1,
						pair_id,
						channel_id,
						input_node_id: input_node.id,
						output_node_id: output_node.id,
						input_edge_id: incoming_edge.id,
						output_edge_id: outgoing_edge.id,
					};

					resolved_edges.push(attachVirtualWireEdgeMetadata({
						...outgoing_edge,
						id: getVirtualWireResolvedEdgeId(incoming_edge.id, outgoing_edge.id),
						source: incoming_edge.source,
						source_handle: incoming_edge.source_handle,
						target: outgoing_edge.target,
						target_handle: outgoing_edge.target_handle,
					}, metadata));
				}
			}
		}
	}

	return resolved_edges;
}

export function flattenVirtualWireFlow(flow: Flow): Flow {
	const virtual_nodes = flow.nodes.filter(isVirtualWireTypedNode).map(cloneNode);
	const virtual_node_ids = new Set(virtual_nodes.map((node) => node.id));
	const nodes = flow.nodes
		.filter((node) => !virtual_node_ids.has(node.id))
		.map(cloneNode);
	const edges = resolveVirtualWireEdges(flow.nodes, flow.edges);

	if (virtual_nodes.length === 0) {
		return {
			nodes,
			edges,
			kaykay: flow.kaykay === undefined ? undefined : cloneSerializable(flow.kaykay),
		};
	}

	const virtual_edges = flow.edges
		.filter((edge) => virtual_node_ids.has(edge.source) || virtual_node_ids.has(edge.target))
		.map(cloneEdge);

	return {
		nodes,
		edges,
		kaykay: {
			...(flow.kaykay === undefined ? {} : cloneSerializable(flow.kaykay)),
			version: 1,
			virtual_wires: {
				version: 1,
				nodes: virtual_nodes,
				edges: virtual_edges,
			},
		},
	};
}

export function hydrateVirtualWireFlow(flow: Flow): Flow {
	const virtual_wires = flow.kaykay?.virtual_wires;
	if (!virtual_wires || !Array.isArray(virtual_wires.nodes) || !Array.isArray(virtual_wires.edges)) {
		return {
			nodes: flow.nodes.map(cloneNode),
			edges: flow.edges.map(cloneEdge),
			kaykay: flow.kaykay === undefined ? undefined : cloneSerializable(flow.kaykay),
		};
	}

	const nodes = flow.nodes.map(cloneNode);
	const seen_node_ids = new Set(nodes.map((node) => node.id));
	for (const node of virtual_wires.nodes) {
		if (!isVirtualWireTypedNode(node) || seen_node_ids.has(node.id)) continue;
		nodes.push(cloneNode(node));
		seen_node_ids.add(node.id);
	}

	const node_ids = new Set(nodes.map((node) => node.id));
	const virtual_edges_by_id = new Map(virtual_wires.edges.map((edge) => [edge.id, edge]));
	const resolved_virtual_edges = resolveVirtualWireEdges([...flow.nodes, ...virtual_wires.nodes], virtual_wires.edges);
	const metadata_by_resolved_edge_id = new Map<string, VirtualWireEdgeMetadata>();
	const completed_virtual_edge_ids = new Set<string>();
	for (const edge of resolved_virtual_edges) {
		const metadata = getVirtualWireEdgeMetadata(edge);
		if (!metadata) continue;
		metadata_by_resolved_edge_id.set(edge.id, metadata);
		completed_virtual_edge_ids.add(metadata.input_edge_id);
		completed_virtual_edge_ids.add(metadata.output_edge_id);
	}

	const direct_virtual_edges: VirtualWireDirectEdge[] = [];
	const direct_virtual_edge_ids = new Set<string>();
	for (const edge of flow.edges) {
		const metadata = getVirtualWireEdgeMetadata(edge) ?? metadata_by_resolved_edge_id.get(edge.id) ?? null;
		if (!metadata) continue;
		if (!virtual_edges_by_id.has(metadata.input_edge_id) || !virtual_edges_by_id.has(metadata.output_edge_id)) continue;
		if (!node_ids.has(edge.source) || !node_ids.has(edge.target)) continue;
		if (!node_ids.has(metadata.input_node_id) || !node_ids.has(metadata.output_node_id)) continue;

		direct_virtual_edges.push({ edge, metadata });
		direct_virtual_edge_ids.add(edge.id);
	}

	const edges = flow.edges
		.filter((edge) => !direct_virtual_edge_ids.has(edge.id))
		.map(cloneEdge);
	const seen_edge_ids = new Set(edges.map((edge) => edge.id));

	function addHydratedEdge(edge: FlowEdge): void {
		if (seen_edge_ids.has(edge.id)) return;
		if (!node_ids.has(edge.source) || !node_ids.has(edge.target)) return;
		edges.push(edge);
		seen_edge_ids.add(edge.id);
	}

	for (const { edge, metadata } of direct_virtual_edges) {
		const input_edge = virtual_edges_by_id.get(metadata.input_edge_id);
		const output_edge = virtual_edges_by_id.get(metadata.output_edge_id);
		if (!input_edge || !output_edge) continue;

		addHydratedEdge(createVirtualWireSegment(input_edge, {
			source: edge.source,
			source_handle: edge.source_handle,
			target: metadata.input_node_id,
			target_handle: input_edge.target_handle,
		}));
		addHydratedEdge(createVirtualWireSegment(output_edge, {
			source: metadata.output_node_id,
			source_handle: output_edge.source_handle,
			target: edge.target,
			target_handle: edge.target_handle,
		}));
	}

	for (const edge of virtual_wires.edges) {
		if (completed_virtual_edge_ids.has(edge.id)) continue;
		addHydratedEdge(cloneEdge(edge));
	}

	return { nodes, edges };
}

export function createVirtualWireNodeData(pair_id: string, label?: string): VirtualWireNodeData {
	return {
		pair_id,
		pair_label: label ?? pair_id,
		label,
		channels: [{ id: '1', label: '1' }],
	};
}

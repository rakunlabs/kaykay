<script lang="ts">
	import { getContext } from 'svelte';
	import type { NodeProps, NodeState, VirtualWireChannel, VirtualWireNodeData } from '../types/index.js';
	import type { FlowState } from '../stores/flow.svelte.js';
	import Handle from './Handle.svelte';
	import {
		getNextVirtualWireChannelId,
		getVirtualWireInputHandleId,
		getVirtualWireOutputHandleId,
		getVirtualWirePairId,
		isVirtualWireInputNode,
		isVirtualWireNode,
		mergeVirtualWireChannels,
		normalizeVirtualWireChannels,
	} from '../utils/virtual-wire.js';

	let { id, data }: NodeProps<VirtualWireNodeData> = $props();

	const FLOW_CONTEXT_KEY = Symbol.for('kaykay-flow');
	const flow = getContext<FlowState>(FLOW_CONTEXT_KEY);

	const pairId = $derived(data.pair_id || id);
	const pairLabel = $derived(data.pair_label ?? pairId);
	const accentColor = $derived(data.color ?? '#38bdf8');
	const pairNodes = $derived.by(() => getPairNodes());
	const channels = $derived.by(() => {
		if (pairNodes.length === 0) return normalizeVirtualWireChannels(data.channels);
		return mergeVirtualWireChannels(pairNodes);
	});
	const channelStates = $derived.by(() => channels.map((channel) => ({
		channel,
		port: getChannelSourcePort(channel),
	})));

	function getPairNodes(): NodeState[] {
		return flow.nodes.filter((node) => isVirtualWireNode(node) && getVirtualWirePairId(node) === pairId);
	}

	function getChannelSourcePort(channel: VirtualWireChannel): string {
		const input_handle_id = getVirtualWireInputHandleId(channel.id);
		for (const node of flow.nodes) {
			if (!isVirtualWireInputNode(node) || getVirtualWirePairId(node) !== pairId) continue;

			const incoming_edge = flow.edges.find((edge) => edge.target === node.id && edge.target_handle === input_handle_id);
			if (!incoming_edge) continue;

			const source_handle = flow.getHandle(incoming_edge.source, incoming_edge.source_handle);
			if (source_handle?.port) return source_handle.port;
		}

		return channel.port ?? '*';
	}

	function getChannelLabel(channel: VirtualWireChannel): string {
		return channel.label ?? `Channel ${channel.id}`;
	}

	function getChannelEdgeIds(channel_id: string): string[] {
		const pair_node_ids = new Set(getPairNodes().map((node) => node.id));
		const input_handle_id = getVirtualWireInputHandleId(channel_id);
		const output_handle_id = getVirtualWireOutputHandleId(channel_id);
		return flow.edges
			.filter((edge) =>
				(pair_node_ids.has(edge.target) && edge.target_handle === input_handle_id) ||
				(pair_node_ids.has(edge.source) && edge.source_handle === output_handle_id)
			)
			.map((edge) => edge.id);
	}

	function applyChannelChanges(next_channels: VirtualWireChannel[], edge_ids_to_remove: string[] = []): void {
		if (flow.locked) return;

		const targets = getPairNodes();
		flow.beginTransaction();
		for (const node of targets) {
			flow.updateNodeData<VirtualWireNodeData>(node.id, { channels: next_channels });
		}
		if (targets.length === 0) {
			flow.updateNodeData<VirtualWireNodeData>(id, { channels: next_channels });
		}
		for (const edge_id of edge_ids_to_remove) {
			flow.removeEdge(edge_id);
		}
		flow.endTransaction(true, edge_ids_to_remove.length > 0 ? 'batch' : 'node:data');
	}

	function updatePairLabel(label: string): void {
		if (flow.locked) return;

		const targets = getPairNodes();
		flow.beginTransaction();
		for (const node of targets) {
			flow.updateNodeData<VirtualWireNodeData>(node.id, { pair_label: label });
		}
		if (targets.length === 0) {
			flow.updateNodeData<VirtualWireNodeData>(id, { pair_label: label });
		}
		flow.endTransaction(true, 'node:data');
	}

	function addChannel(e: MouseEvent): void {
		e.stopPropagation();
		const channel_id = getNextVirtualWireChannelId(channels);
		applyChannelChanges([...channels, { id: channel_id, label: `Channel ${channel_id}` }]);
	}

	function updateChannelLabel(channel_id: string, label: string): void {
		applyChannelChanges(channels.map((channel) =>
			channel.id === channel_id ? { ...channel, label } : channel
		));
	}

	function removeChannel(e: MouseEvent, channel_id: string): void {
		e.stopPropagation();
		if (channels.length <= 1) return;

		applyChannelChanges(
			channels.filter((channel) => channel.id !== channel_id),
			getChannelEdgeIds(channel_id)
		);
	}
</script>

<div class="kaykay-virtual-wire kaykay-virtual-wire-output" style:--kaykay-virtual-wire-accent={accentColor}>
	<div class="virtual-wire-header">
		<span class="virtual-wire-kind">Portal Out</span>
		<div class="virtual-wire-header-actions">
			<input
				class="virtual-wire-pair-name"
				data-kaykay-no-drag
				value={pairLabel}
				title="Pair ID: {pairId}"
				oninput={(e) => updatePairLabel(e.currentTarget.value)}
				onkeydown={(e) => e.stopPropagation()}
				aria-label="Virtual wire pair name"
			/>
			<button type="button" class="virtual-wire-add" data-kaykay-no-drag onclick={addChannel} disabled={flow.locked} aria-label="Add virtual wire channel">+</button>
		</div>
	</div>

	<div class="virtual-wire-channels" aria-label="Virtual wire output channels">
		{#each channelStates as state (state.channel.id)}
			<div class="virtual-wire-channel">
				<input
					class="virtual-wire-channel-name"
					data-kaykay-no-drag
					value={getChannelLabel(state.channel)}
					oninput={(e) => updateChannelLabel(state.channel.id, e.currentTarget.value)}
					onkeydown={(e) => e.stopPropagation()}
					aria-label="Virtual wire channel name"
				/>
				<small>{state.port === '*' ? 'any' : state.port}</small>
				<button
					type="button"
					class="virtual-wire-delete"
					data-kaykay-no-drag
					onclick={(e) => removeChannel(e, state.channel.id)}
					disabled={flow.locked || channelStates.length <= 1}
					aria-label="Delete virtual wire channel"
				>×</button>
				<Handle
					id={getVirtualWireOutputHandleId(state.channel.id)}
					type="output"
					port={state.port}
					position="right"
					class="virtual-wire-socket"
				/>
			</div>
		{/each}
	</div>
</div>

<style>
	.kaykay-virtual-wire {
		min-width: 150px;
		padding: 12px;
		background: #111827;
		border: 2px solid var(--kaykay-virtual-wire-accent, #38bdf8);
		border-radius: 12px;
		box-shadow: 0 10px 28px rgba(0, 0, 0, 0.28);
		position: relative;
		color: #f8fafc;
	}

	:global(.kaykay-light) .kaykay-virtual-wire {
		background: #fff;
		color: #111827;
		box-shadow: 0 10px 28px rgba(15, 23, 42, 0.12);
	}

	.virtual-wire-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
		margin-bottom: 8px;
	}

	.virtual-wire-header-actions {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.virtual-wire-kind {
		font-size: 0.63rem;
		font-weight: 800;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	.virtual-wire-kind {
		color: var(--kaykay-virtual-wire-accent, #38bdf8);
	}

	.virtual-wire-pair-name {
		width: 92px;
		min-width: 0;
		padding: 2px 6px;
		border: 0;
		outline: 0;
		border-radius: 0;
		background: color-mix(in srgb, var(--kaykay-virtual-wire-accent, #38bdf8) 18%, transparent);
		color: var(--kaykay-virtual-wire-accent, #38bdf8);
		font: inherit;
		font-size: 0.68rem;
		font-weight: 800;
		line-height: 1.35;
		text-align: center;
	}

	.virtual-wire-pair-name:focus {
		background: color-mix(in srgb, var(--kaykay-virtual-wire-accent, #38bdf8) 28%, transparent);
	}

	.virtual-wire-channels {
		display: grid;
		gap: 6px;
		margin-bottom: 10px;
	}

	.virtual-wire-channel {
		display: grid;
		grid-template-columns: 1fr auto auto;
		align-items: center;
		gap: 6px;
		min-height: 26px;
		margin-inline: -12px;
		padding: 5px 12px;
		border-radius: 0;
		background: rgba(148, 163, 184, 0.12);
		font-size: 0.78rem;
		position: relative;
		overflow: visible;
	}

	.virtual-wire-channel-name {
		min-width: 0;
		width: 100%;
		padding: 0;
		background: transparent;
		border: 0;
		outline: 0;
		color: inherit;
		font: inherit;
		font-weight: 800;
	}

	.virtual-wire-channel-name:focus {
		color: var(--kaykay-virtual-wire-accent, #38bdf8);
	}

	:global(.virtual-wire-socket.kaykay-handle) {
		position: absolute !important;
		top: 50% !important;
		bottom: auto !important;
		margin-top: -6px !important;
		z-index: 12;
	}

	:global(.virtual-wire-socket.kaykay-handle-right) {
		right: -10px !important;
	}

	.virtual-wire-channel small {
		color: #94a3b8;
		font-size: 0.68rem;
	}

	.virtual-wire-add {
		width: 22px;
		height: 22px;
		padding: 0;
		background: var(--kaykay-virtual-wire-accent, #38bdf8);
		border: 0;
		border-radius: 0;
		color: #0f172a;
		font: inherit;
		font-size: 0.9rem;
		line-height: 1;
		font-weight: 800;
		cursor: pointer;
	}

	.virtual-wire-delete {
		opacity: 0;
		pointer-events: none;
		width: 18px;
		height: 18px;
		padding: 0;
		background: rgba(248, 113, 113, 0.14);
		border: 1px solid rgba(248, 113, 113, 0.32);
		border-radius: 0;
		color: #f87171;
		font: inherit;
		font-size: 0.78rem;
		line-height: 1;
		cursor: pointer;
		transition: opacity 0.12s ease;
	}

	.virtual-wire-channel:hover .virtual-wire-delete:not(:disabled),
	.virtual-wire-channel:focus-within .virtual-wire-delete:not(:disabled) {
		opacity: 1;
		pointer-events: auto;
	}

	.virtual-wire-channel:hover .virtual-wire-delete:disabled,
	.virtual-wire-channel:focus-within .virtual-wire-delete:disabled {
		opacity: 0.35;
	}

	.virtual-wire-delete:disabled {
		cursor: not-allowed;
	}

	.virtual-wire-add:disabled {
		opacity: 0.55;
		cursor: not-allowed;
	}
</style>

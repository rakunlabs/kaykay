<script lang="ts">
	import { getContext } from 'svelte';
	import type { FlowEdge } from '../types/index.js';
	import type { FlowState } from '../stores/flow.svelte.js';
	import { getEdgePath, getEdgeCenter } from '../utils/edge-path.js';

	interface Props {
		edge: FlowEdge;
		selected: boolean;
		onselect: () => void;
	}

	const { edge, selected, onselect }: Props = $props();

	const FLOW_CONTEXT_KEY = Symbol.for('kaykay-flow');
	const flow = getContext<FlowState>(FLOW_CONTEXT_KEY);

	// Get source and target handle info (for position type like 'left', 'right')
	const source_handle = $derived(flow.getHandle(edge.source, edge.source_handle));
	const target_handle = $derived(flow.getHandle(edge.target, edge.target_handle));

	// Get reactive handle positions - these update when nodes move
	const source_position = $derived(flow.getHandlePosition(edge.source, edge.source_handle));
	const target_position = $derived(flow.getHandlePosition(edge.target, edge.target_handle));

	// Calculate path
	const path = $derived.by(() => {
		if (!source_handle || !target_handle || !source_position || !target_position) return '';

		return getEdgePath(
			source_position,
			source_handle.position,
			target_position,
			target_handle.position,
			edge.type ?? 'bezier'
		);
	});

	// Calculate label position
	const label_position = $derived.by(() => {
		if (!source_position || !target_position) return { x: 0, y: 0 };

		return getEdgeCenter(source_position, target_position);
	});

	function handleClick(e: MouseEvent) {
		e.stopPropagation();
		onselect();
	}
</script>

{#if path}
	<g class="kaykay-edge" class:selected>
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- Invisible wider path for easier selection -->
		<path class="kaykay-edge-hitbox" d={path} onclick={handleClick} />
		<!-- Visible edge path -->
		<path class="kaykay-edge-path" d={path} />

		{#if edge.label}
			<text class="kaykay-edge-label" x={label_position.x} y={label_position.y}>
				{edge.label}
			</text>
		{/if}
	</g>
{/if}

<style>
	.kaykay-edge-hitbox {
		fill: none;
		stroke: transparent;
		stroke-width: 20px;
		cursor: pointer;
		pointer-events: stroke;
	}

	.kaykay-edge-path {
		fill: none;
		stroke: #888;
		stroke-width: 2px;
		pointer-events: none;
		transition: stroke 0.15s ease;
	}

	.kaykay-edge:hover .kaykay-edge-path {
		stroke: #aaa;
	}

	.kaykay-edge.selected .kaykay-edge-path {
		stroke: #4a9eff;
		stroke-width: 3px;
	}

	.kaykay-edge-label {
		fill: #888;
		font-size: 12px;
		text-anchor: middle;
		dominant-baseline: middle;
		pointer-events: none;
		user-select: none;
	}
</style>

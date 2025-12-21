<script lang="ts">
	import { getContext } from 'svelte';
	import type { Component } from 'svelte';
	import type { NodeState, NodeProps, Position } from '../types/index.js';
	import type { FlowState } from '../stores/flow.svelte.js';

	interface Props {
		node: NodeState;
		component: Component<NodeProps>;
		selected: boolean;
	}

	const { node, component, selected }: Props = $props();

	const FLOW_CONTEXT_KEY = Symbol.for('kaykay-flow');
	const flow = getContext<FlowState>(FLOW_CONTEXT_KEY);

	let nodeEl: HTMLDivElement;
	let isDragging = $state(false);
	let dragOffset = $state<Position>({ x: 0, y: 0 });

	// Update node dimensions when mounted
	$effect(() => {
		if (nodeEl) {
			const rect = nodeEl.getBoundingClientRect();
			flow.updateNodeDimensions(node.id, rect.width / flow.viewport.zoom, rect.height / flow.viewport.zoom);
		}
	});

	function handleMouseDown(e: MouseEvent) {
		if (e.button !== 0) return;
		e.stopPropagation();

		flow.selectNode(node.id, e.shiftKey);

		// Don't allow dragging when locked
		if (flow.locked) return;

		isDragging = true;
		dragOffset = {
			x: e.clientX - node.position.x * flow.viewport.zoom - flow.viewport.x,
			y: e.clientY - node.position.y * flow.viewport.zoom - flow.viewport.y,
		};

		flow.callbacks.on_node_drag_start?.(node.id);

		window.addEventListener('mousemove', handleMouseMove);
		window.addEventListener('mouseup', handleMouseUp);
	}

	function handleMouseMove(e: MouseEvent) {
		if (!isDragging || flow.locked) return;

		const newPos: Position = {
			x: (e.clientX - dragOffset.x - flow.viewport.x) / flow.viewport.zoom,
			y: (e.clientY - dragOffset.y - flow.viewport.y) / flow.viewport.zoom,
		};

		flow.updateNodePosition(node.id, newPos);
	}

	function handleMouseUp() {
		if (isDragging) {
			isDragging = false;
			flow.callbacks.on_node_drag_end?.(node.id, node.position);
		}
		window.removeEventListener('mousemove', handleMouseMove);
		window.removeEventListener('mouseup', handleMouseUp);
	}

	// Compute style
	const nodeStyle = $derived(
		`transform: translate(${node.position.x}px, ${node.position.y}px);`
	);

	const isLocked = $derived(flow.locked);
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
	class="kaykay-node"
	class:selected
	class:dragging={isDragging}
	class:locked={isLocked}
	bind:this={nodeEl}
	style={nodeStyle}
	onmousedown={handleMouseDown}
	role="group"
	data-node-id={node.id}
>
	{#if component}
		{@const Component = component}
		<Component
			id={node.id}
			data={node.data}
			{selected}
		/>
	{/if}
</div>

<style>
	.kaykay-node {
		position: absolute;
		cursor: move;
		user-select: none;
	}

	.kaykay-node.locked {
		cursor: default;
	}

	.kaykay-node.selected {
		z-index: 10;
		outline: 2px solid #4a9eff;
	}

	.kaykay-node.dragging {
		z-index: 100;
	}
</style>

<script lang="ts">
	import { setContext } from 'svelte';
	import type {
		FlowNode,
		FlowEdge,
		NodeTypes,
		FlowConfig,
		FlowCallbacks,
		Position,
	} from '../types/index.js';
	import { FlowState } from '../stores/flow.svelte.js';
	import Node from './Node.svelte';
	import Edge from './Edge.svelte';
	import DraftEdge from './DraftEdge.svelte';

	interface Props {
		nodes?: FlowNode[];
		edges?: FlowEdge[];
		nodeTypes: NodeTypes;
		config?: FlowConfig;
		callbacks?: FlowCallbacks;
		class?: string;
		background?: import('svelte').Snippet;
		controls?: import('svelte').Snippet;
		children?: import('svelte').Snippet;
	}

	let {
		nodes = [],
		edges = [],
		nodeTypes,
		config = {},
		callbacks = {},
		class: className = '',
		background,
		controls,
		children,
	}: Props = $props();

	const FLOW_CONTEXT_KEY = Symbol.for('kaykay-flow');

	// Create flow state - we intentionally capture initial values here
	// The flow manages its own reactive state internally
	// svelte-ignore state_referenced_locally
	const flow = new FlowState(nodes, edges, config, callbacks);
	setContext(FLOW_CONTEXT_KEY, flow);

	// Export flow for external access
	export function getFlow(): FlowState {
		return flow;
	}

	let containerEl: HTMLDivElement;
	let isPanning = $state(false);
	let lastMousePos = $state<Position | null>(null);

	// Handle mouse wheel for zooming
	function handleWheel(e: WheelEvent) {
		e.preventDefault();
		const rect = containerEl.getBoundingClientRect();
		const center = {
			x: e.clientX - rect.left,
			y: e.clientY - rect.top,
		};
		flow.zoom(-e.deltaY * 0.001, center);
	}

	// Handle mouse down for panning
	function handleMouseDown(e: MouseEvent) {
		const target = e.target as HTMLElement;
		// Check if clicking on canvas background (not on a node, handle, or edge)
		const isOnNode = target.closest('[data-node-id]');
		const isOnHandle = target.closest('[data-handle-id]');
		const isOnEdge = target.closest('.kaykay-edge');
		
		// Only pan on middle mouse or when clicking on canvas background (not nodes/handles/edges)
		if (e.button === 1 || (e.button === 0 && !isOnNode && !isOnHandle && !isOnEdge)) {
			isPanning = true;
			lastMousePos = { x: e.clientX, y: e.clientY };
			flow.clearSelection();
		}
	}

	// Handle mouse move
	function handleMouseMove(e: MouseEvent) {
		if (isPanning && lastMousePos) {
			const dx = e.clientX - lastMousePos.x;
			const dy = e.clientY - lastMousePos.y;
			flow.pan(dx, dy);
			lastMousePos = { x: e.clientX, y: e.clientY };
		}

		// Update draft connection position
		if (flow.draft_connection && containerEl) {
			// Account for canvas container offset from the page
			const rect = containerEl.getBoundingClientRect();
			const relativeX = e.clientX - rect.left;
			const relativeY = e.clientY - rect.top;
			
			const canvasPos = {
				x: (relativeX - flow.viewport.x) / flow.viewport.zoom,
				y: (relativeY - flow.viewport.y) / flow.viewport.zoom,
			};
			flow.updateConnection(canvasPos);
		}
	}

	// Handle mouse up
	function handleMouseUp(e: MouseEvent) {
		isPanning = false;
		lastMousePos = null;

		// Try to complete draft connection if mouse is over a valid handle
		if (flow.draft_connection) {
			// Check if mouse is over a handle element
			const target = e.target as HTMLElement;
			const handleEl = target.closest('[data-handle-id]') as HTMLElement;
			
			if (handleEl) {
				const handleId = handleEl.getAttribute('data-handle-id');
				const handleType = handleEl.getAttribute('data-handle-type');
				const nodeEl = handleEl.closest('[data-node-id]') as HTMLElement;
				const nodeId = nodeEl?.getAttribute('data-node-id');
				
				if (handleId && nodeId && handleType === 'input') {
					flow.finishConnection(nodeId, handleId);
					return;
				}
			}
			
			// Cancel if not over a valid handle
			flow.cancelConnection();
		}
	}

	// Handle mouse leave - cancel any draft connection
	function handleMouseLeave() {
		isPanning = false;
		lastMousePos = null;
		if (flow.draft_connection) {
			flow.cancelConnection();
		}
	}

	// Handle keydown for delete
	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Delete' || e.key === 'Backspace') {
			flow.deleteSelected();
		}
		if (e.key === 'Escape') {
			flow.clearSelection();
			flow.cancelConnection();
		}
	}

	// Compute transform style
	const transformStyle = $derived(
		`translate(${flow.viewport.x}px, ${flow.viewport.y}px) scale(${flow.viewport.zoom})`
	);
</script>

<svelte:window onkeydown={handleKeyDown} />

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
	class="kaykay-canvas {className}"
	bind:this={containerEl}
	onwheel={handleWheel}
	onmousedown={handleMouseDown}
	onmousemove={handleMouseMove}
	onmouseup={handleMouseUp}
	onmouseleave={handleMouseLeave}
	role="application"
	tabindex="0"
>
	{@render background?.()}

	<!-- Edges layer (SVG) - positioned behind viewport -->
	<svg class="kaykay-edges" style:transform={transformStyle}>
		{#each flow.edges as edge (edge.id)}
			<Edge
				{edge}
				selected={flow.selected_edge_ids.has(edge.id)}
				onselect={() => flow.selectEdge(edge.id)}
			/>
		{/each}

		<!-- Draft connection -->
		{#if flow.draft_connection}
			<DraftEdge connection={flow.draft_connection} />
		{/if}
	</svg>

	<div class="kaykay-viewport" style:transform={transformStyle}>
		<!-- Nodes layer -->
		<div class="kaykay-nodes">
			{#each flow.nodes as node (node.id)}
				<Node
					{node}
					component={nodeTypes[node.type]}
					selected={flow.selected_node_ids.has(node.id)}
				/>
			{/each}
		</div>
	</div>

	{@render controls?.()}
	{@render children?.()}
</div>

<style>
	.kaykay-canvas {
		width: 100%;
		height: 100%;
		position: relative;
		overflow: hidden;
		background-color: #1a1a2e;
		background-image:
			linear-gradient(45deg, #252540 25%, transparent 25%),
			linear-gradient(-45deg, #252540 25%, transparent 25%),
			linear-gradient(45deg, transparent 75%, #252540 75%),
			linear-gradient(-45deg, transparent 75%, #252540 75%);
		background-size: 20px 20px;
		background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
		cursor: grab;
		outline: none;
	}

	.kaykay-canvas:active {
		cursor: grabbing;
	}

	.kaykay-viewport {
		position: absolute;
		top: 0;
		left: 0;
		transform-origin: 0 0;
	}

	.kaykay-edges {
		position: absolute;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		min-width: 5000px;
		min-height: 5000px;
		overflow: visible;
		pointer-events: none;
		transform-origin: 0 0;
		z-index: 0;
	}

	.kaykay-edges :global(.kaykay-edge) {
		pointer-events: auto;
	}

	.kaykay-nodes {
		position: absolute;
		top: 0;
		left: 0;
		z-index: 1;
	}
</style>

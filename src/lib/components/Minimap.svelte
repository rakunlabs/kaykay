<script lang="ts">
	import { getContext, onMount } from 'svelte';
	import type { FlowState } from '../stores/flow.svelte.js';

	interface Props {
		// Width of the minimap in pixels
		width?: number;
		// Height of the minimap in pixels
		height?: number;
		// Background color of the minimap
		backgroundColor?: string;
		// Color of the nodes in the minimap
		nodeColor?: string;
		// Color of the viewport indicator
		viewportColor?: string;
		// Additional CSS class
		class?: string;
	}

	const {
		width = 200,
		height = 150,
		backgroundColor = 'rgba(0, 0, 0, 0.8)',
		nodeColor = '#4a9eff',
		viewportColor = 'rgba(74, 158, 255, 0.3)',
		class: className = '',
	}: Props = $props();

	const FLOW_CONTEXT_KEY = Symbol.for('kaykay-flow');
	const flow = getContext<FlowState>(FLOW_CONTEXT_KEY);

	// Track canvas container size
	let canvasWidth = $state(800);
	let canvasHeight = $state(600);
	let minimapEl: HTMLDivElement;

	onMount(() => {
		// Find the parent canvas element to get its dimensions
		if (!minimapEl) return;
		const canvasEl = minimapEl.closest('.kaykay-canvas') as HTMLElement;
		if (canvasEl) {
			const updateSize = () => {
				canvasWidth = canvasEl.clientWidth;
				canvasHeight = canvasEl.clientHeight;
			};
			updateSize();

			const resizeObserver = new ResizeObserver(updateSize);
			resizeObserver.observe(canvasEl);

			return () => resizeObserver.disconnect();
		}
	});

	// Calculate bounds of all nodes
	const bounds = $derived.by(() => {
		if (flow.nodes.length === 0) {
			return { minX: 0, minY: 0, maxX: 100, maxY: 100 };
		}

		let minX = Infinity;
		let minY = Infinity;
		let maxX = -Infinity;
		let maxY = -Infinity;

		for (const node of flow.nodes) {
			const nodeWidth = node.computed_width || 100;
			const nodeHeight = node.computed_height || 50;

			minX = Math.min(minX, node.position.x);
			minY = Math.min(minY, node.position.y);
			maxX = Math.max(maxX, node.position.x + nodeWidth);
			maxY = Math.max(maxY, node.position.y + nodeHeight);
		}

		// Add padding
		const padding = 50;
		return {
			minX: minX - padding,
			minY: minY - padding,
			maxX: maxX + padding,
			maxY: maxY + padding,
		};
	});

	// Calculate scale to fit all nodes in minimap
	const scale = $derived.by(() => {
		const boundsWidth = bounds.maxX - bounds.minX;
		const boundsHeight = bounds.maxY - bounds.minY;

		if (boundsWidth === 0 || boundsHeight === 0) return 1;

		const scaleX = width / boundsWidth;
		const scaleY = height / boundsHeight;

		return Math.min(scaleX, scaleY, 1);
	});

	// Convert canvas position to minimap position
	function toMinimapPos(x: number, y: number) {
		return {
			x: (x - bounds.minX) * scale,
			y: (y - bounds.minY) * scale,
		};
	}

	// Calculate viewport rectangle in minimap
	const viewportRect = $derived.by(() => {
		// The viewport shows what's visible in the canvas container
		// viewport.x and viewport.y are the translation applied to the content
		// A positive viewport.x means content is shifted right, so we're viewing left side of canvas
		
		// Calculate the top-left corner of visible area in canvas coordinates
		const visibleLeft = -flow.viewport.x / flow.viewport.zoom;
		const visibleTop = -flow.viewport.y / flow.viewport.zoom;
		
		// Calculate visible dimensions in canvas coordinates
		const visibleWidth = canvasWidth / flow.viewport.zoom;
		const visibleHeight = canvasHeight / flow.viewport.zoom;

		// Convert to minimap coordinates
		const pos = toMinimapPos(visibleLeft, visibleTop);

		return {
			x: pos.x,
			y: pos.y,
			width: visibleWidth * scale,
			height: visibleHeight * scale,
		};
	});

	// Handle click on minimap to pan viewport
	function handleMinimapClick(clickX: number, clickY: number) {
		// Convert minimap position to canvas position
		const canvasX = clickX / scale + bounds.minX;
		const canvasY = clickY / scale + bounds.minY;

		// Calculate viewport so that clicked point is at center of canvas
		const newViewportX = -canvasX * flow.viewport.zoom + canvasWidth / 2;
		const newViewportY = -canvasY * flow.viewport.zoom + canvasHeight / 2;

		flow.setViewport({
			x: newViewportX,
			y: newViewportY,
			zoom: flow.viewport.zoom,
		});
	}

	let isDragging = $state(false);

	function handleMouseDown(e: MouseEvent) {
		isDragging = true;
		const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
		handleMinimapClick(e.clientX - rect.left, e.clientY - rect.top);
		window.addEventListener('mousemove', handleMouseMove);
		window.addEventListener('mouseup', handleMouseUp);
	}

	function handleMouseMove(e: MouseEvent) {
		if (!isDragging || !minimapEl) return;

		const rect = minimapEl.getBoundingClientRect();
		handleMinimapClick(e.clientX - rect.left, e.clientY - rect.top);
	}

	function handleMouseUp() {
		isDragging = false;
		window.removeEventListener('mousemove', handleMouseMove);
		window.removeEventListener('mouseup', handleMouseUp);
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="kaykay-minimap {className}"
	style:width="{width}px"
	style:height="{height}px"
	style:background-color={backgroundColor}
	bind:this={minimapEl}
	onmousedown={handleMouseDown}
>
	<svg {width} {height}>
		<!-- Render nodes -->
		{#each flow.nodes as node}
			{@const pos = toMinimapPos(node.position.x, node.position.y)}
			{@const nodeWidth = (node.computed_width || 100) * scale}
			{@const nodeHeight = (node.computed_height || 50) * scale}
			<rect
				x={pos.x}
				y={pos.y}
				width={nodeWidth}
				height={nodeHeight}
				fill={nodeColor}
				rx="2"
				ry="2"
			/>
		{/each}

		<!-- Render edges -->
		{#each flow.edges as edge}
			{@const sourcePos = flow.getHandlePosition(edge.source, edge.source_handle)}
			{@const targetPos = flow.getHandlePosition(edge.target, edge.target_handle)}
			{#if sourcePos && targetPos}
				{@const from = toMinimapPos(sourcePos.x, sourcePos.y)}
				{@const to = toMinimapPos(targetPos.x, targetPos.y)}
				<line
					x1={from.x}
					y1={from.y}
					x2={to.x}
					y2={to.y}
					stroke={nodeColor}
					stroke-width="1"
					opacity="0.5"
				/>
			{/if}
		{/each}

		<!-- Viewport indicator -->
		<rect
			x={viewportRect.x}
			y={viewportRect.y}
			width={viewportRect.width}
			height={viewportRect.height}
			fill={viewportColor}
			stroke={nodeColor}
			stroke-width="1"
		/>
	</svg>
</div>

<style>
	.kaykay-minimap {
		position: absolute;
		bottom: 10px;
		right: 10px;
		border-radius: 4px;
		border: 1px solid rgba(255, 255, 255, 0.1);
		cursor: pointer;
		overflow: hidden;
		z-index: 100;
	}

	.kaykay-minimap:hover {
		border-color: rgba(255, 255, 255, 0.3);
	}
</style>

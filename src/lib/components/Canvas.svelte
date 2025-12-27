<script lang="ts">
	import { setContext, onMount } from 'svelte';
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
	let isSelecting = $state(false);
	let lastMousePos = $state<Position | null>(null);
	let mouseCanvasPos = $state<Position>({ x: 0, y: 0 });
	let connectionDragDistance = $state(0); // Track how far mouse moved during connection

	// Touch state for pinch-to-zoom and panning
	let lastTouchDistance = $state<number | null>(null);
	let lastTouchCenter = $state<Position | null>(null);
	let isTouchPanning = $state(false);
	let touchStartPos = $state<Position | null>(null);

	// Track canvas dimensions for fitView
	onMount(() => {
		const updateSize = () => {
			if (containerEl) {
				flow.setCanvasDimensions(containerEl.clientWidth, containerEl.clientHeight);
			}
		};
		updateSize();

		const resizeObserver = new ResizeObserver(updateSize);
		resizeObserver.observe(containerEl);

		return () => resizeObserver.disconnect();
	});

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
		
		// Cancel draft connection if clicking on canvas background (click-to-connect mode)
		if (e.button === 0 && !isOnNode && !isOnHandle && !isOnEdge && flow.draft_connection) {
			flow.cancelConnection();
			connectionDragDistance = 0;
			return;
		}

		// Ctrl + left click on background → start selection rectangle
		if (e.button === 0 && (e.ctrlKey || e.metaKey) && !isOnNode && !isOnHandle && !isOnEdge) {
			e.preventDefault();
			isSelecting = true;
			const rect = containerEl.getBoundingClientRect();
			const canvas_pos = flow.screenToCanvas({
				x: e.clientX - rect.left,
				y: e.clientY - rect.top,
			});
			flow.startSelectionRect(canvas_pos);
			return;
		}
		
		// Only pan on middle mouse or when clicking on canvas background (not nodes/handles/edges)
		if (e.button === 1 || (e.button === 0 && !isOnNode && !isOnHandle && !isOnEdge)) {
			isPanning = true;
			lastMousePos = { x: e.clientX, y: e.clientY };
			flow.clearSelection();
		}
		
		// Reset drag distance when starting a new potential connection
		connectionDragDistance = 0;
	}

	// Handle mouse move
	function handleMouseMove(e: MouseEvent) {
		// Always track mouse position in canvas coordinates for paste
		if (containerEl) {
			const rect = containerEl.getBoundingClientRect();
			mouseCanvasPos = flow.screenToCanvas({
				x: e.clientX - rect.left,
				y: e.clientY - rect.top,
			});
		}

		// Handle selection rectangle
		if (isSelecting && flow.selection_rect) {
			flow.updateSelectionRect(mouseCanvasPos);
			return;
		}

		if (isPanning && lastMousePos) {
			const dx = e.clientX - lastMousePos.x;
			const dy = e.clientY - lastMousePos.y;
			flow.pan(dx, dy);
			lastMousePos = { x: e.clientX, y: e.clientY };
		}

		// Update draft connection position and track drag distance
		if (flow.draft_connection && containerEl) {
			// Track that user is dragging (for drag vs click detection)
			connectionDragDistance += Math.abs(e.movementX) + Math.abs(e.movementY);
			
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
		// Finish selection rectangle
		if (isSelecting) {
			isSelecting = false;
			flow.finishSelectionRect();
			return;
		}

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
					connectionDragDistance = 0;
					return;
				}
			}
			
			// Only cancel if user was dragging (not click-to-connect mode)
			// If drag distance is small, user is in click mode - don't cancel
			if (connectionDragDistance > 10) {
				flow.cancelConnection();
			}
			connectionDragDistance = 0;
		}
	}

	// Handle mouse leave - cancel any draft connection
	function handleMouseLeave() {
		isPanning = false;
		lastMousePos = null;
		if (isSelecting) {
			isSelecting = false;
			flow.cancelSelectionRect();
		}
		if (flow.draft_connection) {
			flow.cancelConnection();
		}
	}

	// Handle keydown for delete, copy, paste
	function handleKeyDown(e: KeyboardEvent) {
		// Copy
		if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
			e.preventDefault();
			flow.copySelected();
			return;
		}

		// Paste
		if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
			e.preventDefault();
			flow.paste(mouseCanvasPos);
			return;
		}

		// Select all
		if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
			e.preventDefault();
			flow.selected_node_ids = new Set(flow.nodes.map((n) => n.id));
			return;
		}

		if (e.key === 'Delete' || e.key === 'Backspace') {
			flow.deleteSelected();
		}
		if (e.key === 'Escape') {
			flow.clearSelection();
			flow.cancelConnection();
			if (isSelecting) {
				isSelecting = false;
				flow.cancelSelectionRect();
			}
		}
	}

	// Helper to calculate distance between two touch points
	function getTouchDistance(touches: TouchList): number {
		if (touches.length < 2) return 0;
		const dx = touches[0].clientX - touches[1].clientX;
		const dy = touches[0].clientY - touches[1].clientY;
		return Math.sqrt(dx * dx + dy * dy);
	}

	// Helper to calculate center point between two touches
	function getTouchCenter(touches: TouchList): Position {
		if (touches.length < 2) {
			return { x: touches[0].clientX, y: touches[0].clientY };
		}
		return {
			x: (touches[0].clientX + touches[1].clientX) / 2,
			y: (touches[0].clientY + touches[1].clientY) / 2,
		};
	}

	// Handle touch start for panning and pinch-to-zoom
	function handleTouchStart(e: TouchEvent) {
		const target = e.target as HTMLElement;
		const isOnNode = target.closest('[data-node-id]');
		const isOnHandle = target.closest('[data-handle-id]');
		const isOnEdge = target.closest('.kaykay-edge');

		// Cancel draft connection if tapping on canvas background
		if (e.touches.length === 1 && !isOnNode && !isOnHandle && !isOnEdge && flow.draft_connection) {
			flow.cancelConnection();
			connectionDragDistance = 0;
			return;
		}

		if (e.touches.length === 2) {
			// Pinch-to-zoom: track initial distance and center
			e.preventDefault();
			lastTouchDistance = getTouchDistance(e.touches);
			lastTouchCenter = getTouchCenter(e.touches);
			const rect = containerEl.getBoundingClientRect();
			touchStartPos = {
				x: lastTouchCenter.x - rect.left,
				y: lastTouchCenter.y - rect.top,
			};
		} else if (e.touches.length === 1 && !isOnNode && !isOnHandle && !isOnEdge) {
			// Single touch panning on canvas background
			isTouchPanning = true;
			lastTouchCenter = { x: e.touches[0].clientX, y: e.touches[0].clientY };
			flow.clearSelection();
		}

		connectionDragDistance = 0;
	}

	// Handle touch move for panning and pinch-to-zoom
	function handleTouchMove(e: TouchEvent) {
		if (e.touches.length === 2 && lastTouchDistance !== null && lastTouchCenter !== null && touchStartPos !== null) {
			// Pinch-to-zoom
			e.preventDefault();
			const newDistance = getTouchDistance(e.touches);
			const newCenter = getTouchCenter(e.touches);
			const rect = containerEl.getBoundingClientRect();

			// Calculate zoom delta
			const zoomDelta = (newDistance - lastTouchDistance) * 0.005;
			const center = {
				x: newCenter.x - rect.left,
				y: newCenter.y - rect.top,
			};
			flow.zoom(zoomDelta, center);

			// Also pan based on center movement
			const dx = newCenter.x - lastTouchCenter.x;
			const dy = newCenter.y - lastTouchCenter.y;
			flow.pan(dx, dy);

			lastTouchDistance = newDistance;
			lastTouchCenter = newCenter;
		} else if (isTouchPanning && lastTouchCenter !== null && e.touches.length === 1) {
			// Single touch panning
			const dx = e.touches[0].clientX - lastTouchCenter.x;
			const dy = e.touches[0].clientY - lastTouchCenter.y;
			flow.pan(dx, dy);
			lastTouchCenter = { x: e.touches[0].clientX, y: e.touches[0].clientY };
		}

		// Update draft connection position for touch
		if (flow.draft_connection && containerEl && e.touches.length === 1) {
			const touch = e.touches[0];
			const rect = containerEl.getBoundingClientRect();
			const relativeX = touch.clientX - rect.left;
			const relativeY = touch.clientY - rect.top;

			const canvasPos = {
				x: (relativeX - flow.viewport.x) / flow.viewport.zoom,
				y: (relativeY - flow.viewport.y) / flow.viewport.zoom,
			};
			flow.updateConnection(canvasPos);

			// Track movement for drag vs tap detection
			if (lastTouchCenter) {
				connectionDragDistance += Math.abs(touch.clientX - lastTouchCenter.x) + Math.abs(touch.clientY - lastTouchCenter.y);
			}
		}
	}

	// Handle touch end
	function handleTouchEnd(e: TouchEvent) {
		if (e.touches.length < 2) {
			lastTouchDistance = null;
			touchStartPos = null;
		}

		if (e.touches.length === 0) {
			// Try to complete draft connection
			if (flow.draft_connection && e.changedTouches.length > 0) {
				const touch = e.changedTouches[0];
				const target = document.elementFromPoint(touch.clientX, touch.clientY) as HTMLElement;
				const handleEl = target?.closest('[data-handle-id]') as HTMLElement;

				if (handleEl) {
					const handleId = handleEl.getAttribute('data-handle-id');
					const handleType = handleEl.getAttribute('data-handle-type');
					const nodeEl = handleEl.closest('[data-node-id]') as HTMLElement;
					const nodeId = nodeEl?.getAttribute('data-node-id');

					if (handleId && nodeId && handleType === 'input') {
						flow.finishConnection(nodeId, handleId);
						connectionDragDistance = 0;
						isTouchPanning = false;
						lastTouchCenter = null;
						return;
					}
				}

				// Only cancel if user was dragging (not tap-to-connect mode)
				if (connectionDragDistance > 10) {
					flow.cancelConnection();
				}
				connectionDragDistance = 0;
			}

			isTouchPanning = false;
			lastTouchCenter = null;
		}
	}

	// Handle touch cancel
	function handleTouchCancel() {
		isTouchPanning = false;
		lastTouchDistance = null;
		lastTouchCenter = null;
		touchStartPos = null;
		if (flow.draft_connection) {
			flow.cancelConnection();
		}
	}

	// Compute transform style
	const transformStyle = $derived(
		`translate(${flow.viewport.x}px, ${flow.viewport.y}px) scale(${flow.viewport.zoom})`
	);

	// Compute background style that moves and scales with viewport
	// Dot opacity decreases when zooming out (zoom < 1) or zooming in too much (zoom > 1)
	// Peak visibility at zoom = 1, fades on both sides
	const bgSize = $derived(20 * flow.viewport.zoom);
	const dotOpacity = $derived(Math.max(0.1, Math.min(1, flow.viewport.zoom ** 2)));
	const bgStyle = $derived(
		`background-size: ${bgSize}px ${bgSize}px; background-position: ${flow.viewport.x}px ${flow.viewport.y}px; --kaykay-canvas-dot-opacity: ${dotOpacity};`
	);
</script>

<svelte:window onkeydown={handleKeyDown} />

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
	class="kaykay-canvas {className}"
	bind:this={containerEl}
	style={bgStyle}
	onwheel={handleWheel}
	onmousedown={handleMouseDown}
	onmousemove={handleMouseMove}
	onmouseup={handleMouseUp}
	onmouseleave={handleMouseLeave}
	ontouchstart={handleTouchStart}
	ontouchmove={handleTouchMove}
	ontouchend={handleTouchEnd}
	ontouchcancel={handleTouchCancel}
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

		<!-- Selection rectangle -->
		{#if flow.selection_rect}
			{@const rect_x = Math.min(flow.selection_rect.start.x, flow.selection_rect.end.x)}
			{@const rect_y = Math.min(flow.selection_rect.start.y, flow.selection_rect.end.y)}
			{@const rect_width = Math.abs(flow.selection_rect.end.x - flow.selection_rect.start.x)}
			{@const rect_height = Math.abs(flow.selection_rect.end.y - flow.selection_rect.start.y)}
			<rect
				x={rect_x}
				y={rect_y}
				width={rect_width}
				height={rect_height}
				class="kaykay-selection-rect"
			/>
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
	/* Light mode (default) */
	.kaykay-canvas {
		--kaykay-canvas-bg: #f5f5f5;
		--kaykay-canvas-dot-rgb: 204, 204, 204;
		--kaykay-canvas-dot-opacity: 1;

		width: 100%;
		height: 100%;
		position: relative;
		overflow: hidden;
		background-color: var(--kaykay-canvas-bg);
		background-image: radial-gradient(circle, rgba(var(--kaykay-canvas-dot-rgb), var(--kaykay-canvas-dot-opacity)) 1px, transparent 1px);
		background-size: 20px 20px;
		cursor: grab;
		outline: none;
		touch-action: none; /* Prevent default touch behaviors for custom handling */
	}

	/* Dark mode - via class */
	:global(.kaykay-dark) .kaykay-canvas,
	.kaykay-canvas.kaykay-dark {
		--kaykay-canvas-bg: #252422;
		--kaykay-canvas-dot-rgb: 102, 102, 102;
	}

	.kaykay-canvas:active {
		cursor: grabbing;
	}

	.kaykay-viewport {
		position: absolute;
		top: 0;
		left: 0;
		transform-origin: 0 0;
		z-index: 2;
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
		z-index: 1;
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

	/* Selection rectangle */
	.kaykay-selection-rect {
		fill: rgba(235, 84, 37, 0.1);
		stroke: #eb5425;
		stroke-width: 1;
		stroke-dasharray: 4 2;
		pointer-events: none;
	}

	:global(.kaykay-dark) .kaykay-selection-rect,
	.kaykay-canvas.kaykay-dark .kaykay-selection-rect {
		fill: rgba(235, 84, 37, 0.15);
		stroke: #eb5425;
	}
</style>

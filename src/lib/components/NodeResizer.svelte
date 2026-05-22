<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import type { Position } from '../types/index.js';
	import { getFlow } from '../stores/flow.svelte.js';

	type ResizeDirection = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';
	type ResizeAxis = 'both' | 'horizontal' | 'vertical';

	interface ResizeParams {
		node_id: string;
		width: number;
		height: number;
		position: Position;
		direction: ResizeDirection;
	}

	interface Props {
		node_id?: string;
		is_visible?: boolean;
		min_width?: number;
		min_height?: number;
		max_width?: number;
		max_height?: number;
		keep_aspect_ratio?: boolean;
		resize_axis?: ResizeAxis;
		class?: string;
		on_resize_start?: (params: ResizeParams) => void;
		on_resize?: (params: ResizeParams) => void;
		on_resize_end?: (params: ResizeParams) => void;
	}

	let {
		node_id,
		is_visible = true,
		min_width = 40,
		min_height = 30,
		max_width = Infinity,
		max_height = Infinity,
		keep_aspect_ratio = false,
		resize_axis = 'both',
		class: className = '',
		on_resize_start,
		on_resize,
		on_resize_end,
	}: Props = $props();

	const flow = getFlow();

	let resizerEl = $state<HTMLDivElement | null>(null);
	let resolvedNodeId = $state('');
	let activeDirection = $state<ResizeDirection | null>(null);
	let startPointer = $state<Position>({ x: 0, y: 0 });
	let startSize = $state({ width: 0, height: 0 });
	let startPosition = $state<Position>({ x: 0, y: 0 });

	const directions: ResizeDirection[] = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];
	const activeDirections = $derived.by(() => {
		if (resize_axis === 'horizontal') return directions.filter((direction) => direction.includes('e') || direction.includes('w'));
		if (resize_axis === 'vertical') return directions.filter((direction) => direction.includes('n') || direction.includes('s'));
		return directions;
	});
	const node = $derived(resolvedNodeId ? flow.getNode(resolvedNodeId) : undefined);

	onMount(() => {
		if (node_id) {
			resolvedNodeId = node_id;
			return;
		}
		if (resolvedNodeId || !resizerEl) return;
		const nodeEl = resizerEl.closest('[data-node-id]');
		resolvedNodeId = nodeEl?.getAttribute('data-node-id') ?? '';
	});

	onDestroy(() => {
		if (typeof window === 'undefined') return;
		cleanupListeners();
		if (activeDirection) {
			flow.endTransaction(true, 'node:resize');
		}
	});

	function clamp(value: number, min: number, max: number): number {
		return Math.max(min, Math.min(max, value));
	}

	function getResizeParams(direction: ResizeDirection): ResizeParams | null {
		const currentNode = flow.getNode(resolvedNodeId);
		if (!currentNode) return null;
		return {
			node_id: resolvedNodeId,
			width: currentNode.width ?? currentNode.computed_width,
			height: currentNode.height ?? currentNode.computed_height,
			position: { ...currentNode.position },
			direction,
		};
	}

	function startResize(e: PointerEvent, direction: ResizeDirection): void {
		if (flow.locked || !node) return;
		e.preventDefault();
		e.stopPropagation();

		activeDirection = direction;
		startPointer = { x: e.clientX, y: e.clientY };
		startSize = {
			width: node.width ?? node.computed_width,
			height: node.height ?? node.computed_height,
		};
		startPosition = { ...node.position };

		flow.beginTransaction();
		const params = getResizeParams(direction);
		if (params) on_resize_start?.(params);

		window.addEventListener('pointermove', handlePointerMove);
		window.addEventListener('pointerup', handlePointerUp);
		window.addEventListener('pointercancel', handlePointerUp);
	}

	function handlePointerMove(e: PointerEvent): void {
		if (!activeDirection || !node) return;

		const dx = (e.clientX - startPointer.x) / flow.viewport.zoom;
		const dy = (e.clientY - startPointer.y) / flow.viewport.zoom;
		let width = startSize.width;
		let height = startSize.height;
		let x = startPosition.x;
		let y = startPosition.y;

		if (activeDirection.includes('e')) width = startSize.width + dx;
		if (activeDirection.includes('s')) height = startSize.height + dy;
		if (activeDirection.includes('w')) {
			const widthDelta = Math.min(dx, startSize.width - min_width);
			width = startSize.width - widthDelta;
			x = startPosition.x + widthDelta;
		}
		if (activeDirection.includes('n')) {
			const heightDelta = Math.min(dy, startSize.height - min_height);
			height = startSize.height - heightDelta;
			y = startPosition.y + heightDelta;
		}

		if (keep_aspect_ratio && startSize.height > 0) {
			const ratio = startSize.width / startSize.height;
			if (Math.abs(width - startSize.width) > Math.abs(height - startSize.height)) {
				height = width / ratio;
			} else {
				width = height * ratio;
			}
		}

		width = clamp(width, min_width, max_width);
		height = clamp(height, min_height, max_height);

		flow.resizeNode(resolvedNodeId, width, height);
		if (activeDirection.includes('n') || activeDirection.includes('w')) {
			flow.updateNodePosition(resolvedNodeId, { x, y });
		}

		const params = getResizeParams(activeDirection);
		if (params) on_resize?.(params);
	}

	function handlePointerUp(): void {
		if (!activeDirection) return;
		const direction = activeDirection;
		activeDirection = null;
		cleanupListeners();
		flow.endTransaction(true, 'node:resize');
		const params = getResizeParams(direction);
		if (params) on_resize_end?.(params);
	}

	function cleanupListeners(): void {
		window.removeEventListener('pointermove', handlePointerMove);
		window.removeEventListener('pointerup', handlePointerUp);
		window.removeEventListener('pointercancel', handlePointerUp);
	}
</script>

{#if is_visible}
	<div class="kaykay-node-resizer {className}" bind:this={resizerEl} data-kaykay-no-drag>
		{#if node}
			{#each activeDirections as direction}
				<div
					class="kaykay-node-resizer-handle kaykay-node-resizer-{direction}"
					class:active={activeDirection === direction}
					onpointerdown={(e) => startResize(e, direction)}
					role="presentation"
				></div>
			{/each}
		{/if}
	</div>
{/if}

<style>
	.kaykay-node-resizer {
		position: absolute;
		inset: 0;
		z-index: 20;
		pointer-events: none;
	}

	.kaykay-node-resizer-handle {
		position: absolute;
		pointer-events: auto;
		touch-action: none;
		opacity: 0;
		transition: opacity 0.15s ease, background 0.15s ease;
	}

	.kaykay-node:hover .kaykay-node-resizer-handle,
	.kaykay-node.selected .kaykay-node-resizer-handle,
	.kaykay-node-resizer-handle.active {
		opacity: 1;
	}

	.kaykay-node-resizer-handle::after {
		content: '';
		position: absolute;
		background: var(--kaykay-node-resizer-color, #3b82f6);
		border-radius: 999px;
	}

	.kaykay-node-resizer-n,
	.kaykay-node-resizer-s {
		left: 8px;
		right: 8px;
		height: 8px;
		cursor: ns-resize;
	}

	.kaykay-node-resizer-n {
		top: -4px;
	}

	.kaykay-node-resizer-s {
		bottom: -4px;
	}

	.kaykay-node-resizer-e,
	.kaykay-node-resizer-w {
		top: 8px;
		bottom: 8px;
		width: 8px;
		cursor: ew-resize;
	}

	.kaykay-node-resizer-e {
		right: -4px;
	}

	.kaykay-node-resizer-w {
		left: -4px;
	}

	.kaykay-node-resizer-ne,
	.kaykay-node-resizer-nw,
	.kaykay-node-resizer-se,
	.kaykay-node-resizer-sw {
		width: 12px;
		height: 12px;
	}

	.kaykay-node-resizer-ne {
		top: -6px;
		right: -6px;
		cursor: nesw-resize;
	}

	.kaykay-node-resizer-nw {
		top: -6px;
		left: -6px;
		cursor: nwse-resize;
	}

	.kaykay-node-resizer-se {
		bottom: -6px;
		right: -6px;
		cursor: nwse-resize;
	}

	.kaykay-node-resizer-sw {
		bottom: -6px;
		left: -6px;
		cursor: nesw-resize;
	}

	.kaykay-node-resizer-n::after,
	.kaykay-node-resizer-s::after {
		left: 50%;
		top: 50%;
		width: 32px;
		height: 3px;
		transform: translate(-50%, -50%);
	}

	.kaykay-node-resizer-e::after,
	.kaykay-node-resizer-w::after {
		left: 50%;
		top: 50%;
		width: 3px;
		height: 32px;
		transform: translate(-50%, -50%);
	}

	.kaykay-node-resizer-ne::after,
	.kaykay-node-resizer-nw::after,
	.kaykay-node-resizer-se::after,
	.kaykay-node-resizer-sw::after {
		left: 50%;
		top: 50%;
		width: 8px;
		height: 8px;
		transform: translate(-50%, -50%);
	}
</style>

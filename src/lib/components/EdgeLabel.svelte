<script lang="ts">
	import type { EdgeLabelBackground, Position } from '../types/index.js';
	import { normalizeEdgeNumber } from '../utils/edge-animation.js';

	interface Props {
		label: string;
		position: Position;
		background?: boolean | EdgeLabelBackground;
		class?: string;
	}

	let { label, position, background, class: class_name = '' }: Props = $props();
	let text = $state<SVGTextElement>();
	let bounds = $state<{ x: number; y: number; width: number; height: number }>();
	const options = $derived(typeof background === 'object' && background ? background : {});
	const padding = $derived(normalizeEdgeNumber(options.padding, 4, 0, 256));
	const radius = $derived(normalizeEdgeNumber(options.radius, 4, 0, 256));

	$effect(() => {
		void label; // Remeasure after reactive text updates, even without ResizeObserver.
		const element = text;
		if (!element) return;
		let active = true;
		function measure(): void {
			if (!active || !element) return;
			try {
				const box = element.getBBox();
				bounds = { x: box.x, y: box.y, width: box.width, height: box.height };
			} catch {
				bounds = undefined;
			}
		}
		measure();
		const observer = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(measure);
		observer?.observe(element);
		const fonts = element.ownerDocument.fonts;
		void fonts?.ready.then(measure);
		fonts?.addEventListener('loadingdone', measure);
		return () => {
			active = false;
			observer?.disconnect();
			fonts?.removeEventListener('loadingdone', measure);
		};
	});
</script>

<g class="kaykay-edge-label-group" transform={`translate(${position.x} ${position.y})`}>
	{#if background && bounds}
		<rect
			class="kaykay-edge-label-background"
			x={bounds.x - padding}
			y={bounds.y - padding}
			width={bounds.width + padding * 2}
			height={bounds.height + padding * 2}
			rx={radius}
			style:fill={options.color}
			fill-opacity={normalizeEdgeNumber(options.opacity, 1, 0, 1)}
		/>
	{/if}
	<text bind:this={text} class="kaykay-edge-label {class_name}" x="0" y="0">{label}</text>
</g>

<style>
	.kaykay-edge-label-group { pointer-events: none; user-select: none; }
	.kaykay-edge-label {
		fill: var(--kaykay-edge-label, #888);
		font-size: 12px;
		text-anchor: middle;
		dominant-baseline: middle;
	}
	.kaykay-edge-label-background { fill: var(--kaykay-edge-label-bg, #fff); }
	:global(.kaykay-dark) .kaykay-edge-label-background { fill: var(--kaykay-edge-label-bg, #202022); }
</style>

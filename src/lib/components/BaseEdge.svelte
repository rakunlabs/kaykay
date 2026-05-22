<script lang="ts">
	import type { Position, EdgeStyle } from '../types/index.js';

	interface Props {
		path: string;
		selected?: boolean;
		animated?: boolean;
		label?: string;
		label_position?: Position;
		color?: string;
		style?: EdgeStyle;
		stroke_width?: number;
		class?: string;
		onclick?: (event: MouseEvent) => void;
		oncontextmenu?: (event: MouseEvent) => void;
	}

	let {
		path,
		selected = false,
		animated = false,
		label,
		label_position,
		color = 'var(--kaykay-edge-stroke, #888)',
		style,
		stroke_width = 2,
		class: className = '',
		onclick,
		oncontextmenu,
	}: Props = $props();

	function getStrokeDashArray(edge_style?: EdgeStyle): string {
		switch (edge_style) {
			case 'dashed':
				return '8 4';
			case 'dotted':
				return '2 4';
			default:
				return 'none';
		}
	}

	const strokeDashArray = $derived(getStrokeDashArray(style));
</script>

<g
	class="kaykay-base-edge {className}"
	class:selected
	class:animated
	style:color={color}
>
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<path
		class="kaykay-base-edge-hitbox"
		d={path}
		{onclick}
		{oncontextmenu}
	/>
	<path
		class="kaykay-base-edge-path"
		d={path}
		style:stroke={color}
		style:stroke-width={selected ? stroke_width + 1 : stroke_width}
		style:stroke-dasharray={strokeDashArray}
	/>
	{#if label && label_position}
		<text class="kaykay-base-edge-label" x={label_position.x} y={label_position.y}>{label}</text>
	{/if}
</g>

<style>
	.kaykay-base-edge-hitbox {
		fill: none;
		stroke: transparent;
		stroke-width: 30px;
		stroke-linecap: round;
		cursor: pointer;
		pointer-events: stroke;
	}

	.kaykay-base-edge-path {
		fill: none;
		pointer-events: none;
		transition: stroke 0.15s ease, stroke-width 0.15s ease, filter 0.15s ease;
	}

	.kaykay-base-edge:hover .kaykay-base-edge-path,
	.kaykay-base-edge.selected .kaykay-base-edge-path {
		filter: brightness(1.25);
	}

	.kaykay-base-edge.animated .kaykay-base-edge-path {
		animation: kaykay-base-edge-dash-flow 0.5s linear infinite;
	}

	@keyframes kaykay-base-edge-dash-flow {
		to {
			stroke-dashoffset: -12;
		}
	}

	.kaykay-base-edge-label {
		fill: var(--kaykay-edge-label, #888);
		font-size: 12px;
		text-anchor: middle;
		dominant-baseline: middle;
		pointer-events: none;
		user-select: none;
	}
</style>

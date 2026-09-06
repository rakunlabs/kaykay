<script lang="ts">
	import type { EdgeAnimation } from '../types/index.js';
	import { getEdgeAnimation } from '../utils/edge-animation.js';

	interface Props {
		path: string;
		animation: EdgeAnimation;
		stroke_width?: number;
	}

	let { path, animation, stroke_width = 2 }: Props = $props();
	let group = $state<SVGGElement>();
	let measure_path = $state<SVGPathElement>();
	let path_length = $state(0);
	const options = $derived(getEdgeAnimation(animation, path_length));
	const timing = $derived(getEdgeAnimation({ ...animation, speed: 48 }, path_length));
	const shapes = $derived(options.pattern === 'squares' || options.pattern === 'diamonds');

	$effect(() => {
		// Include geometry and particle changes so newly created CSS animations get the rate.
		void path;
		void path_length;
		void options.pattern;
		void options.count;
		const rate = options.speed / 48;
		for (const motion of group?.getAnimations({ subtree: true }) ?? []) {
			// Unlike changing CSS duration/delay, this preserves the current timeline position.
			motion.updatePlaybackRate(rate);
		}
	});

	$effect(() => {
		void path; // Measure the updated SVG geometry, not the endpoint distance.
		if (!measure_path || !shapes) return;
		try {
			path_length = measure_path.getTotalLength();
		} catch {
			path_length = 0;
		}
	});
</script>

<g
	bind:this={group}
	class="kaykay-edge-animation"
	aria-hidden="true"
	style:color={animation.color ?? 'inherit'}
	style:--kaykay-animation-direction={options.direction}
	style:--kaykay-animation-state={options.play_state}
>
	{#if shapes}
		<path bind:this={measure_path} d={path} fill="none" stroke="none" />
		{#each Array(options.count) as _, index}
			<g
				class="kaykay-edge-particle"
				style:offset-path={`path(${JSON.stringify(path)})`}
				style:animation-duration={`${timing.path_duration}s`}
				style:animation-delay={`${-index * timing.path_duration / options.count}s`}
			>
				<rect
					x={-options.size / 2}
					y={-options.size / 2}
					width={options.size}
					height={options.size}
					transform={options.pattern === 'diamonds' ? 'rotate(45)' : undefined}
				/>
			</g>
		{/each}
	{:else}
		<path
			class="kaykay-edge-animation-dash"
			d={path}
			stroke-width={options.pattern === 'bands' ? stroke_width : options.size}
			stroke-linecap={options.pattern === 'dots' ? 'round' : 'butt'}
			stroke-dasharray={options.dasharray}
			style:--kaykay-animation-offset={options.dash_offset}
			style:animation-duration={`${timing.dash_duration}s`}
		/>
	{/if}
</g>

<style>
	.kaykay-edge-animation { pointer-events: none; }
	.kaykay-edge-animation-dash {
		fill: none;
		stroke: currentColor;
		animation: kaykay-edge-dash linear infinite;
	}
	.kaykay-edge-particle {
		fill: currentColor;
		offset-position: 0px 0px;
		offset-anchor: 0px 0px;
		offset-rotate: auto;
		animation: kaykay-edge-travel linear infinite;
	}
	.kaykay-edge-animation-dash, .kaykay-edge-particle {
		animation-direction: var(--kaykay-animation-direction);
		animation-play-state: var(--kaykay-animation-state);
	}
	@keyframes kaykay-edge-dash {
		to { stroke-dashoffset: var(--kaykay-animation-offset); }
	}
	@keyframes kaykay-edge-travel {
		from { offset-distance: 0%; }
		to { offset-distance: 100%; }
	}
	@media (prefers-reduced-motion: reduce) {
		.kaykay-edge-animation-dash, .kaykay-edge-particle { animation-play-state: paused; }
	}
</style>

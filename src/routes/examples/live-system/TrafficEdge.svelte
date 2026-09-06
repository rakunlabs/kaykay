<script lang="ts">
	import { getContext } from 'svelte';
	import { BaseEdge } from '$lib/index.js';
	import type { EdgeProps } from '$lib/index.js';
	import { LIVE_SYSTEM, type LiveSystem } from './context.js';

	let { id, path, label_position }: EdgeProps = $props();
	const live = getContext<LiveSystem>(LIVE_SYSTEM);
	const rate = $derived(live.snapshot.edges[id] ?? 0);
</script>

<g class="kaykay-edge">
	<BaseEdge
		{path}
		color={live.line_color}
		stroke_width={3}
		label={`${Math.round(rate)} req/s`}
		{label_position}
		label_background={live.label_background ? { opacity: live.label_opacity } : false}
		animated={rate > 0}
		animation={{
			...live.animation,
			speed: (live.animation.speed ?? 60) * (live.traffic_speed ? Math.max(0.25, rate / 200) : 1),
			paused: !live.running || live.animation.paused,
		}}
	/>
</g>

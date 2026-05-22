<script lang="ts">
	import type { Snippet } from 'svelte';
	import { getFlow } from '../stores/flow.svelte.js';

	interface Props {
		target?: 'front' | 'back';
		class?: string;
		style?: string;
		children: Snippet;
	}

	let {
		target = 'front',
		class: className = '',
		style = '',
		children,
	}: Props = $props();

	const flow = getFlow();
	const transformStyle = $derived(
		`translate(${flow.viewport.x}px, ${flow.viewport.y}px) scale(${flow.viewport.zoom})`
	);
	const targetClass = $derived(target === 'front' ? 'kaykay-viewport-portal-front' : 'kaykay-viewport-portal-back');
	const wrapperStyle = $derived(`transform: ${transformStyle}; ${style}`);
</script>

<div
	class="kaykay-viewport-portal {targetClass} {className}"
	style={wrapperStyle}
>
	{@render children()}
</div>

<style>
	.kaykay-viewport-portal {
		position: absolute;
		top: 0;
		left: 0;
		transform-origin: 0 0;
		pointer-events: none;
	}

	.kaykay-viewport-portal-back {
		z-index: 0;
	}

	.kaykay-viewport-portal-front {
		z-index: 50;
	}
</style>

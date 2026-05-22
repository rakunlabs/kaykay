<script lang="ts">
	import { getFlow } from '../stores/flow.svelte.js';

	interface Props {
		variant?: 'dots' | 'lines' | 'cross';
		gap?: number;
		size?: number;
		color?: string;
		class?: string;
		style?: string;
	}

	let {
		variant = 'dots',
		gap = 20,
		size = 1,
		color = 'rgba(120, 120, 120, 0.35)',
		class: className = '',
		style = '',
	}: Props = $props();

	const flow = getFlow();
	const backgroundSize = $derived(gap * flow.viewport.zoom);
	const backgroundPosition = $derived(`${flow.viewport.x}px ${flow.viewport.y}px`);
	const backgroundImage = $derived.by(() => {
		const scaledSize = Math.max(0.5, size * flow.viewport.zoom);

		if (variant === 'lines') {
			return `linear-gradient(${color} ${scaledSize}px, transparent ${scaledSize}px), linear-gradient(90deg, ${color} ${scaledSize}px, transparent ${scaledSize}px)`;
		}

		if (variant === 'cross') {
			return `linear-gradient(${color} ${scaledSize}px, transparent ${scaledSize}px), linear-gradient(90deg, ${color} ${scaledSize}px, transparent ${scaledSize}px)`;
		}

		return `radial-gradient(circle, ${color} ${scaledSize}px, transparent ${scaledSize}px)`;
	});
	const backgroundStyle = $derived(
		`background-image: ${backgroundImage}; background-size: ${backgroundSize}px ${backgroundSize}px; background-position: ${backgroundPosition}; ${style}`
	);
</script>

<div
	class="kaykay-background kaykay-background-{variant} {className}"
	style={backgroundStyle}
></div>

<style>
	.kaykay-background {
		position: absolute;
		inset: 0;
		z-index: 0;
		pointer-events: none;
	}

	.kaykay-background-cross {
		mask-image: radial-gradient(circle at top left, #000 0 35%, transparent 36%);
		mask-size: var(--kaykay-background-cross-mask-size, 20px) var(--kaykay-background-cross-mask-size, 20px);
	}
</style>

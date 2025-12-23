<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HandlePosition } from '../types/index.js';

	interface Props {
		// Position of the handle group on the node
		position: HandlePosition;
		// Additional CSS class
		class?: string;
		// Additional inline styles
		style?: string;
		// Child handles
		children: Snippet;
	}

	const {
		position,
		class: className = '',
		style = '',
		children,
	}: Props = $props();
</script>

<div
	class="kaykay-handle-group kaykay-handle-group-{position} {className}"
	style={style}
	data-handle-group={position}
>
	{@render children()}
</div>

<style>
	.kaykay-handle-group {
		position: absolute;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
	}

	/* Left side - vertical stack on left edge */
	.kaykay-handle-group-left {
		flex-direction: column;
		left: 0;
		top: 0;
		bottom: 0;
		transform: translateX(-50%);
	}

	/* Right side - vertical stack on right edge */
	.kaykay-handle-group-right {
		flex-direction: column;
		right: 0;
		top: 0;
		bottom: 0;
		transform: translateX(50%);
	}

	/* Top side - horizontal row on top edge */
	.kaykay-handle-group-top {
		flex-direction: row;
		top: 0;
		left: 0;
		right: 0;
		transform: translateY(-50%);
	}

	/* Bottom side - horizontal row on bottom edge */
	.kaykay-handle-group-bottom {
		flex-direction: row;
		bottom: 0;
		left: 0;
		right: 0;
		transform: translateY(50%);
	}
</style>

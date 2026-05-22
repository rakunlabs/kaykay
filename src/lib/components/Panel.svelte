<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { PanelPosition } from '../types/index.js';

	interface Props {
		position?: PanelPosition;
		class?: string;
		style?: string;
		children: Snippet;
	}

	let {
		position = 'top-left',
		class: className = '',
		style = '',
		children,
	}: Props = $props();

	const positionClass = $derived(`kaykay-panel-${position}`);
</script>

<div class="kaykay-panel {positionClass} {className}" {style}>
	{@render children()}
</div>

<style>
	.kaykay-panel {
		position: absolute;
		z-index: 1000;
		pointer-events: auto;
	}

	.kaykay-panel-top-left {
		top: 10px;
		left: 10px;
	}

	.kaykay-panel-top-center {
		top: 10px;
		left: 50%;
		transform: translateX(-50%);
	}

	.kaykay-panel-top-right {
		top: 10px;
		right: 10px;
	}

	.kaykay-panel-center-left {
		top: 50%;
		left: 10px;
		transform: translateY(-50%);
	}

	.kaykay-panel-center-right {
		top: 50%;
		right: 10px;
		transform: translateY(-50%);
	}

	.kaykay-panel-bottom-left {
		bottom: 10px;
		left: 10px;
	}

	.kaykay-panel-bottom-center {
		bottom: 10px;
		left: 50%;
		transform: translateX(-50%);
	}

	.kaykay-panel-bottom-right {
		bottom: 10px;
		right: 10px;
	}
</style>

<script lang="ts">
	import Handle from '../../../lib/components/Handle.svelte';
	import type { NodeProps } from '../../../lib/types/index.js';

	let { data }: NodeProps<{ label: string }> = $props();
</script>

<div class="minimal-node">
	<span>{data.label}</span>
	<Handle id="in" type="input" port="data" position="left" />
	<Handle id="out" type="output" port="data" position="right" />
</div>

<style>
	.minimal-node {
		background: transparent;
		border: 1px solid #555;
		border-radius: 4px;
		padding: 12px 20px;
		color: #ccc;
		font-weight: 400;
		min-width: 100px;
		text-align: center;
	}

	:global(.kaykay-light) .minimal-node {
		border-color: #ccc;
		color: #555;
	}
</style>

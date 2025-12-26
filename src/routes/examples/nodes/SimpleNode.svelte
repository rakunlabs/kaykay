<script lang="ts">
	import Handle from '../../../lib/components/Handle.svelte';
	import type { NodeProps } from '../../../lib/types/index.js';

	let { data }: NodeProps<{ label: string }> = $props();
</script>

<div class="simple-node">
	<span>{data.label}</span>
	<Handle id="in" type="input" port="data" position="left" />
	<Handle id="out" type="output" port="data" position="right" />
</div>

<style>
	.simple-node {
		background: #1f1f1f;
		border: 2px solid #4a9eff;
		border-radius: 8px;
		padding: 16px 24px;
		color: #fff;
		font-weight: 500;
		min-width: 100px;
		text-align: center;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
	}

	:global(.kaykay-light) .simple-node {
		background: #fff;
		color: #333;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}
</style>

<script lang="ts">
	import Handle from '../../../lib/components/Handle.svelte';
	import type { NodeProps } from '../../../lib/types/index.js';

	let { data }: NodeProps<{ label: string }> = $props();
</script>

<div class="shadow-node">
	<span>{data.label}</span>
	<Handle id="in" type="input" port="data" position="left" />
	<Handle id="out" type="output" port="data" position="right" />
</div>

<style>
	.shadow-node {
		background: #1f1f1f;
		border: none;
		border-radius: 12px;
		padding: 16px 24px;
		color: #fff;
		font-weight: 500;
		min-width: 120px;
		text-align: center;
		box-shadow: 
			0 2px 4px rgba(0, 0, 0, 0.2),
			0 8px 16px rgba(0, 0, 0, 0.2),
			0 16px 32px rgba(0, 0, 0, 0.2);
	}

	:global(.kaykay-light) .shadow-node {
		background: #fff;
		color: #333;
	}
</style>

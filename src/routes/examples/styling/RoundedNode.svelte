<script lang="ts">
	import Handle from '../../../lib/components/Handle.svelte';
	import type { NodeProps } from '../../../lib/types/index.js';

	let { data }: NodeProps<{ label: string }> = $props();
</script>

<div class="rounded-node">
	<span>{data.label}</span>
	<Handle id="in" type="input" port="data" position="left" />
	<Handle id="out" type="output" port="data" position="right" />
</div>

<style>
	.rounded-node {
		background: #4a9eff;
		border: none;
		border-radius: 50px;
		padding: 14px 28px;
		color: #fff;
		font-weight: 600;
		min-width: 100px;
		text-align: center;
		box-shadow: 0 4px 12px rgba(74, 158, 255, 0.3);
	}
</style>

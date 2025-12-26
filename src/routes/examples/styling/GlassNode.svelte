<script lang="ts">
	import Handle from '../../../lib/components/Handle.svelte';
	import type { NodeProps } from '../../../lib/types/index.js';

	let { data }: NodeProps<{ label: string }> = $props();
</script>

<div class="glass-node">
	<span>{data.label}</span>
	<Handle id="in" type="input" port="data" position="left" />
	<Handle id="out" type="output" port="data" position="right" />
</div>

<style>
	.glass-node {
		background: rgba(255, 255, 255, 0.1);
		backdrop-filter: blur(10px);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 12px;
		padding: 16px 24px;
		color: #fff;
		font-weight: 500;
		min-width: 120px;
		text-align: center;
	}
</style>

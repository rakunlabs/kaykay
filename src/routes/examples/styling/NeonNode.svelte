<script lang="ts">
	import Handle from '../../../lib/components/Handle.svelte';
	import type { NodeProps } from '../../../lib/types/index.js';

	let { data }: NodeProps<{ label: string }> = $props();
</script>

<div class="neon-node">
	<span>{data.label}</span>
	<Handle id="in" type="input" port="data" position="left" />
	<Handle id="out" type="output" port="data" position="right" />
</div>

<style>
	.neon-node {
		background: #252422;
		border: 2px solid #22c55e;
		border-radius: 8px;
		padding: 16px 24px;
		color: #22c55e;
		font-weight: 600;
		min-width: 120px;
		text-align: center;
		box-shadow: 0 0 20px rgba(34, 197, 94, 0.5), inset 0 0 20px rgba(34, 197, 94, 0.1);
	}
</style>

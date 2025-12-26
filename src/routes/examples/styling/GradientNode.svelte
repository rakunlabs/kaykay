<script lang="ts">
	import Handle from '../../../lib/components/Handle.svelte';
	import type { NodeProps } from '../../../lib/types/index.js';

	let { data }: NodeProps<{ label: string }> = $props();
</script>

<div class="gradient-node">
	<span>{data.label}</span>
	<Handle id="in" type="input" port="data" position="left" />
	<Handle id="out" type="output" port="data" position="right" />
</div>

<style>
	.gradient-node {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		border: none;
		border-radius: 12px;
		padding: 16px 24px;
		color: #fff;
		font-weight: 600;
		min-width: 120px;
		text-align: center;
		box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
	}
</style>

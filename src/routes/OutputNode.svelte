<script lang="ts">
	import Handle from '../lib/components/Handle.svelte';
	import type { NodeProps } from '../lib/types/index.js';

	let { id, data, selected }: NodeProps<{ title: string }> = $props();
</script>

<div class="output-node">
	<div class="node-header">{data.title}</div>
	<Handle id="in" type="input" port="data" position="left" />
</div>

<style>
	.output-node {
		background: #3a2a4e;
		border: 2px solid #9b59b6;
		border-radius: 8px;
		padding: 1rem;
		min-width: 150px;
		position: relative;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
		transition: box-shadow 0.2s;
	}

	.node-header {
		font-weight: 600;
		font-size: 0.95rem;
		color: white;
		margin: 0;
	}
</style>

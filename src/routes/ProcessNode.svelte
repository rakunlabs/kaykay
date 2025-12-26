<script lang="ts">
	import Handle from '../lib/components/Handle.svelte';
	import HandleGroup from '../lib/components/HandleGroup.svelte';
	import type { NodeProps } from '../lib/types/index.js';

	let { id, data, selected }: NodeProps<{ operation: string; description?: string }> = $props();
</script>

<div class="process-node">
	<div class="node-header">{data.operation}</div>
	{#if data.description}
		<div class="node-body">{data.description}</div>
	{/if}
	
	<!-- Multiple input handles grouped on the left -->
	<HandleGroup position="left">
		<Handle id="input-1" type="input" port="data" label="In 1" />
		<Handle id="input-2" type="input" port="data" label="In 2" />
	</HandleGroup>
	
	<!-- Single output handle on the right -->
	<Handle id="output" type="output" port="data" position="right" style="background-color: yellow; --letter-color: red;" letter="R" />
</div>

<style>
	.process-node {
		background: #1f1f1f;
		border: 2px solid #444;
		border-radius: 8px;
		padding: 1rem;
		min-width: 160px;
		min-height: 80px;
		position: relative;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
		transition: box-shadow 0.2s;
	}

	.node-header {
		font-weight: 600;
		font-size: 0.95rem;
		color: white;
		margin: 0 0 0.5rem 0;
	}

	.node-body {
		font-size: 0.85rem;
		color: #aaa;
		margin-top: 0.5rem;
	}
</style>

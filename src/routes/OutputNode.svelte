<script lang="ts">
	import Handle from '../lib/components/Handle.svelte';
	import HandleGroup from '../lib/components/HandleGroup.svelte';
	import type { NodeProps } from '../lib/types/index.js';

	let { id, data, selected }: NodeProps<{ title: string }> = $props();
</script>

<div class="output-node">
	<div class="node-header">{data.title}</div>
	<HandleGroup position="top">
		<Handle id="in" type="input" port="data" />
		<Handle id="in-2" type="input" port="data" />
		<Handle id="in-3" type="input" port="data" />
		<Handle id="in-4" type="input" port="data" />
		<Handle id="in-5" type="input" port="data" />
	</HandleGroup>
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

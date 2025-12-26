<script lang="ts">
	import Handle from '../lib/components/Handle.svelte';
	import type { NodeProps } from '../lib/types/index.js';

	// Custom node component receives id, data, and selected props
	let { id, data, selected }: NodeProps<{ label: string; color?: string }> = $props();
</script>

<!-- 
  Custom node wrapper - can be styled however you want
  Handles must be placed inside to register with the flow
-->
<div class="text-node" style="background: {data.color || '#1f1f1f'}">
	<div class="node-header">{data.label}</div>
	
	<!-- Input handle on the left side -->
	<Handle id="in" type="input" port="data" position="left" />
	
	<!-- Output handle on the right side -->
	<Handle id="out" type="output" port="data" position="right" />
</div>

<style>
	.text-node {
		border: 2px solid #444;
		border-radius: 8px;
		padding: 1rem;
		min-width: 140px;
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

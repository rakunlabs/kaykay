<script lang="ts">
	import Handle from '../../../lib/components/Handle.svelte';
	import HandleGroup from '../../../lib/components/HandleGroup.svelte';
	import type { NodeProps } from '../../../lib/types/index.js';

	let { data }: NodeProps<{ label: string }> = $props();
</script>

<div class="demo-node labeled-node">
	<div class="node-title">{data.label}</div>
	<HandleGroup position="left">
		<Handle id="text" type="input" port="text" label="Text" />
		<Handle id="number" type="input" port="number" label="Number" />
		<Handle id="bool" type="input" port="boolean" label="Boolean" />
	</HandleGroup>
	<Handle id="out" type="output" port="data" position="right" label="Result" />
</div>

<style>
	.demo-node {
		background: #1f1f1f;
		border: 2px solid #444;
		border-radius: 8px;
		padding: 16px 24px;
		min-width: 120px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
	}

	:global(.kaykay-light) .demo-node {
		background: #fff;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	.node-title {
		font-weight: 600;
		color: #fff;
		font-size: 0.9rem;
	}

	:global(.kaykay-light) .node-title {
		color: #333;
	}

	.labeled-node {
		border-color: #ec4899;
		min-height: 90px;
	}
</style>

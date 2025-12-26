<script lang="ts">
	import Handle from '../../../lib/components/Handle.svelte';
	import HandleGroup from '../../../lib/components/HandleGroup.svelte';
	import type { NodeProps } from '../../../lib/types/index.js';

	let { data }: NodeProps<{ label: string }> = $props();
</script>

<div class="demo-node source-node">
	<div class="node-title">{data.label}</div>
	<HandleGroup position="right">
		<Handle id="text-out" type="output" port="text" label="Text" />
		<Handle id="number-out" type="output" port="number" label="Number" />
		<Handle id="bool-out" type="output" port="boolean" label="Boolean" />
	</HandleGroup>
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

	.source-node {
		border-color: #22c55e;
		min-height: 90px;
	}
</style>

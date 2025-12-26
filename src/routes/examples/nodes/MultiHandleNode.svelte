<script lang="ts">
	import Handle from '../../../lib/components/Handle.svelte';
	import HandleGroup from '../../../lib/components/HandleGroup.svelte';
	import type { NodeProps } from '../../../lib/types/index.js';

	let { data }: NodeProps<{ label: string }> = $props();
</script>

<div class="demo-node multi-node">
	<div class="node-title">{data.label}</div>
	<HandleGroup position="left">
		<Handle id="in-1" type="input" port="data" />
		<Handle id="in-2" type="input" port="data" />
		<Handle id="in-3" type="input" port="data" />
	</HandleGroup>
	<Handle id="out" type="output" port="data" position="right" />
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

	.multi-node {
		border-color: #f59e0b;
		min-height: 80px;
	}
</style>

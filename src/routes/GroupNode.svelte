<script lang="ts">
	import type { NodeProps } from '../lib/types/index.js';

	interface GroupData {
		label?: string;
		color?: string;
	}

	let { id, data, selected }: NodeProps<GroupData> = $props();
</script>

<div
	class="group-node"
	style:background={data.color ? `${data.color}20` : undefined}
	style:border-color={data.color ?? '#666'}
>
	{#if data.label}
		<div class="group-label" style:color={data.color}>{data.label}</div>
	{/if}
</div>

<style>
	.group-node {
		min-width: 200px;
		min-height: 150px;
		width: 100%;
		height: 100%;
		background: rgba(100, 100, 120, 0.1);
		border: 2px dashed #666;
		border-radius: 12px;
		position: relative;
	}

	.group-label {
		position: absolute;
		top: -24px;
		left: 8px;
		font-size: 0.85rem;
		font-weight: 600;
		color: #888;
		background: #1a1a2e;
		padding: 2px 8px;
		border-radius: 4px;
	}
</style>

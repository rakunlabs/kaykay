<script lang="ts">
	import Handle from '../../../lib/components/Handle.svelte';
	import HandleGroup from '../../../lib/components/HandleGroup.svelte';
	import type { NodeProps, HandlePosition } from '../../../lib/types/index.js';

	interface HandleConfig {
		id: string;
		type: 'input' | 'output';
		position?: HandlePosition;
		port?: string;
		label?: string;
		style?: string;
	}

	interface CustomNodeData {
		label?: string;
		backgroundColor?: string;
		borderColor?: string;
		textColor?: string;
		handles?: HandleConfig[];
	}

	let { data }: NodeProps<CustomNodeData> = $props();

	// Group handles by position
	const handlesByPosition = $derived.by(() => {
		const handles = data.handles || [];
		const groups: Record<HandlePosition, HandleConfig[]> = {
			left: [],
			right: [],
			top: [],
			bottom: []
		};
		
		handles.forEach(h => {
			const pos = h.position || (h.type === 'input' ? 'left' : 'right');
			groups[pos].push(h);
		});
		
		return groups;
	});

	// Check if we need handle groups (more than 1 handle on any side)
	const needsLeftGroup = $derived(handlesByPosition.left.length > 1);
	const needsRightGroup = $derived(handlesByPosition.right.length > 1);
	const needsTopGroup = $derived(handlesByPosition.top.length > 1);
	const needsBottomGroup = $derived(handlesByPosition.bottom.length > 1);

	// Build inline style
	const nodeStyle = $derived.by(() => {
		const styles: string[] = [];
		if (data.backgroundColor) styles.push(`background: ${data.backgroundColor}`);
		if (data.borderColor) styles.push(`border-color: ${data.borderColor}`);
		if (data.textColor) styles.push(`color: ${data.textColor}`);
		return styles.join('; ');
	});
</script>

<div class="custom-node" style={nodeStyle}>
	<div class="node-label">{data.label || 'Custom Node'}</div>
	
	<!-- Left handles -->
	{#if needsLeftGroup}
		<HandleGroup position="left">
			{#each handlesByPosition.left as handle}
				<Handle 
					id={handle.id} 
					type={handle.type} 
					port={handle.port || 'data'} 
					label={handle.label}
					style={handle.style}
				/>
			{/each}
		</HandleGroup>
	{:else}
		{#each handlesByPosition.left as handle}
			<Handle 
				id={handle.id} 
				type={handle.type} 
				port={handle.port || 'data'} 
				position="left"
				label={handle.label}
				style={handle.style}
			/>
		{/each}
	{/if}
	
	<!-- Right handles -->
	{#if needsRightGroup}
		<HandleGroup position="right">
			{#each handlesByPosition.right as handle}
				<Handle 
					id={handle.id} 
					type={handle.type} 
					port={handle.port || 'data'} 
					label={handle.label}
					style={handle.style}
				/>
			{/each}
		</HandleGroup>
	{:else}
		{#each handlesByPosition.right as handle}
			<Handle 
				id={handle.id} 
				type={handle.type} 
				port={handle.port || 'data'} 
				position="right"
				label={handle.label}
				style={handle.style}
			/>
		{/each}
	{/if}
	
	<!-- Top handles -->
	{#if needsTopGroup}
		<HandleGroup position="top">
			{#each handlesByPosition.top as handle}
				<Handle 
					id={handle.id} 
					type={handle.type} 
					port={handle.port || 'data'} 
					label={handle.label}
					style={handle.style}
				/>
			{/each}
		</HandleGroup>
	{:else}
		{#each handlesByPosition.top as handle}
			<Handle 
				id={handle.id} 
				type={handle.type} 
				port={handle.port || 'data'} 
				position="top"
				label={handle.label}
				style={handle.style}
			/>
		{/each}
	{/if}
	
	<!-- Bottom handles -->
	{#if needsBottomGroup}
		<HandleGroup position="bottom">
			{#each handlesByPosition.bottom as handle}
				<Handle 
					id={handle.id} 
					type={handle.type} 
					port={handle.port || 'data'} 
					label={handle.label}
					style={handle.style}
				/>
			{/each}
		</HandleGroup>
	{:else}
		{#each handlesByPosition.bottom as handle}
			<Handle 
				id={handle.id} 
				type={handle.type} 
				port={handle.port || 'data'} 
				position="bottom"
				label={handle.label}
				style={handle.style}
			/>
		{/each}
	{/if}
</div>

<style>
	.custom-node {
		background: #1f1f1f;
		border: 2px solid #4a9eff;
		border-radius: 8px;
		padding: 16px 24px;
		min-width: 100px;
		min-height: 40px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
	}

	:global(.kaykay-light) .custom-node {
		background: #fff;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	.node-label {
		font-weight: 600;
		color: #fff;
		font-size: 0.9rem;
		text-align: center;
	}

	:global(.kaykay-light) .node-label {
		color: #333;
	}
</style>

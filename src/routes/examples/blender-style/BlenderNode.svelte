<script lang="ts">
	import { onDestroy } from 'svelte';
	import Handle from '../../../lib/components/Handle.svelte';
	import { getFlow } from '../../../lib/stores/flow.svelte.js';
	import type { FlowEdge, NodeProps } from '../../../lib/types/index.js';

	interface BlenderSocket {
		id: string;
		label: string;
		port: string;
		color: string;
		shape?: 'circle' | 'square' | 'diamond' | 'triangle' | 'diagonal';
		field?: 'text' | 'number' | 'checkbox';
		value?: string | number | boolean;
		placeholder?: string;
	}

	interface BlenderNodeData {
		label: string;
		category: string;
		accent: string;
		inputs?: BlenderSocket[];
		outputs?: BlenderSocket[];
	}

	type HighlightableEdge = FlowEdge & { highlighted?: boolean };

	let { id, data, selected }: NodeProps<BlenderNodeData> = $props();

	const flow = getFlow();
	const DEFAULT_NODE_WIDTH = 230;
	const MIN_NODE_WIDTH = 180;
	const MAX_NODE_WIDTH = 460;

	type ResizeSide = 'left' | 'right';

	let nodeRoot = $state<HTMLDivElement | null>(null);
	let isCollapsed = $state(false);
	let isResizing = $state(false);
	let resizeSide = $state<ResizeSide>('right');
	let resizeStartClientX = $state(0);
	let resizeStartWidth = $state(230);
	let resizeStartPosition = $state({ x: 0, y: 0 });
	let hoveredSocketId = $state<string | null>(null);

	const nodeState = $derived(flow.getNode(id));
	const nodeWidth = $derived(nodeState?.width ?? DEFAULT_NODE_WIDTH);

	function clamp(value: number, min: number, max: number): number {
		return Math.min(max, Math.max(min, value));
	}

	function syncNodeDimensions() {
		if (!nodeRoot) return;

		const rect = nodeRoot.getBoundingClientRect();
		flow.updateNodeDimensions(id, rect.width / flow.viewport.zoom, rect.height / flow.viewport.zoom);
	}

	function toggleCollapsed(e: MouseEvent) {
		e.stopPropagation();
		isCollapsed = !isCollapsed;
		requestAnimationFrame(syncNodeDimensions);
	}

	function startResize(e: MouseEvent, side: ResizeSide) {
		if (flow.locked) return;
		e.stopPropagation();
		e.preventDefault();

		const node = flow.getNode(id);
		if (!node) return;

		flow.beginTransaction();
		isResizing = true;
		resizeSide = side;
		resizeStartClientX = e.clientX;
		resizeStartWidth = node.width ?? DEFAULT_NODE_WIDTH;
		resizeStartPosition = { ...node.position };

		window.addEventListener('mousemove', handleResizeMove);
		window.addEventListener('mouseup', stopResize);
	}

	function handleResizeMove(e: MouseEvent) {
		if (!isResizing) return;

		const node = flow.getNode(id);
		if (!node) return;

		const delta = (e.clientX - resizeStartClientX) / flow.viewport.zoom;
		const newWidth = resizeSide === 'right'
			? clamp(resizeStartWidth + delta, MIN_NODE_WIDTH, MAX_NODE_WIDTH)
			: clamp(resizeStartWidth - delta, MIN_NODE_WIDTH, MAX_NODE_WIDTH);

		node.width = newWidth;
		node.computed_width = newWidth;

		if (resizeSide === 'left') {
			flow.updateNodePosition(id, {
				x: resizeStartPosition.x + resizeStartWidth - newWidth,
				y: resizeStartPosition.y,
			});
		}
	}

	function stopResize() {
		isResizing = false;
		syncNodeDimensions();
		flow.endTransaction(true, 'node:resize');
		window.removeEventListener('mousemove', handleResizeMove);
		window.removeEventListener('mouseup', stopResize);
	}

	function setSocketHover(socket_id: string | null): void {
		hoveredSocketId = socket_id;

		for (const edge of flow.edges as HighlightableEdge[]) {
			const is_connected_socket = socket_id !== null && (
				(edge.source === id && edge.source_handle === socket_id) ||
				(edge.target === id && edge.target_handle === socket_id)
			);
			edge.highlighted = is_connected_socket;
		}
	}

	onDestroy(() => {
		if (typeof window === 'undefined') return;
		window.removeEventListener('mousemove', handleResizeMove);
		window.removeEventListener('mouseup', stopResize);
		setSocketHover(null);
		if (isResizing) {
			flow.endTransaction(true, 'node:resize');
		}
	});

	function updateInputValue(socket_id: string, value: string | number | boolean) {
		const inputs = (data.inputs ?? []).map((input) =>
			input.id === socket_id ? { ...input, value } : input
		);

		flow.updateNodeData<BlenderNodeData>(id, { inputs });
	}

	function handleTextInput(e: Event, socket: BlenderSocket) {
		const target = e.currentTarget as HTMLInputElement;
		updateInputValue(socket.id, socket.field === 'number' ? Number(target.value) : target.value);
	}

	function handleCheckboxInput(e: Event, socket: BlenderSocket) {
		const target = e.currentTarget as HTMLInputElement;
		updateInputValue(socket.id, target.checked);
	}

	function stopNodeDrag(e: Event) {
		e.stopPropagation();
	}

	function collapsedSocketStyle(index: number, count: number): string {
		const middle = (count - 1) / 2;
		const spacing = count > 8 ? 4 : count > 5 ? 5 : 7;
		const y = (index - middle) * spacing;

		return `--socket-y: ${y}px;`;
	}
</script>

{#snippet socketShape(socket: BlenderSocket)}
	<span
		class="socket-shape socket-shape-{socket.shape ?? 'circle'}"
		style:--socket-color={socket.color}
	></span>
{/snippet}

<div
	bind:this={nodeRoot}
	class="blender-node"
	class:selected
	class:collapsed={isCollapsed}
	class:resizing={isResizing}
	style:--node-accent={data.accent}
	style:width={`${nodeWidth}px`}
>
	<button
		type="button"
		class="resize-edge resize-edge-left"
		data-kaykay-no-drag
		onmousedown={(e) => startResize(e, 'left')}
		aria-label="Resize node from left edge"
	></button>
	<button
		type="button"
		class="resize-edge resize-edge-right"
		data-kaykay-no-drag
		onmousedown={(e) => startResize(e, 'right')}
		aria-label="Resize node from right edge"
	></button>

	<div class="blender-node-header">
		<button
			type="button"
			class="collapse-button"
			class:closed={isCollapsed}
			data-kaykay-no-drag
			onclick={toggleCollapsed}
			onmousedown={stopNodeDrag}
			aria-label={isCollapsed ? 'Expand node' : 'Collapse node'}
		>
			<span class="collapse-icon"></span>
		</button>
		<div>
			<div class="node-title">{data.label}</div>
			<div class="node-category">{data.category}</div>
		</div>
	</div>

	{#if isCollapsed}
		<div class="collapsed-sockets collapsed-inputs">
			{#each data.inputs ?? [] as input, index}
				<Handle
					id={input.id}
					type="input"
					port={input.port}
					position="left"
					port_color={input.color}
					class="blender-socket blender-input-socket collapsed-socket"
					style={collapsedSocketStyle(index, data.inputs?.length ?? 0)}
				>
					{@render socketShape(input)}
				</Handle>
			{/each}
		</div>
		<div class="collapsed-sockets collapsed-outputs">
			{#each data.outputs ?? [] as output, index}
				<Handle
					id={output.id}
					type="output"
					port={output.port}
					position="right"
					port_color={output.color}
					class="blender-socket blender-output-socket collapsed-socket"
					style={collapsedSocketStyle(index, data.outputs?.length ?? 0)}
				>
					{@render socketShape(output)}
				</Handle>
			{/each}
		</div>
	{:else}
		<div class="node-body">
		{#each data.inputs ?? [] as input}
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				class="socket-row input-row"
				class:hovered={hoveredSocketId === input.id}
				onmouseenter={() => setSocketHover(input.id)}
				onmouseleave={() => setSocketHover(null)}
			>
				<Handle
					id={input.id}
					type="input"
					port={input.port}
					position="left"
					port_color={input.color}
					class="blender-socket blender-input-socket"
				>
					{@render socketShape(input)}
				</Handle>
				<span class="socket-label">{input.label}</span>

				{#if input.field === 'checkbox'}
					<label class="checkbox-field" data-kaykay-no-drag>
						<input
							type="checkbox"
							checked={Boolean(input.value)}
							oninput={(e) => handleCheckboxInput(e, input)}
							onmousedown={stopNodeDrag}
							onclick={stopNodeDrag}
						/>
					</label>
				{:else if input.field}
					<input
						class="value-field"
						data-kaykay-no-drag
						type={input.field}
						value={String(input.value ?? '')}
						placeholder={input.placeholder}
						oninput={(e) => handleTextInput(e, input)}
						onmousedown={stopNodeDrag}
						onclick={stopNodeDrag}
					/>
				{/if}
			</div>
		{/each}

		{#if (data.inputs?.length ?? 0) > 0 && (data.outputs?.length ?? 0) > 0}
			<div class="row-divider"></div>
		{/if}

		{#each data.outputs ?? [] as output}
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				class="socket-row output-row"
				class:hovered={hoveredSocketId === output.id}
				onmouseenter={() => setSocketHover(output.id)}
				onmouseleave={() => setSocketHover(null)}
			>
				<span class="socket-label">{output.label}</span>
				<Handle
					id={output.id}
					type="output"
					port={output.port}
					position="right"
					port_color={output.color}
					class="blender-socket blender-output-socket"
				>
					{@render socketShape(output)}
				</Handle>
			</div>
		{/each}
		</div>
	{/if}
</div>

<style>
	.blender-node {
		--node-accent: #6f8fda;

		position: relative;
		overflow: visible;
		background: #282a2f;
		border: 1px solid #111216;
		border-radius: 8px;
		box-shadow: 0 8px 18px rgba(0, 0, 0, 0.38), inset 0 1px rgba(255, 255, 255, 0.04);
		color: #d5d7dd;
		font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
		font-size: 12px;
	}

	.blender-node.selected {
		border-color: #f6a21a;
		box-shadow: 0 0 0 1px #f6a21a, 0 10px 24px rgba(0, 0, 0, 0.45);
	}

	.blender-node.resizing {
		box-shadow: 0 0 0 1px #f6a21a, 0 10px 24px rgba(0, 0, 0, 0.45);
	}

	.blender-node-header {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 8px 10px;
		background: var(--node-accent);
		border-bottom: 1px solid rgba(0, 0, 0, 0.55);
		border-radius: 7px 7px 0 0;
		cursor: grab;
	}

	.blender-node.collapsed .blender-node-header {
		border-radius: 7px;
		border-bottom: 0;
	}

	.collapse-button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 16px;
		height: 16px;
		padding: 0;
		background: transparent;
		border: 0;
		cursor: pointer;
	}

	.collapse-button:hover .collapse-icon {
		border-color: #ffffff;
	}

	.collapse-icon {
		width: 7px;
		height: 7px;
		border-right: 2px solid #f4f5f7;
		border-bottom: 2px solid #f4f5f7;
		transform: rotate(45deg) translate(-1px, -1px);
	}

	.collapse-button.closed .collapse-icon {
		transform: rotate(-45deg) translate(-1px, 1px);
	}

	.node-title {
		font-weight: 700;
		line-height: 1.1;
		color: #f4f5f7;
		letter-spacing: 0.01em;
	}

	.node-category {
		margin-top: 2px;
		font-size: 10px;
		line-height: 1;
		color: rgba(244, 245, 247, 0.58);
		text-transform: uppercase;
		letter-spacing: 0.08em;
	}

	.node-body {
		padding: 7px 0;
		background: #2b2e34;
		border-radius: 0 0 7px 7px;
	}

	.socket-row {
		display: grid;
		align-items: center;
		min-height: 28px;
		padding: 3px 0;
		column-gap: 8px;
		position: relative;
	}

	.socket-row:hover {
		background: rgba(255, 255, 255, 0.035);
	}

	.socket-row.hovered {
		background: rgba(246, 162, 26, 0.11);
	}

	.input-row {
		grid-template-columns: 0 minmax(0, 1fr) auto;
		padding-right: 10px;
	}

	.output-row {
		grid-template-columns: minmax(0, 1fr) 0;
		padding-left: 10px;
		text-align: right;
	}

	.socket-row.hovered :global(.blender-socket.kaykay-handle) {
		transform: scale(1.18);
	}

	.socket-label {
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
		color: #cfd2d8;
	}

	.socket-row.hovered .socket-label {
		color: #ffffff;
	}

	.input-row .socket-label {
		margin-left: 4px;
	}

	.output-row .socket-label {
		margin-right: 4px;
	}

	.value-field {
		width: 72px;
		height: 20px;
		padding: 0 7px;
		background: #1f2126;
		border: 1px solid #14161a;
		border-radius: 4px;
		box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.45);
		color: #e7e9ee;
		font: inherit;
		font-size: 11px;
		outline: none;
	}

	.value-field:focus {
		border-color: var(--node-accent);
		box-shadow: 0 0 0 1px color-mix(in srgb, var(--node-accent), transparent 30%), inset 0 1px 2px rgba(0, 0, 0, 0.45);
	}

	.checkbox-field {
		display: grid;
		place-items: center;
		width: 22px;
		height: 20px;
		background: #1f2126;
		border: 1px solid #14161a;
		border-radius: 4px;
	}

	.checkbox-field input {
		accent-color: var(--node-accent);
	}

	.row-divider {
		height: 1px;
		margin: 6px 10px;
		background: rgba(0, 0, 0, 0.36);
		box-shadow: 0 1px rgba(255, 255, 255, 0.04);
	}

	:global(.blender-socket.kaykay-handle) {
		position: relative !important;
		left: auto !important;
		right: auto !important;
		top: auto !important;
		bottom: auto !important;
		width: 12px;
		height: 12px;
		margin: 0 !important;
		min-width: 12px;
		min-height: 12px;
		border: 0;
		background: transparent;
		box-shadow: none;
		justify-self: center;
	}

	:global(.blender-socket.kaykay-handle:hover) {
		transform: scale(1.35);
	}

	:global(.collapsed-socket.kaykay-handle) {
		position: absolute !important;
		top: -6px !important;
		display: block;
	}

	.socket-shape {
		--socket-color: #b4b4b4;

		display: block;
		width: 12px;
		height: 12px;
		background: var(--socket-color);
		border: 1px solid color-mix(in srgb, var(--socket-color), #ffffff 40%);
		box-shadow: inset 0 1px rgba(255, 255, 255, 0.32), 0 1px 2px rgba(0, 0, 0, 0.45);
	}

	.socket-shape-circle {
		border-radius: 999px;
	}

	.socket-shape-square {
		border-radius: 2px;
	}

	.socket-shape-diamond {
		border-radius: 2px;
		transform: rotate(45deg) scale(0.86);
	}

	.socket-shape-triangle {
		width: 0;
		height: 0;
		background: transparent;
		border-top: 6px solid transparent;
		border-bottom: 6px solid transparent;
		border-left: 11px solid var(--socket-color);
		box-shadow: none;
	}

	.socket-shape-diagonal {
		position: relative;
		border-radius: 2px;
		background: color-mix(in srgb, var(--socket-color), #101216 20%);
	}

	.socket-shape-diagonal::after {
		content: '';
		position: absolute;
		left: 1px;
		top: 5px;
		width: 10px;
		height: 2px;
		background: #101216;
		transform: rotate(-45deg);
		transform-origin: center;
	}

	.collapsed-sockets {
		position: absolute;
		top: 50%;
		width: 34px;
		height: 0;
		z-index: 12;
	}

	.collapsed-inputs {
		left: -6px;
	}

	.collapsed-outputs {
		right: -6px;
	}

	.collapsed-inputs :global(.collapsed-socket.kaykay-handle) {
		left: 0 !important;
		right: auto !important;
		transform: translate(0, var(--socket-y, 0));
	}

	.collapsed-outputs :global(.collapsed-socket.kaykay-handle) {
		left: auto !important;
		right: 0 !important;
		transform: translate(0, var(--socket-y, 0));
	}

	.collapsed-inputs :global(.collapsed-socket.kaykay-handle:hover) {
		transform: translate(0, var(--socket-y, 0)) scale(1.25);
	}

	.collapsed-outputs :global(.collapsed-socket.kaykay-handle:hover) {
		transform: translate(0, var(--socket-y, 0)) scale(1.25);
	}

	.resize-edge {
		position: absolute;
		top: 0;
		bottom: 0;
		width: 8px;
		padding: 0;
		z-index: 6;
		cursor: ew-resize;
		background: transparent;
		border: 0;
	}

	.resize-edge:hover {
		background: rgba(246, 162, 26, 0.14);
	}

	.resize-edge-left {
		left: -4px;
	}

	.resize-edge-right {
		right: -4px;
	}

	:global(.kaykay-light) .blender-node {
		background: #30333a;
		color: #d5d7dd;
	}
</style>

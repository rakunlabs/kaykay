<script lang="ts">
	import { getContext } from 'svelte';
	import type { NodeProps } from '../types/index.js';
	import type { FlowState } from '../stores/flow.svelte.js';

	interface GroupData {
		label?: string;
		color?: string;
	}

	let { id, data, selected }: NodeProps<GroupData> = $props();

	const FLOW_CONTEXT_KEY = Symbol.for('kaykay-flow');
	const flow = getContext<FlowState>(FLOW_CONTEXT_KEY);

	let isEditing = $state(false);
	let labelInput = $state<HTMLInputElement | null>(null);
	let isResizing = $state(false);
	let resizeStartPos = $state({ x: 0, y: 0 });
	let resizeStartSize = $state({ width: 0, height: 0 });

	// Context menu state
	let showContextMenu = $state(false);
	let contextMenuPos = $state({ x: 0, y: 0 });

	// Preset colors for the color picker
	const colorOptions = [
		'#888888', // Default gray
		'#ef4444', // Red
		'#f97316', // Orange
		'#eab308', // Yellow
		'#22c55e', // Green
		'#3b82f6', // Blue
		'#8b5cf6', // Purple
		'#ec4899', // Pink
	];

	function handleLabelDoubleClick(e: MouseEvent) {
		if (flow.locked) return;
		e.stopPropagation();
		isEditing = true;
		// Focus input after it renders
		requestAnimationFrame(() => {
			labelInput?.focus();
			labelInput?.select();
		});
	}

	function handleLabelBlur() {
		isEditing = false;
	}

	function handleLabelKeyDown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			isEditing = false;
		}
		if (e.key === 'Escape') {
			isEditing = false;
		}
		// Stop propagation to prevent node deletion on Backspace
		e.stopPropagation();
	}

	function handleLabelInput(e: Event) {
		const target = e.target as HTMLInputElement;
		flow.updateNodeData(id, { label: target.value });
	}

	function handleResizeMouseDown(e: MouseEvent) {
		if (flow.locked) return;
		e.stopPropagation();
		e.preventDefault();

		isResizing = true;
		resizeStartPos = { x: e.clientX, y: e.clientY };
		
		const node = flow.getNode(id);
		if (node) {
			resizeStartSize = {
				width: node.width ?? node.computed_width ?? 200,
				height: node.height ?? node.computed_height ?? 150,
			};
		}

		window.addEventListener('mousemove', handleResizeMouseMove);
		window.addEventListener('mouseup', handleResizeMouseUp);
	}

	function handleResizeMouseMove(e: MouseEvent) {
		if (!isResizing) return;

		const dx = (e.clientX - resizeStartPos.x) / flow.viewport.zoom;
		const dy = (e.clientY - resizeStartPos.y) / flow.viewport.zoom;

		const newWidth = Math.max(100, resizeStartSize.width + dx);
		const newHeight = Math.max(80, resizeStartSize.height + dy);

		flow.resizeNode(id, newWidth, newHeight);
	}

	function handleResizeMouseUp() {
		isResizing = false;
		flow.updateGroupMembership(id);
		window.removeEventListener('mousemove', handleResizeMouseMove);
		window.removeEventListener('mouseup', handleResizeMouseUp);
	}

	// Context menu handlers
	function handleContextMenu(e: MouseEvent) {
		if (flow.locked) return;
		e.preventDefault();
		e.stopPropagation();

		contextMenuPos = { x: e.clientX, y: e.clientY };
		showContextMenu = true;

		setTimeout(() => {
			window.addEventListener('click', closeContextMenu);
			window.addEventListener('contextmenu', closeContextMenu);
		}, 0);
	}

	function closeContextMenu() {
		showContextMenu = false;
		window.removeEventListener('click', closeContextMenu);
		window.removeEventListener('contextmenu', closeContextMenu);
	}

	function setGroupColor(color: string) {
		flow.updateNodeData(id, { color });
		closeContextMenu();
	}

	// Portal-based context menu
	let menuContainer: HTMLDivElement | null = null;

	$effect(() => {
		if (showContextMenu) {
			menuContainer = document.createElement('div');
			menuContainer.className = 'kaykay-group-context-menu';
			menuContainer.style.cssText = `
				position: fixed;
				visibility: hidden;
				background: var(--kaykay-group-menu-bg, #1e1e1e);
				border: 1px solid var(--kaykay-group-menu-border, #333);
				border-radius: 8px;
				padding: 8px;
				min-width: 120px;
				box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
				z-index: 10000;
				font-family: system-ui, -apple-system, sans-serif;
				font-size: 12px;
			`;

			// Color section
			const colorLabel = document.createElement('div');
			colorLabel.textContent = 'Color';
			colorLabel.style.cssText = 'color: var(--kaykay-group-menu-label, #888); font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; padding: 0 4px;';
			menuContainer.appendChild(colorLabel);

			const colorOptionsDiv = document.createElement('div');
			colorOptionsDiv.style.cssText = 'display: flex; gap: 4px; flex-wrap: wrap;';
			
			colorOptions.forEach((color) => {
				const swatch = document.createElement('button');
				const isActive = data.color === color || (!data.color && color === '#888888');
				swatch.style.cssText = `
					width: 24px;
					height: 24px;
					border-radius: 4px;
					border: 2px solid ${isActive ? '#fff' : 'transparent'};
					background-color: ${color};
					cursor: pointer;
					box-shadow: ${isActive ? '0 0 0 2px rgba(255, 255, 255, 0.3)' : 'none'};
				`;
				swatch.onclick = (e) => {
					e.stopPropagation();
					setGroupColor(color);
				};
				colorOptionsDiv.appendChild(swatch);
			});
			menuContainer.appendChild(colorOptionsDiv);

			menuContainer.onclick = (e) => e.stopPropagation();

			document.body.appendChild(menuContainer);

			// Auto-position to keep menu within viewport
			requestAnimationFrame(() => {
				if (!menuContainer) return;
				
				const menuRect = menuContainer.getBoundingClientRect();
				const viewportWidth = window.innerWidth;
				const viewportHeight = window.innerHeight;
				const padding = 8;

				let x = contextMenuPos.x;
				let y = contextMenuPos.y;

				if (x + menuRect.width > viewportWidth - padding) {
					x = Math.max(padding, x - menuRect.width);
				}

				if (y + menuRect.height > viewportHeight - padding) {
					y = Math.max(padding, y - menuRect.height);
				}

				menuContainer.style.left = `${x}px`;
				menuContainer.style.top = `${y}px`;
				menuContainer.style.visibility = 'visible';
			});
		}

		return () => {
			if (menuContainer) {
				menuContainer.remove();
				menuContainer = null;
			}
		};
	});
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="kaykay-group-node"
	class:selected
	class:resizing={isResizing}
	style:background={data.color ? `${data.color}20` : undefined}
	style:border-color={data.color ?? 'var(--kaykay-group-border, #666)'}
	oncontextmenu={handleContextMenu}
>
	<div class="kaykay-group-label" style:border-color={data.color}>
		{#if isEditing}
			<input
				bind:this={labelInput}
				type="text"
				class="kaykay-group-label-input"
				value={data.label ?? ''}
				oninput={handleLabelInput}
				onblur={handleLabelBlur}
				onkeydown={handleLabelKeyDown}
			/>
		{:else}
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<span
				class="kaykay-group-label-text"
				ondblclick={handleLabelDoubleClick}
			>
				{data.label || 'Group'}
			</span>
		{/if}
	</div>

	<!-- Resize handle -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="kaykay-group-resize-handle"
		onmousedown={handleResizeMouseDown}
	></div>
</div>

<style>
	/* Light mode (default) */
	.kaykay-group-node {
		--kaykay-group-bg: rgba(100, 100, 120, 0.08);
		--kaykay-group-border: #999;
		--kaykay-group-label-color: #666;
		--kaykay-group-label-bg: #fff;
		--kaykay-group-resize-handle: #999;
		--kaykay-group-resize-handle-hover: #3b82f6;

		min-width: 100px;
		min-height: 80px;
		width: 100%;
		height: 100%;
		background: var(--kaykay-group-bg);
		border: 2px dashed var(--kaykay-group-border);
		border-radius: 12px;
		position: relative;
		box-sizing: border-box;
	}

	/* Dark mode - via class */
	:global(.kaykay-dark) .kaykay-group-node,
	.kaykay-group-node.kaykay-dark {
		--kaykay-group-bg: rgba(100, 100, 120, 0.15);
		--kaykay-group-border: #777;
		--kaykay-group-label-color: #aaa;
		--kaykay-group-label-bg: #1a1a2e;
		--kaykay-group-resize-handle: #777;
		--kaykay-group-resize-handle-hover: #60a5fa;
	}

	.kaykay-group-node.selected {
		border-style: solid;
	}

	.kaykay-group-node.resizing {
		cursor: nwse-resize;
	}

	.kaykay-group-label {
		position: absolute;
		top: -24px;
		left: 8px;
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--kaykay-group-label-color);
		background: var(--kaykay-group-label-bg);
		padding: 2px 8px;
		border: 1px solid var(--kaykay-group-border);
		border-bottom: none;
		border-radius: 4px 4px 0 0;
	}

	.kaykay-group-label-text {
		cursor: text;
		user-select: none;
	}

	.kaykay-group-label-text:hover {
		opacity: 0.8;
	}

	.kaykay-group-label-input {
		background: transparent;
		border: 1px solid currentColor;
		border-radius: 2px;
		font-size: inherit;
		font-weight: inherit;
		font-family: inherit;
		color: inherit;
		padding: 0 4px;
		margin: -1px -5px;
		width: auto;
		min-width: 60px;
		outline: none;
	}

	.kaykay-group-resize-handle {
		position: absolute;
		bottom: -4px;
		right: -4px;
		width: 16px;
		height: 16px;
		cursor: nwse-resize;
		background: linear-gradient(135deg, transparent 50%, var(--kaykay-group-resize-handle) 50%);
		border-radius: 0 0 4px 0;
		opacity: 0;
		transition: opacity 0.15s ease;
	}

	.kaykay-group-node:hover .kaykay-group-resize-handle,
	.kaykay-group-node.selected .kaykay-group-resize-handle {
		opacity: 1;
	}

	.kaykay-group-resize-handle:hover {
		background: linear-gradient(135deg, transparent 50%, var(--kaykay-group-resize-handle-hover) 50%);
	}
</style>

<script lang="ts">
	import { getContext, onDestroy, type Snippet } from 'svelte';
	import type { NodeProps } from '../types/index.js';
	import type { FlowState } from '../stores/flow.svelte.js';

	interface StickyNoteData {
		text: string;
		color?: string;
	}

	interface Props extends NodeProps<StickyNoteData> {
		/** Custom renderer for the note content. Receives the text as parameter. */
		children?: Snippet<[string]>;
	}

	let { id, data, selected, children }: Props = $props();

	const FLOW_CONTEXT_KEY = Symbol.for('kaykay-flow');
	const flow = getContext<FlowState>(FLOW_CONTEXT_KEY);

	// Available colors for the sticky note
	const colors = [
		{ name: 'Yellow', value: '#fef08a' },
		{ name: 'Green', value: '#bbf7d0' },
		{ name: 'Blue', value: '#bfdbfe' },
		{ name: 'Pink', value: '#fecaca' },
		{ name: 'Purple', value: '#e9d5ff' },
		{ name: 'Orange', value: '#fed7aa' },
		{ name: 'Cyan', value: '#a5f3fc' },
		{ name: 'White', value: '#ffffff' },
	];

	// Default color if not provided
	const bgColor = $derived(data.color ?? '#fef08a');

	// Get current size from node
	const nodeState = $derived(flow.getNode(id));
	const width = $derived(nodeState?.width ?? 180);
	const height = $derived(nodeState?.height ?? 120);

	// Context menu state
	let menuEl: HTMLDivElement | null = $state(null);

	// Edit mode state
	let isEditing = $state(false);
	let editText = $state('');
	let textareaEl: HTMLTextAreaElement;

	// Resize state
	type ResizeDirection = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw' | null;
	let isResizing = $state(false);
	let resizeDir = $state<ResizeDirection>(null);
	let resizeStartPos = $state({ x: 0, y: 0 });
	let resizeStartSize = $state({ width: 0, height: 0 });
	let resizeStartNodePos = $state({ x: 0, y: 0 });

	// Cleanup menu on destroy
	onDestroy(() => {
		if (menuEl) {
			menuEl.remove();
		}
		if (typeof document !== 'undefined') {
			document.removeEventListener('mousedown', handleGlobalClick);
		}
	});

	function handleContextMenu(e: MouseEvent) {
		if (flow.locked) return;
		e.preventDefault();
		e.stopPropagation();

		// Create and append menu to body for correct positioning
		createMenuElement(e.clientX, e.clientY);

		// Close menu when clicking outside
		const closeMenu = (evt: MouseEvent) => {
			if (!(evt.target as HTMLElement).closest('.kaykay-sticky-context-menu')) {
				removeMenuElement();
				document.removeEventListener('click', closeMenu);
				document.removeEventListener('contextmenu', closeMenu);
			}
		};
		setTimeout(() => {
			document.addEventListener('click', closeMenu);
			document.addEventListener('contextmenu', closeMenu);
		}, 0);
	}

	function createMenuElement(x: number, y: number) {
		removeMenuElement();

		menuEl = document.createElement('div');
		menuEl.className = 'kaykay-sticky-context-menu';
		menuEl.style.cssText = `
			position: fixed;
			left: ${x}px;
			top: ${y}px;
			z-index: 10000;
			background: #fff;
			border: 1px solid #ddd;
			border-radius: 8px;
			box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
			padding: 8px 0;
			min-width: 160px;
			font-family: system-ui, -apple-system, sans-serif;
			font-size: 13px;
		`;

		// Check for dark mode
		if (document.querySelector('.kaykay-dark')) {
			menuEl.style.background = '#2a2a2a';
			menuEl.style.borderColor = '#444';
			menuEl.style.color = '#eee';
		}

		// Edit button
		const editBtn = document.createElement('button');
		editBtn.innerHTML = '<span style="font-size:14px">&#9998;</span> Edit Text';
		editBtn.style.cssText = `
			display: flex;
			align-items: center;
			gap: 8px;
			width: 100%;
			padding: 8px 16px;
			border: none;
			background: transparent;
			cursor: pointer;
			text-align: left;
			color: inherit;
			font-size: inherit;
		`;
		editBtn.onmouseover = () => (editBtn.style.background = document.querySelector('.kaykay-dark') ? '#3a3a3a' : '#f0f0f0');
		editBtn.onmouseout = () => (editBtn.style.background = 'transparent');
		editBtn.onclick = () => {
			startEditing();
			removeMenuElement();
		};
		menuEl.appendChild(editBtn);

		// Divider
		const divider = document.createElement('div');
		divider.style.cssText = `
			height: 1px;
			background: ${document.querySelector('.kaykay-dark') ? '#444' : '#eee'};
			margin: 8px 0;
		`;
		menuEl.appendChild(divider);

		// Color label
		const label = document.createElement('div');
		label.textContent = 'Change Color';
		label.style.cssText = `
			padding: 4px 16px 8px;
			font-size: 11px;
			color: #888;
			text-transform: uppercase;
			letter-spacing: 0.5px;
		`;
		menuEl.appendChild(label);

		// Color grid
		const colorGrid = document.createElement('div');
		colorGrid.style.cssText = `
			display: grid;
			grid-template-columns: repeat(4, 1fr);
			gap: 6px;
			padding: 0 12px 8px;
		`;

		colors.forEach((color) => {
			const swatch = document.createElement('button');
			swatch.style.cssText = `
				width: 28px;
				height: 28px;
				border: 2px solid ${bgColor === color.value ? (document.querySelector('.kaykay-dark') ? '#fff' : '#333') : 'transparent'};
				border-radius: 4px;
				cursor: pointer;
				background: ${color.value};
				box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
				transition: transform 0.1s;
			`;
			swatch.title = color.name;
			swatch.onmouseover = () => (swatch.style.transform = 'scale(1.1)');
			swatch.onmouseout = () => (swatch.style.transform = 'scale(1)');
			swatch.onclick = () => {
				changeColor(color.value);
				removeMenuElement();
			};
			colorGrid.appendChild(swatch);
		});

		menuEl.appendChild(colorGrid);
		document.body.appendChild(menuEl);
	}

	function removeMenuElement() {
		if (menuEl) {
			menuEl.remove();
			menuEl = null;
		}
	}

	function changeColor(color: string) {
		const node = flow.getNode(id);
		if (node) {
			node.data = { ...node.data, color };
		}
	}

	function startEditing() {
		editText = data.text;
		isEditing = true;
		setTimeout(() => {
			textareaEl?.focus();
			// Add global click listener to save when clicking outside
			document.addEventListener('mousedown', handleGlobalClick);
		}, 0);
	}

	function handleGlobalClick(e: MouseEvent) {
		const target = e.target as HTMLElement;
		// If clicking outside the sticky note, save
		if (!target.closest('.kaykay-sticky-note') || target.closest('[data-node-id]')?.getAttribute('data-node-id') !== id) {
			saveEdit();
		}
	}

	function saveEdit() {
		const node = flow.getNode(id);
		if (node) {
			node.data = { ...node.data, text: editText };
		}
		isEditing = false;
		document.removeEventListener('mousedown', handleGlobalClick);
	}

	function cancelEdit() {
		editText = data.text;
		isEditing = false;
		document.removeEventListener('mousedown', handleGlobalClick);
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			cancelEdit();
		} else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
			saveEdit();
		}
		e.stopPropagation();
	}

	function handleContainerKeydown(e: KeyboardEvent) {
		if (flow.locked) return;
		// Enter or Space to start editing (when not already editing)
		if (!isEditing && (e.key === 'Enter' || e.key === ' ')) {
			e.preventDefault();
			e.stopPropagation();
			startEditing();
		}
	}

	function handleDoubleClick(e: MouseEvent) {
		if (flow.locked) return;
		e.stopPropagation();
		startEditing();
	}

	function handleContainerClick(e: MouseEvent) {
		// If editing and clicked outside the textarea, save
		if (isEditing) {
			const target = e.target as HTMLElement;
			if (!target.closest('.sticky-note-editor')) {
				e.stopPropagation();
				saveEdit();
			}
		}
	}

	// Resize handlers
	function startResize(e: MouseEvent, direction: ResizeDirection) {
		if (flow.locked) return;
		e.stopPropagation();
		e.preventDefault();

		initResize(direction, e.clientX, e.clientY);

		window.addEventListener('mousemove', handleResizeMove);
		window.addEventListener('mouseup', handleResizeEnd);
	}

	function startResizeTouch(e: TouchEvent, direction: ResizeDirection) {
		if (flow.locked) return;
		e.stopPropagation();
		e.preventDefault();

		const touch = e.touches[0];
		initResize(direction, touch.clientX, touch.clientY);

		window.addEventListener('touchmove', handleResizeTouchMove, { passive: false });
		window.addEventListener('touchend', handleResizeTouchEnd);
		window.addEventListener('touchcancel', handleResizeTouchEnd);
	}

	function initResize(direction: ResizeDirection, clientX: number, clientY: number) {
		isResizing = true;
		resizeDir = direction;
		resizeStartPos = { x: clientX, y: clientY };

		const node = flow.getNode(id);
		if (node) {
			resizeStartSize = {
				width: node.width ?? 180,
				height: node.height ?? 120,
			};
			resizeStartNodePos = { ...node.position };
		}
	}

	function performResize(clientX: number, clientY: number) {
		if (!isResizing || !resizeDir) return;

		const dx = (clientX - resizeStartPos.x) / flow.viewport.zoom;
		const dy = (clientY - resizeStartPos.y) / flow.viewport.zoom;

		let newWidth = resizeStartSize.width;
		let newHeight = resizeStartSize.height;
		let newX = resizeStartNodePos.x;
		let newY = resizeStartNodePos.y;

		const minWidth = 100;
		const minHeight = 60;

		// Handle horizontal resize
		if (resizeDir.includes('e')) {
			newWidth = Math.max(minWidth, resizeStartSize.width + dx);
		}
		if (resizeDir.includes('w')) {
			const widthDelta = Math.min(dx, resizeStartSize.width - minWidth);
			newWidth = resizeStartSize.width - widthDelta;
			newX = resizeStartNodePos.x + widthDelta;
		}

		// Handle vertical resize
		if (resizeDir.includes('s')) {
			newHeight = Math.max(minHeight, resizeStartSize.height + dy);
		}
		if (resizeDir.includes('n')) {
			const heightDelta = Math.min(dy, resizeStartSize.height - minHeight);
			newHeight = resizeStartSize.height - heightDelta;
			newY = resizeStartNodePos.y + heightDelta;
		}

		// Update node size and position
		flow.resizeNode(id, newWidth, newHeight);

		// Update position if resizing from top or left
		if (resizeDir.includes('n') || resizeDir.includes('w')) {
			const node = flow.getNode(id);
			if (node) {
				node.position.x = newX;
				node.position.y = newY;
			}
		}
	}

	function handleResizeMove(e: MouseEvent) {
		performResize(e.clientX, e.clientY);
	}

	function handleResizeTouchMove(e: TouchEvent) {
		e.preventDefault();
		const touch = e.touches[0];
		performResize(touch.clientX, touch.clientY);
	}

	function handleResizeEnd() {
		isResizing = false;
		resizeDir = null;
		window.removeEventListener('mousemove', handleResizeMove);
		window.removeEventListener('mouseup', handleResizeEnd);
	}

	function handleResizeTouchEnd() {
		isResizing = false;
		resizeDir = null;
		window.removeEventListener('touchmove', handleResizeTouchMove);
		window.removeEventListener('touchend', handleResizeTouchEnd);
		window.removeEventListener('touchcancel', handleResizeTouchEnd);
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
	class="kaykay-sticky-note"
	class:is-editing={isEditing}
	class:is-resizing={isResizing}
	style="--note-bg: {bgColor}; width: {width}px; height: {height}px;"
	oncontextmenu={handleContextMenu}
	ondblclick={handleDoubleClick}
	onclick={handleContainerClick}
	onkeydown={handleContainerKeydown}
	role="note"
	tabindex="0"
	aria-label="Sticky note: {data.text.slice(0, 50)}{data.text.length > 50 ? '...' : ''}"
>
	{#if isEditing}
		<div class="sticky-note-edit-container">
			<textarea
				bind:this={textareaEl}
				bind:value={editText}
				class="sticky-note-editor"
				onkeydown={handleKeydown}
				placeholder="Enter your note..."
			></textarea>
			<div class="edit-actions">
				<button class="edit-btn save-btn" onclick={saveEdit}>Save</button>
				<button class="edit-btn cancel-btn" onclick={cancelEdit}>Cancel</button>
				<span class="edit-hint">Ctrl+Enter to save</span>
			</div>
		</div>
	{:else}
		<div class="sticky-note-content">
			{#if children}
				{@render children(data.text)}
			{:else}
				{data.text}
			{/if}
		</div>
	{/if}
	<div class="sticky-note-fold"></div>

	<!-- Resize handles -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	{#if !flow.locked}
		<div class="resize-handle resize-n" onmousedown={(e) => startResize(e, 'n')} ontouchstart={(e) => startResizeTouch(e, 'n')}></div>
		<div class="resize-handle resize-s" onmousedown={(e) => startResize(e, 's')} ontouchstart={(e) => startResizeTouch(e, 's')}></div>
		<div class="resize-handle resize-e" onmousedown={(e) => startResize(e, 'e')} ontouchstart={(e) => startResizeTouch(e, 'e')}></div>
		<div class="resize-handle resize-w" onmousedown={(e) => startResize(e, 'w')} ontouchstart={(e) => startResizeTouch(e, 'w')}></div>
		<div class="resize-handle resize-ne" onmousedown={(e) => startResize(e, 'ne')} ontouchstart={(e) => startResizeTouch(e, 'ne')}></div>
		<div class="resize-handle resize-nw" onmousedown={(e) => startResize(e, 'nw')} ontouchstart={(e) => startResizeTouch(e, 'nw')}></div>
		<div class="resize-handle resize-se" onmousedown={(e) => startResize(e, 'se')} ontouchstart={(e) => startResizeTouch(e, 'se')}></div>
		<div class="resize-handle resize-sw" onmousedown={(e) => startResize(e, 'sw')} ontouchstart={(e) => startResizeTouch(e, 'sw')}></div>
	{/if}
</div>

<style>
	.kaykay-sticky-note {
		background: var(--note-bg);
		min-width: 100px;
		min-height: 60px;
		padding: 12px 14px;
		font-family: 'Comic Sans MS', 'Marker Felt', cursive, sans-serif;
		font-size: 14px;
		line-height: 1.4;
		color: #333;
		box-shadow:
			2px 2px 8px rgba(0, 0, 0, 0.15),
			0 0 1px rgba(0, 0, 0, 0.1);
		position: relative;
		transform: rotate(-1deg);
		word-wrap: break-word;
		white-space: pre-wrap;
		user-select: none;
		box-sizing: border-box;
		overflow: hidden;
	}

	.kaykay-sticky-note.is-editing {
		transform: rotate(0deg);
		overflow: visible;
	}

	.kaykay-sticky-note.is-resizing {
		transform: rotate(0deg);
	}

	.kaykay-sticky-note::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 4px;
		background: linear-gradient(to bottom, rgba(0, 0, 0, 0.05), transparent);
		pointer-events: none;
	}

	.sticky-note-content {
		position: relative;
		z-index: 1;
		height: 100%;
		overflow: hidden;
	}

	/* Edit container */
	.sticky-note-edit-container {
		display: flex;
		flex-direction: column;
		height: 100%;
		gap: 8px;
	}

	.sticky-note-editor {
		flex: 1;
		width: 100%;
		min-height: 60px;
		padding: 8px;
		margin: -8px;
		margin-bottom: 0;
		border: 2px solid rgba(0, 0, 0, 0.2);
		border-radius: 4px;
		background: rgba(255, 255, 255, 0.9);
		font-family: system-ui, -apple-system, sans-serif;
		font-size: 14px;
		line-height: 1.5;
		color: #333;
		resize: none;
		outline: none;
		box-sizing: border-box;
	}

	.sticky-note-editor:focus {
		border-color: rgba(0, 0, 0, 0.4);
		background: #fff;
	}

	.sticky-note-editor::placeholder {
		color: #999;
	}

	.edit-actions {
		display: flex;
		gap: 6px;
		align-items: center;
		margin: 0 -8px -4px;
	}

	.edit-btn {
		padding: 4px 12px;
		border: none;
		border-radius: 4px;
		font-size: 12px;
		font-weight: 500;
		cursor: pointer;
		transition: background 0.15s;
	}

	.save-btn {
		background: #333;
		color: #fff;
	}

	.save-btn:hover {
		background: #555;
	}

	.cancel-btn {
		background: rgba(0, 0, 0, 0.1);
		color: #333;
	}

	.cancel-btn:hover {
		background: rgba(0, 0, 0, 0.2);
	}

	.edit-hint {
		font-size: 10px;
		color: #888;
		margin-left: auto;
		font-family: system-ui, sans-serif;
	}

	.sticky-note-fold {
		position: absolute;
		bottom: 0;
		right: 0;
		width: 20px;
		height: 20px;
		background: linear-gradient(135deg, transparent 50%, rgba(0, 0, 0, 0.06) 50%, rgba(0, 0, 0, 0.02) 100%);
		pointer-events: none;
	}

	.sticky-note-fold::before {
		content: '';
		position: absolute;
		bottom: 0;
		right: 0;
		width: 0;
		height: 0;
		border-style: solid;
		border-width: 0 0 20px 20px;
		border-color: transparent transparent rgba(229, 229, 229, 0.6) transparent;
		filter: drop-shadow(-1px -1px 1px rgba(0, 0, 0, 0.05));
	}

	:global(.kaykay-dark) .sticky-note-fold::before {
		border-color: transparent transparent rgba(26, 26, 26, 0.6) transparent;
	}

	/* Resize handles */
	.resize-handle {
		position: absolute;
		z-index: 10;
		opacity: 0;
		transition: opacity 0.15s;
	}

	.kaykay-sticky-note:hover .resize-handle {
		opacity: 1;
	}

	/* Edge handles */
	.resize-n {
		top: -4px;
		left: 8px;
		right: 8px;
		height: 8px;
		cursor: ns-resize;
	}

	.resize-s {
		bottom: -4px;
		left: 8px;
		right: 8px;
		height: 8px;
		cursor: ns-resize;
	}

	.resize-e {
		right: -4px;
		top: 8px;
		bottom: 8px;
		width: 8px;
		cursor: ew-resize;
	}

	.resize-w {
		left: -4px;
		top: 8px;
		bottom: 8px;
		width: 8px;
		cursor: ew-resize;
	}

	/* Corner handles */
	.resize-ne {
		top: -4px;
		right: -4px;
		width: 12px;
		height: 12px;
		cursor: nesw-resize;
	}

	.resize-nw {
		top: -4px;
		left: -4px;
		width: 12px;
		height: 12px;
		cursor: nwse-resize;
	}

	.resize-se {
		bottom: -4px;
		right: -4px;
		width: 12px;
		height: 12px;
		cursor: nwse-resize;
	}

	.resize-sw {
		bottom: -4px;
		left: -4px;
		width: 12px;
		height: 12px;
		cursor: nesw-resize;
	}

	/* Visual indicator on hover */
	.resize-handle::after {
		content: '';
		position: absolute;
		background: rgba(59, 130, 246, 0.5);
		border-radius: 2px;
	}

	.resize-n::after,
	.resize-s::after {
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
		width: 30px;
		height: 3px;
	}

	.resize-e::after,
	.resize-w::after {
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
		width: 3px;
		height: 30px;
	}

	.resize-ne::after,
	.resize-nw::after,
	.resize-se::after,
	.resize-sw::after {
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
		width: 6px;
		height: 6px;
		border-radius: 50%;
	}
</style>

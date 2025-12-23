<script lang="ts">
	import { getContext, onMount, onDestroy } from 'svelte';
	import type { HandleType, HandlePosition, Position } from '../types/index.js';
	import type { FlowState } from '../stores/flow.svelte.js';

	interface Props {
		id: string;
		type: HandleType;
		port: string;
		position?: HandlePosition;
		accept?: string[];
		label?: string;
		class?: string;
		style?: string;
	}

	const {
		id,
		type,
		port,
		position: positionProp,
		accept,
		label,
		class: className = '',
		style = '',
	}: Props = $props();

	const FLOW_CONTEXT_KEY = Symbol.for('kaykay-flow');
	const flow = getContext<FlowState>(FLOW_CONTEXT_KEY);

	// Get node ID from parent node element
	let handleEl: HTMLDivElement;
	let node_id = $state<string>('');
	let handle_offset = $state<Position>({ x: 0, y: 0 }); // Offset within node
	let isInGroup = $state(false);
	let isInitialized = $state(false);
	let effectivePosition = $state<HandlePosition>(positionProp ?? (type === 'input' ? 'left' : 'right'));

	onMount(() => {
		// Check if inside a HandleGroup and get its position
		const groupEl = handleEl.closest('[data-handle-group]');
		isInGroup = !!groupEl;
		
		// If in a group, use the group's position unless explicitly set
		if (groupEl && !positionProp) {
			const groupPosition = groupEl.getAttribute('data-handle-group') as HandlePosition;
			if (groupPosition) {
				effectivePosition = groupPosition;
			}
		}

		// Find parent node
		const nodeEl = handleEl.closest('[data-node-id]');
		if (nodeEl) {
			node_id = nodeEl.getAttribute('data-node-id') || '';
			
			// Use requestAnimationFrame to ensure layout is complete before calculating offset
			// This is especially important for handles inside HandleGroup (flexbox needs a frame)
			requestAnimationFrame(() => {
				calculateHandleOffset();
				registerHandle();
				isInitialized = true;
			});
		}
	});

	onDestroy(() => {
		if (node_id) {
			flow.unregisterHandle(node_id, id);
		}
	});

	function calculateHandleOffset() {
		if (!handleEl) return;

		const nodeEl = handleEl.closest('[data-node-id]') as HTMLElement;
		if (!nodeEl) return;

		const handleRect = handleEl.getBoundingClientRect();
		const nodeRect = nodeEl.getBoundingClientRect();

		// Calculate handle center relative to node (in screen pixels, then divide by zoom)
		handle_offset = {
			x: (handleRect.left + handleRect.width / 2 - nodeRect.left) / flow.viewport.zoom,
			y: (handleRect.top + handleRect.height / 2 - nodeRect.top) / flow.viewport.zoom,
		};
	}

	function registerHandle() {
		const absolute_position = getAbsolutePosition();
		flow.registerHandle(node_id, {
			id,
			type,
			port,
			position: effectivePosition,
			accept,
			label,
			absolute_position,
		});
		// Also update position immediately after registration
		flow.updateHandlePosition(node_id, id, absolute_position);
	}

	function getAbsolutePosition(): Position {
		const node = flow.getNode(node_id);
		if (!node) return { x: 0, y: 0 };

		// Get absolute node position (accounting for parent groups)
		const nodeAbsolutePos = flow.getAbsolutePosition(node_id);

		// Use cached offset + absolute node position
		return {
			x: nodeAbsolutePos.x + handle_offset.x,
			y: nodeAbsolutePos.y + handle_offset.y,
		};
	}

	// Update position when node moves - only after initialization
	$effect(() => {
		if (!isInitialized || !node_id || !handleEl) return;
		
		const node = flow.getNode(node_id);
		if (!node) return;
		
		// Track node position to trigger recalculation
		void node.position.x;
		void node.position.y;
		
		// Also track parent position if node has a parent
		if (node.parent_id) {
			const parent = flow.getNode(node.parent_id);
			if (parent) {
				void parent.position.x;
				void parent.position.y;
			}
		}

		const absolute_position = getAbsolutePosition();
		flow.updateHandlePosition(node_id, id, absolute_position);
	});

	// Check if this handle can accept current draft connection
	const can_accept_connection = $derived.by(() => {
		if (!flow.draft_connection) return false;
		if (type !== 'input') return false;
		if (flow.draft_connection.source_node_id === node_id) return false;

		return flow.canConnectPorts(flow.draft_connection.source_port, port, accept);
	});

	// Check if this handle is incompatible with current draft connection
	const is_incompatible = $derived.by(() => {
		if (!flow.draft_connection) return false;
		if (type !== 'input') return false;
		if (flow.draft_connection.source_node_id === node_id) return false;

		return !flow.canConnectPorts(flow.draft_connection.source_port, port, accept);
	});

	function handleMouseDown(e: MouseEvent) {
		if (type !== 'output') return;
		if (flow.locked) return;
		e.stopPropagation();

		// Recalculate offset before starting connection (in case layout changed)
		calculateHandleOffset();
		const absolute_position = getAbsolutePosition();
		flow.startConnection(node_id, id, port, effectivePosition, absolute_position);
	}

	function handleMouseUp(e: MouseEvent) {
		if (type !== 'input') return;
		if (!flow.draft_connection) return;
		if (flow.locked) return;
		e.stopPropagation();

		flow.finishConnection(node_id, id);
	}

	function handleClick(e: MouseEvent) {
		if (flow.locked) return;
		e.stopPropagation();

		// If there's an active draft connection and this is an input handle, finish it
		if (flow.draft_connection && type === 'input') {
			if (flow.draft_connection.source_node_id !== node_id) {
				flow.finishConnection(node_id, id);
			}
			return;
		}

		// If no draft connection and this is an output handle, start one
		if (!flow.draft_connection && type === 'output') {
			calculateHandleOffset();
			const absolute_position = getAbsolutePosition();
			flow.startConnection(node_id, id, port, effectivePosition, absolute_position);
		}
	}

	function handleMouseEnter() {
		// Visual feedback handled by CSS classes
	}

	// Computed style - only apply custom styles, positioning handled by CSS classes
	const computedStyle = $derived(style);
</script>

<div
	class="kaykay-handle kaykay-handle-{type} kaykay-handle-{effectivePosition} {className}"
	class:can-connect={can_accept_connection}
	class:incompatible={is_incompatible}
	class:locked={flow.locked}
	class:in-group={isInGroup}
	class:connecting={flow.draft_connection &&
		type === 'output' &&
		flow.draft_connection.source_handle_id === id &&
		flow.draft_connection.source_node_id === node_id}
	bind:this={handleEl}
	style={computedStyle}
	onmousedown={handleMouseDown}
	onmouseup={handleMouseUp}
	onclick={handleClick}
	onmouseenter={handleMouseEnter}
	role="button"
	tabindex="-1"
	data-handle-id={id}
	data-handle-type={type}
	data-handle-port={port}
	title="{id} - {type} - {port}"
>
	{#if label}
		<span class="kaykay-handle-label">{label}</span>
	{/if}
</div>

<style>
	.kaykay-handle {
		position: absolute;
		width: 12px;
		height: 12px;
		background: #555;
		border: 2px solid #888;
		cursor: crosshair;
		z-index: 10;
		transition: transform 0.15s ease, background 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
	}

	/* Position styles for standalone handles */
	.kaykay-handle-left:not(.in-group) {
		left: -6px;
		top: 50%;
		margin-top: -6px;
	}

	.kaykay-handle-right:not(.in-group) {
		right: -6px;
		top: 50%;
		margin-top: -6px;
	}

	.kaykay-handle-top:not(.in-group) {
		top: -6px;
		left: 50%;
		margin-left: -6px;
	}

	.kaykay-handle-bottom:not(.in-group) {
		bottom: -6px;
		left: 50%;
		margin-left: -6px;
	}

	/* When inside a HandleGroup, use relative positioning */
	.kaykay-handle.in-group {
		position: relative;
		flex-shrink: 0;
	}

	.kaykay-handle-input {
		background: #fff;
		border-color: #999;
	}

	.kaykay-handle-output {
		background: #fff;
		border-color: #999;
	}

	.kaykay-handle:hover {
		transform: scale(1.3);
	}

	.kaykay-handle.can-connect {
		background: #4ade80;
		border-color: #22c55e;
		box-shadow: 0 0 8px #4ade80;
	}

	.kaykay-handle.incompatible {
		background: #666;
		border-color: #444;
		opacity: 0.5;
	}

	.kaykay-handle.connecting {
		background: #fbbf24;
		border-color: #f59e0b;
	}

	.kaykay-handle.locked {
		cursor: default;
	}

	.kaykay-handle-label {
		position: absolute;
		white-space: nowrap;
		font-size: 10px;
		color: #888;
		background-color: #fff;
		padding: 0 4px;
		pointer-events: none;
		z-index: 2;
	}

	.kaykay-handle-left .kaykay-handle-label {
		right: 100%;
		margin-right: 4px;
		top: 50%;
		transform: translateY(-50%);
	}

	.kaykay-handle-right .kaykay-handle-label {
		left: 100%;
		margin-left: 4px;
		top: 50%;
		transform: translateY(-50%);
	}
</style>

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
		position = type === 'input' ? 'left' : 'right',
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

	onMount(() => {
		// Find parent node
		const nodeEl = handleEl.closest('[data-node-id]');
		if (nodeEl) {
			node_id = nodeEl.getAttribute('data-node-id') || '';
			// Calculate handle's offset within the node (do this once on mount)
			calculateHandleOffset();
			registerHandle();
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
			position,
			accept,
			label,
			absolute_position,
		});
	}

	function getAbsolutePosition(): Position {
		const node = flow.getNode(node_id);
		if (!node) return { x: 0, y: 0 };

		// Use cached offset + current node position
		return {
			x: node.position.x + handle_offset.x,
			y: node.position.y + handle_offset.y,
		};
	}

	// Update position when node moves or handle mounts
	$effect(() => {
		if (node_id && handleEl) {
			const node = flow.getNode(node_id);
			// Track node position and viewport to trigger recalculation
			if (node) {
				// Access these to create reactive dependency
				void node.position.x;
				void node.position.y;
				void flow.viewport.x;
				void flow.viewport.y;
				void flow.viewport.zoom;
			}

			const absolute_position = getAbsolutePosition();
			flow.updateHandlePosition(node_id, id, absolute_position);
		}
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

		const absolute_position = getAbsolutePosition();
		flow.startConnection(node_id, id, port, position, absolute_position);
	}

	function handleMouseUp(e: MouseEvent) {
		if (type !== 'input') return;
		if (!flow.draft_connection) return;
		if (flow.locked) return;
		e.stopPropagation();

		flow.finishConnection(node_id, id);
	}

	function handleMouseEnter() {
		// Visual feedback handled by CSS classes
	}

	// Position styles based on handle position
	const positionStyles: Record<HandlePosition, string> = {
		left: 'left: -6px; top: 50%; transform: translateY(-50%);',
		right: 'right: -6px; top: 50%; transform: translateY(-50%);',
		top: 'top: -6px; left: 50%; transform: translateX(-50%);',
		bottom: 'bottom: -6px; left: 50%; transform: translateX(-50%);',
	};
</script>

<div
	class="kaykay-handle kaykay-handle-{type} kaykay-handle-{position} {className}"
	class:can-connect={can_accept_connection}
	class:incompatible={is_incompatible}
	class:locked={flow.locked}
	class:connecting={flow.draft_connection &&
		type === 'output' &&
		flow.draft_connection.source_handle_id === id &&
		flow.draft_connection.source_node_id === node_id}
	bind:this={handleEl}
	style="{positionStyles[position]} {style}"
	onmousedown={handleMouseDown}
	onmouseup={handleMouseUp}
	onmouseenter={handleMouseEnter}
	role="button"
	tabindex="-1"
	data-handle-id={id}
	data-handle-type={type}
	data-handle-port={port}
	title="{label ? `${label} - ` : ''}{type} - {port}"
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
		transition: all 0.15s ease;
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

	.kaykay-handle-left:hover,
	.kaykay-handle-right:hover {
		transform: translateY(-50%) scale(1.3);
	}

	.kaykay-handle-top:hover,
	.kaykay-handle-bottom:hover {
		transform: translateX(-50%) scale(1.3);
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

<script lang="ts">
	import { getContext } from 'svelte';
	import type { Component } from 'svelte';
	import type { NodeState, NodeProps, Position } from '../types/index.js';
	import type { FlowState } from '../stores/flow.svelte.js';

	interface Props {
		node: NodeState;
		component: Component<NodeProps>;
		selected: boolean;
	}

	const { node, component, selected }: Props = $props();

	const FLOW_CONTEXT_KEY = Symbol.for('kaykay-flow');
	const flow = getContext<FlowState>(FLOW_CONTEXT_KEY);

	let nodeEl: HTMLDivElement;
	let isDragging = $state(false);
	let hasMoved = $state(false); // Track if node actually moved during drag
	let dragOffset = $state<Position>({ x: 0, y: 0 });
	let dragStartPos = $state<Position>({ x: 0, y: 0 }); // Track start position

	// Get absolute position (accounting for parent)
	const absolutePosition = $derived(flow.getAbsolutePosition(node.id));

	// Update node dimensions when mounted
	$effect(() => {
		if (nodeEl) {
			const rect = nodeEl.getBoundingClientRect();
			flow.updateNodeDimensions(node.id, rect.width / flow.viewport.zoom, rect.height / flow.viewport.zoom);
		}
	});

	function handleMouseDown(e: MouseEvent) {
		if (e.button !== 0) return;
		e.stopPropagation();

		flow.selectNode(node.id, e.shiftKey);

		// Don't allow dragging when locked
		if (flow.locked) return;

		isDragging = true;
		hasMoved = false;
		
		// Use absolute position for drag offset calculation
		dragOffset = {
			x: e.clientX - absolutePosition.x * flow.viewport.zoom - flow.viewport.x,
			y: e.clientY - absolutePosition.y * flow.viewport.zoom - flow.viewport.y,
		};
		
		// Store start position for movement detection
		dragStartPos = { x: e.clientX, y: e.clientY };

		flow.callbacks.on_node_drag_start?.(node.id);

		window.addEventListener('mousemove', handleMouseMove);
		window.addEventListener('mouseup', handleMouseUp);
	}

	function handleMouseMove(e: MouseEvent) {
		if (!isDragging || flow.locked) return;

		// Check if we've moved enough to consider it a drag (5px threshold)
		const dx = e.clientX - dragStartPos.x;
		const dy = e.clientY - dragStartPos.y;
		if (!hasMoved && Math.sqrt(dx * dx + dy * dy) > 5) {
			hasMoved = true;
		}

		// Calculate new absolute position
		const newAbsolutePos: Position = {
			x: (e.clientX - dragOffset.x - flow.viewport.x) / flow.viewport.zoom,
			y: (e.clientY - dragOffset.y - flow.viewport.y) / flow.viewport.zoom,
		};

		// If node has a parent, convert to relative position
		if (node.parent_id) {
			const parentAbsPos = flow.getAbsolutePosition(node.parent_id);
			flow.updateNodePosition(node.id, {
				x: newAbsolutePos.x - parentAbsPos.x,
				y: newAbsolutePos.y - parentAbsPos.y,
			});
		} else {
			flow.updateNodePosition(node.id, newAbsolutePos);
		}
	}

	function handleMouseUp(e: MouseEvent) {
		if (isDragging) {
			isDragging = false;

			// Only check for group changes if the node actually moved
			if (hasMoved && node.type !== 'group') {
				const dropPos: Position = {
					x: (e.clientX - dragOffset.x - flow.viewport.x) / flow.viewport.zoom,
					y: (e.clientY - dragOffset.y - flow.viewport.y) / flow.viewport.zoom,
				};

				// Check if still inside current parent group
				if (node.parent_id) {
					const currentParent = flow.getNode(node.parent_id);
					if (currentParent) {
						const parentAbsPos = flow.getAbsolutePosition(node.parent_id);
						const isInsideParent = 
							dropPos.x >= parentAbsPos.x &&
							dropPos.x <= parentAbsPos.x + currentParent.computed_width &&
							dropPos.y >= parentAbsPos.y &&
							dropPos.y <= parentAbsPos.y + currentParent.computed_height;
						
						if (isInsideParent) {
							// Still inside parent, don't change anything
							if (hasMoved) {
								flow.callbacks.on_node_drag_end?.(node.id, node.position);
							}
							window.removeEventListener('mousemove', handleMouseMove);
							window.removeEventListener('mouseup', handleMouseUp);
							return;
						} else {
							// Dropped outside parent - ungroup
							flow.setNodeParent(node.id, undefined);
						}
					}
				}

				// Check if dropped into a new group (only if we don't have a parent or just left one)
				if (!node.parent_id) {
					const targetGroup = flow.findGroupAtPosition(dropPos, [node.id]);
					if (targetGroup) {
						flow.setNodeParent(node.id, targetGroup.id);
					}
				}
			}

			if (hasMoved) {
				flow.callbacks.on_node_drag_end?.(node.id, node.position);
			}
		}
		window.removeEventListener('mousemove', handleMouseMove);
		window.removeEventListener('mouseup', handleMouseUp);
	}

	// Compute style using absolute position for rendering
	const nodeStyle = $derived(
		`transform: translate(${absolutePosition.x}px, ${absolutePosition.y}px); z-index: ${node.z_index ?? (node.type === 'group' ? 0 : 1)};`
	);

	const isLocked = $derived(flow.locked);
	const isGroup = $derived(node.type === 'group');
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
	class="kaykay-node"
	class:selected
	class:dragging={isDragging}
	class:locked={isLocked}
	class:group={isGroup}
	bind:this={nodeEl}
	style={nodeStyle}
	style:width={node.width ? `${node.width}px` : undefined}
	style:height={node.height ? `${node.height}px` : undefined}
	onmousedown={handleMouseDown}
	role="group"
	data-node-id={node.id}
>
	{#if component}
		{@const Component = component}
		<Component
			id={node.id}
			data={node.data}
			{selected}
		/>
	{/if}
</div>

<style>
	.kaykay-node {
		position: absolute;
		cursor: move;
		user-select: none;
	}

	.kaykay-node.locked {
		cursor: default;
	}

	.kaykay-node.selected {
		z-index: 10 !important;
		outline: 2px solid #4a9eff;
	}

	.kaykay-node.dragging {
		z-index: 100 !important;
	}

	.kaykay-node.group {
		z-index: 0;
	}

	.kaykay-node.group.selected {
		z-index: 0 !important;
		outline-offset: -2px;
	}
</style>

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
	let otherSelectedOffsets = $state<Map<string, Position>>(new Map()); // Offsets for other selected nodes

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
		
		// Don't start dragging if clicking on a handle (let handle process it)
		const target = e.target as HTMLElement;
		if (target.closest('[data-handle-id]')) return;
		
		e.stopPropagation();

		// If this node is already selected and we're not holding shift,
		// don't change the selection (allows dragging multiple nodes)
		const isAlreadySelected = flow.selected_node_ids.has(node.id);
		if (!isAlreadySelected) {
			flow.selectNode(node.id, e.shiftKey || e.ctrlKey || e.metaKey);
		}

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

		// Calculate offsets for all other selected nodes (for multi-drag)
		otherSelectedOffsets = new Map();
		for (const selected_id of flow.selected_node_ids) {
			if (selected_id !== node.id) {
				const other_abs_pos = flow.getAbsolutePosition(selected_id);
				otherSelectedOffsets.set(selected_id, {
					x: e.clientX - other_abs_pos.x * flow.viewport.zoom - flow.viewport.x,
					y: e.clientY - other_abs_pos.y * flow.viewport.zoom - flow.viewport.y,
				});
			}
		}

		// Save snapshot for undo before drag starts
		flow.pushSnapshot();

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

		// Calculate new absolute position for this node
		const newAbsolutePos: Position = {
			x: (e.clientX - dragOffset.x - flow.viewport.x) / flow.viewport.zoom,
			y: (e.clientY - dragOffset.y - flow.viewport.y) / flow.viewport.zoom,
		};

		// Update this node's position
		if (node.parent_id) {
			const parentAbsPos = flow.getAbsolutePosition(node.parent_id);
			flow.updateNodePosition(node.id, {
				x: newAbsolutePos.x - parentAbsPos.x,
				y: newAbsolutePos.y - parentAbsPos.y,
			});
		} else {
			flow.updateNodePosition(node.id, newAbsolutePos);
		}

		// Move all other selected nodes
		for (const [other_id, offset] of otherSelectedOffsets) {
			const other_node = flow.getNode(other_id);
			if (!other_node) continue;

			const otherNewAbsPos: Position = {
				x: (e.clientX - offset.x - flow.viewport.x) / flow.viewport.zoom,
				y: (e.clientY - offset.y - flow.viewport.y) / flow.viewport.zoom,
			};

			if (other_node.parent_id) {
				const parentAbsPos = flow.getAbsolutePosition(other_node.parent_id);
				flow.updateNodePosition(other_id, {
					x: otherNewAbsPos.x - parentAbsPos.x,
					y: otherNewAbsPos.y - parentAbsPos.y,
				});
			} else {
				flow.updateNodePosition(other_id, otherNewAbsPos);
			}
		}
	}

	// Helper to process group membership for a node after drag
	function processGroupMembershipAfterDrag(node_id: string) {
		const moved_node = flow.getNode(node_id);
		if (!moved_node) return;

		// Skip group membership logic for group nodes themselves
		if (moved_node.type === 'group') {
			flow.updateGroupMembership(node_id);
			return;
		}

		const dropPos: Position = flow.getAbsolutePosition(node_id);

		// Check if still inside current parent group
		if (moved_node.parent_id) {
			const currentParent = flow.getNode(moved_node.parent_id);
			if (currentParent) {
				const parentAbsPos = flow.getAbsolutePosition(moved_node.parent_id);
				const isInsideParent = 
					dropPos.x >= parentAbsPos.x &&
					dropPos.x <= parentAbsPos.x + currentParent.computed_width &&
					dropPos.y >= parentAbsPos.y &&
					dropPos.y <= parentAbsPos.y + currentParent.computed_height;
				
				if (isInsideParent) {
					// Still inside parent, don't change anything
					return;
				} else {
					// Dropped outside parent - ungroup
					flow.setNodeParent(node_id, undefined);
				}
			}
		}

		// Check if dropped into a new group (only if we don't have a parent or just left one)
		const updated_node = flow.getNode(node_id);
		if (updated_node && !updated_node.parent_id) {
			// Get all node IDs being dragged to exclude from group detection
			const all_dragged_ids = [node.id, ...otherSelectedOffsets.keys()];
			const targetGroup = flow.findGroupAtPosition(dropPos, all_dragged_ids);
			if (targetGroup) {
				flow.setNodeParent(node_id, targetGroup.id);
			}
		}
	}

	function handleMouseUp(e: MouseEvent) {
		if (isDragging) {
			isDragging = false;

			// Only check for group changes if nodes actually moved
			if (hasMoved) {
				// Process this node
				processGroupMembershipAfterDrag(node.id);

				// Process all other selected nodes
				for (const [other_id] of otherSelectedOffsets) {
					processGroupMembershipAfterDrag(other_id);
				}

				flow.callbacks.on_node_drag_end?.(node.id, node.position);
			}
		}
		window.removeEventListener('mousemove', handleMouseMove);
		window.removeEventListener('mouseup', handleMouseUp);
	}

	// Touch event handlers for node dragging
	function handleTouchStart(e: TouchEvent) {
		if (e.touches.length !== 1) return;

		// Don't start dragging if touching a handle
		const target = e.target as HTMLElement;
		if (target.closest('[data-handle-id]')) return;

		e.stopPropagation();

		const touch = e.touches[0];
		
		// If this node is already selected, don't change the selection (allows dragging multiple nodes)
		const isAlreadySelected = flow.selected_node_ids.has(node.id);
		if (!isAlreadySelected) {
			flow.selectNode(node.id, false);
		}

		// Don't allow dragging when locked
		if (flow.locked) return;

		isDragging = true;
		hasMoved = false;

		// Use absolute position for drag offset calculation
		dragOffset = {
			x: touch.clientX - absolutePosition.x * flow.viewport.zoom - flow.viewport.x,
			y: touch.clientY - absolutePosition.y * flow.viewport.zoom - flow.viewport.y,
		};

		// Store start position for movement detection
		dragStartPos = { x: touch.clientX, y: touch.clientY };

		// Calculate offsets for all other selected nodes (for multi-drag)
		otherSelectedOffsets = new Map();
		for (const selected_id of flow.selected_node_ids) {
			if (selected_id !== node.id) {
				const other_abs_pos = flow.getAbsolutePosition(selected_id);
				otherSelectedOffsets.set(selected_id, {
					x: touch.clientX - other_abs_pos.x * flow.viewport.zoom - flow.viewport.x,
					y: touch.clientY - other_abs_pos.y * flow.viewport.zoom - flow.viewport.y,
				});
			}
		}

		// Save snapshot for undo before drag starts
		flow.pushSnapshot();

		flow.callbacks.on_node_drag_start?.(node.id);

		window.addEventListener('touchmove', handleTouchMove, { passive: false });
		window.addEventListener('touchend', handleTouchEnd);
		window.addEventListener('touchcancel', handleTouchCancel);
	}

	function handleTouchMove(e: TouchEvent) {
		if (!isDragging || flow.locked || e.touches.length !== 1) return;

		e.preventDefault(); // Prevent scrolling while dragging

		const touch = e.touches[0];

		// Check if we've moved enough to consider it a drag (5px threshold)
		const dx = touch.clientX - dragStartPos.x;
		const dy = touch.clientY - dragStartPos.y;
		if (!hasMoved && Math.sqrt(dx * dx + dy * dy) > 5) {
			hasMoved = true;
		}

		// Calculate new absolute position for this node
		const newAbsolutePos: Position = {
			x: (touch.clientX - dragOffset.x - flow.viewport.x) / flow.viewport.zoom,
			y: (touch.clientY - dragOffset.y - flow.viewport.y) / flow.viewport.zoom,
		};

		// Update this node's position
		if (node.parent_id) {
			const parentAbsPos = flow.getAbsolutePosition(node.parent_id);
			flow.updateNodePosition(node.id, {
				x: newAbsolutePos.x - parentAbsPos.x,
				y: newAbsolutePos.y - parentAbsPos.y,
			});
		} else {
			flow.updateNodePosition(node.id, newAbsolutePos);
		}

		// Move all other selected nodes
		for (const [other_id, offset] of otherSelectedOffsets) {
			const other_node = flow.getNode(other_id);
			if (!other_node) continue;

			const otherNewAbsPos: Position = {
				x: (touch.clientX - offset.x - flow.viewport.x) / flow.viewport.zoom,
				y: (touch.clientY - offset.y - flow.viewport.y) / flow.viewport.zoom,
			};

			if (other_node.parent_id) {
				const parentAbsPos = flow.getAbsolutePosition(other_node.parent_id);
				flow.updateNodePosition(other_id, {
					x: otherNewAbsPos.x - parentAbsPos.x,
					y: otherNewAbsPos.y - parentAbsPos.y,
				});
			} else {
				flow.updateNodePosition(other_id, otherNewAbsPos);
			}
		}
	}

	function handleTouchEnd(e: TouchEvent) {
		if (isDragging && e.changedTouches.length > 0) {
			isDragging = false;

			// Only check for group changes if nodes actually moved
			if (hasMoved) {
				// Process this node
				processGroupMembershipAfterDrag(node.id);

				// Process all other selected nodes
				for (const [other_id] of otherSelectedOffsets) {
					processGroupMembershipAfterDrag(other_id);
				}

				flow.callbacks.on_node_drag_end?.(node.id, node.position);
			}
		}
		cleanupTouchListeners();
	}

	function handleTouchCancel() {
		isDragging = false;
		cleanupTouchListeners();
	}

	function cleanupTouchListeners() {
		window.removeEventListener('touchmove', handleTouchMove);
		window.removeEventListener('touchend', handleTouchEnd);
		window.removeEventListener('touchcancel', handleTouchCancel);
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
	ontouchstart={handleTouchStart}
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
		touch-action: none; /* Prevent default touch behaviors for custom handling */
	}

	.kaykay-node.locked {
		cursor: default;
	}

	.kaykay-node.selected {
		z-index: 10 !important;
		outline: 2px solid var(--kaykay-node-selected-outline, #eb5425);
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

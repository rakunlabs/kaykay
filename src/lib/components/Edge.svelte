<script lang="ts">
	import { getContext } from 'svelte';
	import type { FlowEdge, Position } from '../types/index.js';
	import type { FlowState } from '../stores/flow.svelte.js';
	import { getEdgePathWithWaypoints, getEdgeCenter } from '../utils/edge-path.js';

	interface Props {
		edge: FlowEdge;
		selected: boolean;
		onselect: () => void;
	}

	const { edge, selected, onselect }: Props = $props();

	const FLOW_CONTEXT_KEY = Symbol.for('kaykay-flow');
	const flow = getContext<FlowState>(FLOW_CONTEXT_KEY);

	// Get source and target handle info (for position type like 'left', 'right')
	const source_handle = $derived(flow.getHandle(edge.source, edge.source_handle));
	const target_handle = $derived(flow.getHandle(edge.target, edge.target_handle));

	// Get reactive handle positions - these update when nodes move
	const source_position = $derived(flow.getHandlePosition(edge.source, edge.source_handle));
	const target_position = $derived(flow.getHandlePosition(edge.target, edge.target_handle));

	// Get waypoints reactively
	const waypoints = $derived(edge.waypoints ?? []);

	// Calculate paths (array of path segments)
	const paths = $derived.by(() => {
		if (!source_handle || !target_handle || !source_position || !target_position) return [];

		return getEdgePathWithWaypoints(
			source_position,
			source_handle.position,
			target_position,
			target_handle.position,
			edge.type ?? 'bezier',
			waypoints
		);
	});

	// Combined path for rendering
	const combinedPath = $derived(paths.join(' '));

	// Calculate label position
	const label_position = $derived.by(() => {
		if (!source_position || !target_position) return { x: 0, y: 0 };

		if (waypoints.length > 0) {
			// Put label at middle waypoint or between first two points
			const midIndex = Math.floor(waypoints.length / 2);
			const allPoints = [source_position, ...waypoints, target_position];
			return getEdgeCenter(allPoints[midIndex], allPoints[midIndex + 1]);
		}

		return getEdgeCenter(source_position, target_position);
	});

	// Dragging waypoint state
	let draggingWaypointIndex = $state<number | null>(null);

	function handleClick(e: MouseEvent) {
		e.stopPropagation();

		// Ctrl+click to add waypoint
		if (e.ctrlKey || e.metaKey) {
			if (flow.locked) return;
			
			// Get click position in canvas coordinates
			const rect = (e.currentTarget as SVGElement).ownerSVGElement?.getBoundingClientRect();
			if (!rect) return;

			const clickPos: Position = flow.screenToCanvas({
				x: e.clientX - rect.left,
				y: e.clientY - rect.top,
			});

			// Find the best index to insert the waypoint
			const insertIndex = findBestWaypointIndex(clickPos);
			flow.addEdgeWaypoint(edge.id, clickPos, insertIndex);
			return;
		}

		onselect();
	}

	// Find the best index to insert a new waypoint based on click position
	function findBestWaypointIndex(clickPos: Position): number {
		if (!source_position || !target_position) return 0;

		const allPoints = [source_position, ...waypoints, target_position];
		let bestIndex = 0;
		let bestDistance = Infinity;

		for (let i = 0; i < allPoints.length - 1; i++) {
			const from = allPoints[i];
			const to = allPoints[i + 1];
			
			// Calculate distance from click to line segment
			const dist = distanceToSegment(clickPos, from, to);
			if (dist < bestDistance) {
				bestDistance = dist;
				bestIndex = i;
			}
		}

		return bestIndex;
	}

	// Calculate distance from point to line segment
	function distanceToSegment(point: Position, segStart: Position, segEnd: Position): number {
		const dx = segEnd.x - segStart.x;
		const dy = segEnd.y - segStart.y;
		const lengthSquared = dx * dx + dy * dy;

		if (lengthSquared === 0) {
			return Math.sqrt(Math.pow(point.x - segStart.x, 2) + Math.pow(point.y - segStart.y, 2));
		}

		let t = ((point.x - segStart.x) * dx + (point.y - segStart.y) * dy) / lengthSquared;
		t = Math.max(0, Math.min(1, t));

		const closestX = segStart.x + t * dx;
		const closestY = segStart.y + t * dy;

		return Math.sqrt(Math.pow(point.x - closestX, 2) + Math.pow(point.y - closestY, 2));
	}

	function handleWaypointMouseDown(e: MouseEvent, index: number) {
		if (flow.locked) return;
		e.stopPropagation();
		e.preventDefault();

		// Ctrl+click to delete waypoint
		if (e.ctrlKey || e.metaKey) {
			flow.removeEdgeWaypoint(edge.id, index);
			return;
		}

		draggingWaypointIndex = index;

		window.addEventListener('mousemove', handleWaypointDrag);
		window.addEventListener('mouseup', handleWaypointMouseUp);
	}

	function handleWaypointDrag(e: MouseEvent) {
		if (draggingWaypointIndex === null) return;

		const canvasEl = document.querySelector('.kaykay-canvas');
		if (!canvasEl) return;

		const rect = canvasEl.getBoundingClientRect();
		const newPos: Position = flow.screenToCanvas({
			x: e.clientX - rect.left,
			y: e.clientY - rect.top,
		});

		flow.updateEdgeWaypoint(edge.id, draggingWaypointIndex, newPos);
	}

	function handleWaypointMouseUp() {
		draggingWaypointIndex = null;
		window.removeEventListener('mousemove', handleWaypointDrag);
		window.removeEventListener('mouseup', handleWaypointMouseUp);
	}
</script>

{#if combinedPath}
	<g class="kaykay-edge" class:selected>
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- Invisible wider path for easier selection -->
		<path class="kaykay-edge-hitbox" d={combinedPath} onclick={handleClick} />
		<!-- Visible edge path -->
		<path class="kaykay-edge-path" d={combinedPath} />

		{#if edge.label}
			<text class="kaykay-edge-label" x={label_position.x} y={label_position.y}>
				{edge.label}
			</text>
		{/if}

		<!-- Waypoint handles -->
		{#each waypoints as waypoint, index}
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<circle
				class="kaykay-waypoint"
				class:dragging={draggingWaypointIndex === index}
				cx={waypoint.x}
				cy={waypoint.y}
				r="6"
				onmousedown={(e) => handleWaypointMouseDown(e, index)}
			/>
		{/each}
	</g>
{/if}

<style>
	.kaykay-edge-hitbox {
		fill: none;
		stroke: transparent;
		stroke-width: 30px;
		stroke-linecap: round;
		cursor: pointer;
		pointer-events: stroke;
	}

	.kaykay-edge-path {
		fill: none;
		stroke: #888;
		stroke-width: 2px;
		pointer-events: none;
		transition: stroke 0.15s ease;
	}

	.kaykay-edge:hover .kaykay-edge-path {
		stroke: #aaa;
	}

	.kaykay-edge.selected .kaykay-edge-path {
		stroke: #4a9eff;
		stroke-width: 3px;
	}

	.kaykay-edge-label {
		fill: #888;
		font-size: 12px;
		text-anchor: middle;
		dominant-baseline: middle;
		pointer-events: none;
		user-select: none;
	}

	.kaykay-waypoint {
		fill: #fff;
		stroke: #888;
		stroke-width: 2px;
		cursor: grab;
		pointer-events: auto;
		opacity: 0;
		transition: opacity 0.15s ease, fill 0.15s ease;
	}

	.kaykay-edge:hover .kaykay-waypoint,
	.kaykay-edge.selected .kaykay-waypoint {
		opacity: 1;
	}

	.kaykay-waypoint:hover {
		fill: #4a9eff;
		stroke: #2563eb;
	}

	.kaykay-waypoint.dragging {
		fill: #fbbf24;
		stroke: #f59e0b;
		cursor: grabbing;
		opacity: 1;
	}

	.kaykay-edge.selected .kaykay-waypoint {
		stroke: #4a9eff;
	}
</style>

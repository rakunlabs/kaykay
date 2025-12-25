<script lang="ts">
	import { getContext } from 'svelte';
	import type { FlowEdge, Position, EdgeStyle, EdgeType } from '../types/index.js';
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

	// Style options
	const styleOptions: { value: EdgeStyle; label: string }[] = [
		{ value: 'solid', label: 'Solid' },
		{ value: 'dashed', label: 'Dashed' },
		{ value: 'dotted', label: 'Dotted' },
	];

	// Edge type options
	const typeOptions: { value: EdgeType; label: string }[] = [
		{ value: 'bezier', label: 'Bezier' },
		{ value: 'step', label: 'Step' },
		{ value: 'straight', label: 'Straight' },
	];

	// Get stroke-dasharray based on style
	function getStrokeDashArray(style?: EdgeStyle): string {
		switch (style) {
			case 'dashed':
				return '8 4';
			case 'dotted':
				return '2 4';
			default:
				return 'none';
		}
	}

	// Derived values for edge styling
	const strokeColor = $derived(edge.color ?? '#888');
	const strokeDashArray = $derived(getStrokeDashArray(edge.style));
	const isAnimated = $derived(edge.animated ?? false);

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

	// Calculate approximate path length for consistent animation speed
	const pathLength = $derived.by(() => {
		if (!source_position || !target_position) return 100;
		
		const allPoints = [source_position, ...waypoints, target_position];
		let length = 0;
		
		for (let i = 0; i < allPoints.length - 1; i++) {
			const dx = allPoints[i + 1].x - allPoints[i].x;
			const dy = allPoints[i + 1].y - allPoints[i].y;
			length += Math.sqrt(dx * dx + dy * dy);
		}
		
		return Math.max(length, 50); // minimum length to avoid too fast animation
	});

	// Animation duration based on path length (pixels per second)
	const ARROW_SPEED = 150; // pixels per second
	const MIN_DURATION = 1.5; // minimum animation duration in seconds
	const animationDuration = $derived(Math.max(pathLength / ARROW_SPEED, MIN_DURATION));

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

	// Context menu handlers
	function handleContextMenu(e: MouseEvent) {
		if (flow.locked) return;
		e.preventDefault();
		e.stopPropagation();

		// Position context menu at mouse location
		contextMenuPos = { x: e.clientX, y: e.clientY };
		showContextMenu = true;

		// Select the edge when right-clicking
		onselect();

		// Add listener to close menu when clicking outside
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

	function setEdgeStyle(style: EdgeStyle) {
		flow.updateEdge(edge.id, { style });
		closeContextMenu();
	}

	function setEdgeColor(color: string) {
		flow.updateEdge(edge.id, { color });
		closeContextMenu();
	}

	function setEdgeType(type: EdgeType) {
		flow.updateEdge(edge.id, { type });
		closeContextMenu();
	}

	function toggleAnimated() {
		flow.updateEdge(edge.id, { animated: !edge.animated });
		closeContextMenu();
	}

	// Portal-based context menu rendering
	let menuContainer: HTMLDivElement | null = null;

	$effect(() => {
		if (showContextMenu) {
			// Create menu container
			menuContainer = document.createElement('div');
			menuContainer.className = 'kaykay-edge-context-menu';
			menuContainer.style.cssText = `
				position: fixed;
				visibility: hidden;
				background: #1e1e1e;
				border: 1px solid #333;
				border-radius: 8px;
				padding: 8px;
				min-width: 150px;
				box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
				z-index: 10000;
				font-family: system-ui, -apple-system, sans-serif;
				font-size: 12px;
			`;

			// Style section
			const styleSection = document.createElement('div');
			styleSection.style.marginBottom = '8px';
			
			const styleLabel = document.createElement('div');
			styleLabel.textContent = 'Style';
			styleLabel.style.cssText = 'color: #888; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; padding: 0 4px;';
			styleSection.appendChild(styleLabel);

			const styleOptions = document.createElement('div');
			styleOptions.style.cssText = 'display: flex; gap: 4px;';
			
			(['solid', 'dashed', 'dotted'] as EdgeStyle[]).forEach((style) => {
				const btn = document.createElement('button');
				btn.textContent = style.charAt(0).toUpperCase() + style.slice(1);
				const isActive = edge.style === style || (!edge.style && style === 'solid');
				btn.style.cssText = `
					flex: 1;
					padding: 6px 8px;
					background: ${isActive ? '#3b82f6' : '#2a2a2a'};
					border: 1px solid ${isActive ? '#3b82f6' : '#333'};
					border-radius: 4px;
					color: ${isActive ? '#fff' : '#ccc'};
					cursor: pointer;
				`;
				btn.onclick = (e) => {
					e.stopPropagation();
					setEdgeStyle(style);
				};
				styleOptions.appendChild(btn);
			});
			styleSection.appendChild(styleOptions);
			menuContainer.appendChild(styleSection);

			// Type section (bezier, step, straight)
			const typeSection = document.createElement('div');
			typeSection.style.marginBottom = '8px';
			
			const typeLabel = document.createElement('div');
			typeLabel.textContent = 'Type';
			typeLabel.style.cssText = 'color: #888; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; padding: 0 4px;';
			typeSection.appendChild(typeLabel);

			const typeOptionsDiv = document.createElement('div');
			typeOptionsDiv.style.cssText = 'display: flex; gap: 4px;';
			
			(['bezier', 'step', 'straight'] as EdgeType[]).forEach((type) => {
				const btn = document.createElement('button');
				btn.textContent = type.charAt(0).toUpperCase() + type.slice(1);
				const isActive = edge.type === type || (!edge.type && type === 'bezier');
				btn.style.cssText = `
					flex: 1;
					padding: 6px 8px;
					background: ${isActive ? '#3b82f6' : '#2a2a2a'};
					border: 1px solid ${isActive ? '#3b82f6' : '#333'};
					border-radius: 4px;
					color: ${isActive ? '#fff' : '#ccc'};
					cursor: pointer;
				`;
				btn.onclick = (e) => {
					e.stopPropagation();
					setEdgeType(type);
				};
				typeOptionsDiv.appendChild(btn);
			});
			typeSection.appendChild(typeOptionsDiv);
			menuContainer.appendChild(typeSection);

			// Animated section
			const animSection = document.createElement('div');
			animSection.style.marginBottom = '8px';
			
			const animLabel = document.createElement('div');
			animLabel.textContent = 'Animated';
			animLabel.style.cssText = 'color: #888; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; padding: 0 4px;';
			animSection.appendChild(animLabel);

			const animOptions = document.createElement('div');
			animOptions.style.cssText = 'display: flex; gap: 4px;';
			
			const animBtn = document.createElement('button');
			animBtn.textContent = edge.animated ? 'On' : 'Off';
			animBtn.style.cssText = `
				flex: 1;
				padding: 6px 8px;
				background: ${edge.animated ? '#3b82f6' : '#2a2a2a'};
				border: 1px solid ${edge.animated ? '#3b82f6' : '#333'};
				border-radius: 4px;
				color: ${edge.animated ? '#fff' : '#ccc'};
				cursor: pointer;
			`;
			animBtn.onclick = (e) => {
				e.stopPropagation();
				toggleAnimated();
			};
			animOptions.appendChild(animBtn);
			animSection.appendChild(animOptions);
			menuContainer.appendChild(animSection);

			// Color section
			const colorSection = document.createElement('div');
			
			const colorLabel = document.createElement('div');
			colorLabel.textContent = 'Color';
			colorLabel.style.cssText = 'color: #888; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; padding: 0 4px;';
			colorSection.appendChild(colorLabel);

			const colorOptionsDiv = document.createElement('div');
			colorOptionsDiv.style.cssText = 'display: flex; gap: 4px; flex-wrap: wrap;';
			
			colorOptions.forEach((color) => {
				const swatch = document.createElement('button');
				const isActive = edge.color === color || (!edge.color && color === '#888888');
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
					setEdgeColor(color);
				};
				colorOptionsDiv.appendChild(swatch);
			});
			colorSection.appendChild(colorOptionsDiv);
			menuContainer.appendChild(colorSection);

			// Prevent clicks inside menu from closing it
			menuContainer.onclick = (e) => e.stopPropagation();

			document.body.appendChild(menuContainer);

			// Auto-position to keep menu within viewport
			requestAnimationFrame(() => {
				if (!menuContainer) return;
				
				const menuRect = menuContainer.getBoundingClientRect();
				const viewportWidth = window.innerWidth;
				const viewportHeight = window.innerHeight;
				const padding = 8; // Small padding from viewport edge

				let x = contextMenuPos.x;
				let y = contextMenuPos.y;

				// Flip horizontally if menu would overflow right edge
				if (x + menuRect.width > viewportWidth - padding) {
					x = Math.max(padding, x - menuRect.width);
				}

				// Flip vertically if menu would overflow bottom edge
				if (y + menuRect.height > viewportHeight - padding) {
					y = Math.max(padding, y - menuRect.height);
				}

				// Apply final position and make visible
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

{#if combinedPath}
	<g class="kaykay-edge" class:selected class:animated={isAnimated}>
		<!-- Arrow marker definition -->
		<defs>
			<marker
				id="arrow-{edge.id}"
				markerWidth="12"
				markerHeight="12"
				refX="6"
				refY="6"
				orient="auto"
			>
				<path d="M 0 0 L 12 6 L 0 12 L 3 6 Z" fill={strokeColor} />
			</marker>
		</defs>

		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- Invisible wider path for easier selection -->
		<path
			class="kaykay-edge-hitbox"
			d={combinedPath}
			onclick={handleClick}
			oncontextmenu={handleContextMenu}
		/>
		<!-- Visible edge path -->
		<path
			class="kaykay-edge-path"
			d={combinedPath}
			style:stroke={strokeColor}
			style:stroke-dasharray={strokeDashArray}
		/>

		<!-- Animated arrows on selected edge -->
		{#if selected}
			<!-- Multiple arrows traveling along the path -->
			{#each [0, 0.33, 0.66] as delay}
				<path
					class="kaykay-edge-arrow-head"
					d="M -8 -6 L 0 0 L -8 6"
					fill="none"
					stroke={strokeColor}
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<animateMotion
						dur="{animationDuration}s"
						repeatCount="indefinite"
						path={combinedPath}
						rotate="auto"
						begin="{delay * animationDuration}s"
					/>
				</path>
			{/each}
		{/if}

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
		filter: brightness(1.2);
	}

	.kaykay-edge.selected .kaykay-edge-path {
		stroke-width: 3px;
		filter: brightness(1.3);
	}

	/* Animation for dashed/dotted edges */
	.kaykay-edge.animated .kaykay-edge-path {
		animation: dash-flow 0.5s linear infinite;
	}

	@keyframes dash-flow {
		to {
			stroke-dashoffset: -12;
		}
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

	.kaykay-edge-arrow-head {
		pointer-events: none;
	}
</style>

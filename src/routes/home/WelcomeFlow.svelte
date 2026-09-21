<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { Canvas, type FlowNode, type FlowEdge, type NodeTypes } from '$lib/index.js';
	import WelcomeNode from './WelcomeNode.svelte';

	const seed_nodes: FlowNode[] = [
		{ id: 'request', type: 'welcome', position: { x: 20, y: 88 }, width: 130, height: 94, data: { label: 'Request', metadata: 'JSON payload', kind: 'request' } },
		{ id: 'transform', type: 'welcome', position: { x: 220, y: 88 }, width: 130, height: 94, data: { label: 'Transform', metadata: 'Map fields', kind: 'transform' } },
		{ id: 'response', type: 'welcome', position: { x: 420, y: 20 }, width: 130, height: 94, data: { label: 'Response', metadata: 'Return JSON', kind: 'response' } },
		{ id: 'log', type: 'welcome', position: { x: 420, y: 156 }, width: 130, height: 94, data: { label: 'Event log', metadata: 'Append event', kind: 'log' } },
	];
	const seed_edges: FlowEdge[] = [
		{ id: 'request-transform', source: 'request', target: 'transform', label: 'data' },
		{ id: 'transform-response', source: 'transform', target: 'response' },
		{ id: 'transform-log', source: 'transform', target: 'log' },
	].map((edge) => ({
		...edge,
		source_handle: 'out',
		target_handle: 'in',
		type: 'bezier',
		color: 'var(--welcome-wire)',
		label_background: { opacity: 0.85, padding: 4, radius: 3 },
		animated: true,
		animation: { pattern: 'dots', color: '#FFDC58', speed: 28, size: 3, spacing: 22, paused: false },
	}));
	// Canvas owns mutable copies; reset always starts from the untouched seed.
	const nodes = structuredClone(seed_nodes);
	const edges = structuredClone(seed_edges);
	const node_types: NodeTypes = { welcome: WelcomeNode };
	let canvas = $state<ReturnType<typeof Canvas>>();
	let diagram = $state<HTMLDivElement>();
	let activation_button = $state<HTMLButtonElement>();
	let interacting = $state(false);
	let paused = $state(false);
	let reduced_motion = $state(false);
	let fit_frame = 0;

	function schedule_fit(): void {
		cancelAnimationFrame(fit_frame);
		// Handles register in rAF; fit after registration and node measurement settle.
		fit_frame = requestAnimationFrame(() => {
			fit_frame = requestAnimationFrame(() => canvas?.getFlow().fitView(24));
		});
	}

	onMount(() => {
		const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
		function sync_motion(): void {
			reduced_motion = motion.matches;
		}
		sync_motion();
		motion.addEventListener('change', sync_motion);
		const observer = new ResizeObserver(schedule_fit);
		if (diagram) observer.observe(diagram);
		schedule_fit();
		return () => {
			observer.disconnect();
			motion.removeEventListener('change', sync_motion);
			cancelAnimationFrame(fit_frame);
		};
	});

	$effect(() => {
		const flow = canvas?.getFlow();
		if (flow) flow.config.nodes_draggable = interacting;
	});

	function toggle_animation(): void {
		paused = !paused;
		for (const edge of seed_edges) {
			canvas?.getFlow().updateEdge(edge.id, { animation: { ...edge.animation, paused } });
		}
	}

	function reset_layout(): void {
		canvas?.getFlow().fromJSON({
			nodes: structuredClone(seed_nodes),
			edges: structuredClone(seed_edges).map((edge) => ({ ...edge, animation: { ...edge.animation, paused } })),
		});
		schedule_fit();
	}

	async function set_interaction(active: boolean): Promise<void> {
		interacting = active;
		await tick();
		if (active) canvas?.getContainer()?.focus({ preventScroll: true });
		else activation_button?.focus({ preventScroll: true });
	}

	function guard_keyboard(event: KeyboardEvent): void {
		if (event.key === 'Escape' && interacting) {
			event.preventDefault();
			event.stopPropagation();
			void set_interaction(false);
		} else if (
			event.key === 'Delete' || event.key === 'Backspace' ||
			((event.ctrlKey || event.metaKey) && ['a', 'c', 'v', 'x', 'z', 'y'].includes(event.key.toLowerCase()))
		) {
			event.preventDefault();
			event.stopPropagation();
		}
	}
</script>

<div class="kaykay-welcome-flow">
	<div class="kaykay-welcome-diagram" bind:this={diagram}>
		<!-- Capture shortcuts before they reach Canvas; the sibling overlay never receives its wheel handler. -->
		<div class="kaykay-welcome-canvas" inert={!interacting} onkeydowncapture={guard_keyboard} role="group" aria-label="Request flows through Transform to Response and Event log">
			<Canvas
				bind:this={canvas}
				{nodes}
				{edges}
				nodeTypes={node_types}
				config={{ min_zoom: 0.2, max_zoom: 1.5, nodes_draggable: false, nodes_connectable: false, elements_selectable: true, allow_delete: false, nodes_focusable: true, selection_on_drag: false, pan_on_drag: true, pan_on_scroll: false, zoom_on_scroll: false }}
			/>
		</div>
		{#if !interacting}
			<button bind:this={activation_button} class="kaykay-welcome-activate" type="button" onclick={() => set_interaction(true)}>
				<span>Try dragging the nodes <span aria-hidden="true">&rarr;</span></span>
			</button>
		{/if}
	</div>
	<div class="kaykay-welcome-toolbar" role="group" aria-label="Diagram controls">
		<button type="button" onclick={toggle_animation} disabled={reduced_motion} title={reduced_motion ? 'Animation disabled by your reduced-motion preference' : undefined}>
			<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
				{#if paused || reduced_motion}<path d="m5 3 7 5-7 5z" />{:else}<path d="M5 3v10M11 3v10" />{/if}
			</svg>
			{reduced_motion ? 'Motion off' : paused ? 'Resume animation' : 'Pause animation'}
		</button>
		<button type="button" onclick={reset_layout}>Reset layout</button>
		{#if interacting}
			<button class="kaykay-welcome-finish" type="button" onclick={() => set_interaction(false)}>Finish interacting</button>
		{/if}
	</div>
	<p class="kaykay-welcome-keyboard"><span class:visible={interacting}>Tab to a node, Enter to select, arrow keys to move. Escape to finish.</span></p>
</div>

<style>
	.kaykay-welcome-flow {
		--welcome-surface: #fff;
		--welcome-ground: #faf9f8;
		--welcome-border: #dedbd8;
		--welcome-text: #292724;
		--welcome-muted: #706a65;
		--welcome-wire: #806000;
		--kaykay-edge-label-bg: var(--welcome-ground);
		color: var(--welcome-text);
		background: var(--welcome-ground);
		width: 100%;
		min-width: 0;
	}

	:global(.kaykay-dark) .kaykay-welcome-flow {
		--welcome-surface: #292724;
		--welcome-ground: #211f1d;
		--welcome-border: #49443f;
		--welcome-text: #f2efec;
		--welcome-muted: #b9b1a9;
		--welcome-wire: #776b60;
	}

	.kaykay-welcome-diagram {
		position: relative;
		height: 310px;
	}

	.kaykay-welcome-canvas {
		width: 100%;
		height: 100%;
	}

	.kaykay-welcome-canvas :global(.kaykay-canvas) {
		--kaykay-canvas-bg: var(--welcome-ground);
		--kaykay-canvas-dot-rgb: 155, 145, 135;
	}
	.kaykay-welcome-canvas :global(.kaykay-edge-arrow-head) { display: none; }
	.kaykay-welcome-canvas :global(.kaykay-node:focus-visible) { outline: 2px solid var(--site-accent); outline-offset: 4px; }
	.kaykay-welcome-canvas :global(.kaykay-node) { --kaykay-node-selected-outline: var(--site-accent); }
	.kaykay-welcome-keyboard { margin: 0; padding: 8px 12px; font-size: 11px; line-height: 1.5; color: var(--welcome-muted); background: var(--welcome-surface); }
	.kaykay-welcome-keyboard span { visibility: hidden; }
	.kaykay-welcome-keyboard span.visible { visibility: visible; }

	.kaykay-welcome-activate {
		position: absolute;
		inset: 0;
		z-index: 1;
		display: flex;
		align-items: flex-end;
		justify-content: center;
		width: 100%;
		padding: 0 12px 10px;
		border: 0;
		background: transparent;
		color: var(--welcome-muted);
		font: inherit;
		font-size: 11px;
		cursor: pointer;
		touch-action: pan-y pinch-zoom;
	}

	.kaykay-welcome-activate > span {
		padding: 4px 8px;
		background: var(--welcome-ground);
		border-radius: 3px;
	}

	.kaykay-welcome-activate:hover > span {
		color: var(--welcome-text);
	}

	.kaykay-welcome-toolbar {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 4px 12px;
		padding: 6px 12px;
		border-top: 1px solid var(--welcome-border);
		background: var(--welcome-surface);
	}

	.kaykay-welcome-toolbar button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		min-height: 32px;
		padding: 4px 2px;
		border: 0;
		border-radius: 2px;
		background: transparent;
		color: var(--welcome-muted);
		font: inherit;
		font-size: 11px;
		cursor: pointer;
	}

	.kaykay-welcome-toolbar button:hover:not(:disabled) {
		color: var(--welcome-text);
		text-decoration: underline;
		text-underline-offset: 4px;
	}

	.kaykay-welcome-toolbar button:disabled {
		cursor: default;
	}

	.kaykay-welcome-toolbar .kaykay-welcome-finish {
		margin-left: auto;
		color: var(--welcome-text);
	}

	button:focus-visible {
		outline: 2px solid var(--site-accent);
		outline-offset: -2px;
	}

	@media (max-width: 600px) {
		.kaykay-welcome-diagram { height: 270px; }
		.kaykay-welcome-toolbar { gap: 4px 10px; }
		.kaykay-welcome-toolbar button { min-height: 40px; }
	}
</style>

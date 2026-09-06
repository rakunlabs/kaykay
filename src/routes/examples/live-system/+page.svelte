<script lang="ts">
	import { onMount, setContext } from 'svelte';
	import { Canvas, Controls } from '$lib/index.js';
	import type { FlowNode, FlowEdge, NodeTypes, EdgeTypes } from '$lib/index.js';
	import ExampleToolbar from '../ExampleToolbar.svelte';
	import ServiceNode from './ServiceNode.svelte';
	import TrafficEdge from './TrafficEdge.svelte';
	import { LIVE_SYSTEM, type LiveSystem } from './context.js';
	import { initialSnapshot, step } from './simulation.js';

	const live = $state<LiveSystem>({
		snapshot: initialSnapshot(), settings: { load: 400, cache_hit: 0.75, api_failed: false }, running: true,
		animation: { pattern: 'dots', speed: 60, size: 5, spacing: 22, color: '#b57408', reverse: false, paused: false },
		label_background: true, label_opacity: 0.8, traffic_speed: true, line_color: '#888888',
	});
	setContext(LIVE_SYSTEM, live);
	let canvas_key = $state(0);
	// oxlint-disable-next-line no-unassigned-vars -- assigned by Svelte bind:this
	let canvas_ref = $state<ReturnType<typeof Canvas>>();
	let throughput = $state(0);
	$effect(() => {
		const canvas = canvas_ref;
		if (!canvas) return;
		const frame = requestAnimationFrame(() => canvas.getFlow().fitView());
		return () => cancelAnimationFrame(frame);
	});
	const nodeTypes: NodeTypes = { service: ServiceNode };
	const edgeTypes: EdgeTypes = { traffic: TrafficEdge };
	const nodes: FlowNode[] = [
		{ id: 'clients', type: 'service', position: { x: 0, y: 150 }, data: { label: 'Clients', description: 'Incoming requests' } },
		{ id: 'balancer', type: 'service', position: { x: 340, y: 150 }, data: { label: 'Load balancer', description: 'Route to healthy instances' } },
		{ id: 'api-a', type: 'service', position: { x: 680, y: 0 }, data: { label: 'API / A', description: '300 req/s capacity', capacity: 300 } },
		{ id: 'api-b', type: 'service', position: { x: 680, y: 310 }, data: { label: 'API / B', description: '300 req/s capacity', capacity: 300 } },
		{ id: 'cache', type: 'service', position: { x: 1020, y: 150 }, data: { label: 'Cache', description: 'Hits complete; misses go to storage' } },
		{ id: 'database', type: 'service', position: { x: 1360, y: 150 }, data: { label: 'Database', description: '180 req/s capacity', capacity: 180 } }
	];
	const edges: FlowEdge[] = [
		['clients', 'balancer'], ['balancer', 'api-a'], ['balancer', 'api-b'],
		['api-a', 'cache'], ['api-b', 'cache'], ['cache', 'database']
	].map(([source, target]) => ({ id: `${source}-${target}`, source, target, source_handle: 'out', target_handle: 'in', type: 'traffic' }));
	const queued = $derived(Object.values(live.snapshot.nodes).reduce((sum, metric) => sum + metric.queue, 0));

	onMount(() => {
		const timer = window.setInterval(() => {
			if (live.running && !document.hidden) {
				const next = step(live.snapshot, live.settings, 0.1);
				throughput = (next.completed - live.snapshot.completed) / 0.1;
				live.snapshot = next;
			}
		}, 100);
		return () => window.clearInterval(timer);
	});

	function reset(): void {
		live.snapshot = initialSnapshot();
		throughput = 0;
		live.settings = { load: 400, cache_hit: 0.75, api_failed: false };
		live.running = true;
		live.animation = { pattern: 'dots', speed: 60, size: 5, spacing: 22, color: '#b57408', reverse: false, paused: false };
		live.label_background = true;
		live.label_opacity = 0.8;
		live.traffic_speed = true;
		live.line_color = '#888888';
		canvas_key += 1;
	}
</script>

<svelte:head><title>Live System | kaykay</title><meta name="description" content="Explore live traffic, bounded queues and service failures with a kaykay system diagram." /></svelte:head>

<div class="kaykay-live">
	<aside class="kaykay-panel">
		<h1>Live System</h1>
		<p>Turn up the traffic. Find the bottleneck. Bring a service back.</p>
		<ExampleToolbar onReset={reset} sourcePath="src/routes/examples/live-system/+page.svelte" />
		<section>
			<h2>Traffic controls</h2>
			<button class="kaykay-primary" onclick={() => live.running = !live.running}>{live.running ? 'Pause simulation' : 'Resume simulation'}</button>
			<label for="load">Incoming traffic <strong>{live.settings.load} req/s</strong></label>
			<input id="load" type="range" min="0" max="1200" step="20" disabled={!live.running} bind:value={live.settings.load} />
			<label for="cache">Cache hit rate <strong>{Math.round(live.settings.cache_hit * 100)}%</strong></label>
			<input id="cache" type="range" min="0" max="1" step="0.05" disabled={!live.running} bind:value={live.settings.cache_hit} />
			<button disabled={!live.running} aria-pressed={live.settings.api_failed} onclick={() => live.settings.api_failed = !live.settings.api_failed}>{live.settings.api_failed ? 'Recover API / A' : 'Take API / A offline'}</button>
			<p class="kaykay-hint">{live.running ? 'Running' : 'Paused: resume to change traffic controls'}. Simulation time: {live.snapshot.elapsed.toFixed(1)}s.</p>
		</section>
		<section>
			<h2>Edge appearance</h2>
			<label for="edge-pattern">Animation pattern</label>
			<select id="edge-pattern" bind:value={live.animation.pattern}>
				<option value="dots">Dots</option>
				<option value="dashes">Dashes</option>
				<option value="squares">Squares</option>
				<option value="diamonds">Diamonds</option>
				<option value="bands">Color bands</option>
			</select>
			<label for="edge-speed">Base speed <strong>{live.animation.speed} units/s</strong></label>
			<input id="edge-speed" type="range" min="0" max="240" step="5" bind:value={live.animation.speed} />
			<label for="edge-size">Pattern size <strong>{live.animation.size}</strong></label>
			<input id="edge-size" type="range" min="2" max="16" step="1" bind:value={live.animation.size} />
			<label for="edge-spacing">Gap <strong>{live.animation.spacing}</strong></label>
			<input id="edge-spacing" type="range" min="0" max="80" step="2" bind:value={live.animation.spacing} />
			<div class="kaykay-color-controls">
				<label for="edge-color">Pattern color<input id="edge-color" type="color" bind:value={live.animation.color} /></label>
				<label for="line-color">Line color<input id="line-color" type="color" bind:value={live.line_color} /></label>
			</div>
			<label class="kaykay-check"><input type="checkbox" bind:checked={live.label_background} />Label background</label>
			<label for="label-opacity">Background opacity <strong>{Math.round(live.label_opacity * 100)}%</strong></label>
			<input id="label-opacity" type="range" min="0" max="1" step="0.05" disabled={!live.label_background} bind:value={live.label_opacity} />
			<label class="kaykay-check"><input type="checkbox" bind:checked={live.traffic_speed} />Scale speed with traffic</label>
			<label class="kaykay-check"><input type="checkbox" bind:checked={live.animation.reverse} />Reverse visual direction</label>
			<label class="kaykay-check"><input type="checkbox" bind:checked={live.animation.paused} />Freeze animation only</label>
			<p class="kaykay-hint">Appearance does not change the simulation. Color bands alternate between the line and pattern colors.</p>
		</section>
		<section>
			<h2>System snapshot</h2>
			<dl>
				<div><dt>Completing now</dt><dd>{Math.round(throughput)} req/s</dd></div>
				<div><dt>Queued now</dt><dd>{Math.round(queued)}</dd></div>
				<div><dt>Completed total</dt><dd>{Math.round(live.snapshot.completed)}</dd></div>
				<div><dt>Dropped total</dt><dd>{Math.round(live.snapshot.dropped)}</dd></div>
			</dl>
		</section>
		<section>
			<h2>Try this</h2>
			<p>Keep traffic at 400 req/s and lower cache hits to 25%. The database receives 300 req/s, but can serve only 180. Its queue fills, then requests drop.</p>
			<p>Recover by raising the cache hit rate. Or take API / A offline and watch the remaining instance absorb the traffic.</p>
		</section>
		<p class="kaykay-hint">Inspired by <a href="https://github.com/xevrion/breakscale" target="_blank" rel="noreferrer">Breakscale</a>. This is a deterministic fluid queue model, not a discrete-event simulator or production benchmark. It does not model latency, retries, or network delay.</p>
	</aside>
	<div class="kaykay-workspace">
		<div class="kaykay-caption"><span>Request path</span><span>Drag nodes / scroll to zoom</span></div>
		<!-- Keep the fixed teaching topology intact without disabling node dragging. -->
		<div class="kaykay-diagram" onkeydowncapture={(event) => {
			if ((event.ctrlKey || event.metaKey) && ['a', 'c', 'v', 'x'].includes(event.key.toLowerCase())) {
				event.preventDefault();
				event.stopPropagation();
			}
		}}>
			{#key canvas_key}
				<Canvas bind:this={canvas_ref} {nodes} {edges} {nodeTypes} {edgeTypes} config={{ nodes_connectable: false, allow_delete: false, elements_selectable: false, nodes_focusable: false, zoom_on_scroll: true }}>
					{#snippet controls()}<Controls showLock={false} />{/snippet}
				</Canvas>
			{/key}
		</div>
	</div>
</div>

<style>
	.kaykay-live { --live-surface: #fff; --live-text: #202020; --live-muted: #626262; --live-border: #d4d4d4; display: flex; height: 100%; color: var(--live-text); background: var(--live-surface); }
	:global(.kaykay-dark) .kaykay-live { --live-surface: #202022; --live-text: #ededed; --live-muted: #b0b0b0; --live-border: #444; }
	.kaykay-panel { width: 300px; flex-shrink: 0; padding: 24px; overflow-y: auto; border-right: 1px solid var(--live-border); }
	h1 { font-size: 24px; margin: 0 0 12px; }
	h2 { font-size: 14px; margin: 0 0 16px; }
	p { font-size: 12px; line-height: 1.7; color: var(--live-muted); }
	section { margin-top: 28px; padding-top: 22px; border-top: 1px solid var(--live-border); }
	button { width: 100%; padding: 11px 12px; border: 1px solid var(--live-border); border-radius: 5px; font: inherit; font-size: 12px; background: var(--live-surface); color: var(--live-text); cursor: pointer; }
	button:hover { border-color: #b57408; }
	button:disabled, input:disabled { opacity: 0.5; cursor: not-allowed; }
	.kaykay-primary { background: #f6a21a; border-color: #f6a21a; color: #201600; font-weight: 600; }
	label { display: flex; justify-content: space-between; gap: 8px; font-size: 11px; margin-top: 24px; }
	input { width: 100%; margin: 14px 0 22px; accent-color: #b57408; }
	select { width: 100%; margin-top: 12px; padding: 10px; font: inherit; font-size: 12px; color: var(--live-text); background: var(--live-surface); border: 1px solid var(--live-border); border-radius: 5px; }
	.kaykay-check { justify-content: flex-start; align-items: center; margin-top: 14px; }
	.kaykay-check input { width: 16px; height: 16px; margin: 0; }
	.kaykay-color-controls { display: flex; gap: 20px; }
	.kaykay-color-controls label { flex: 1; flex-direction: column; margin-top: 0; }
	input[type='color'] { width: 100%; height: 34px; margin: 0 0 10px; padding: 2px; border: 1px solid var(--live-border); background: var(--live-surface); cursor: pointer; }
	button:focus-visible, input:focus-visible, select:focus-visible, a:focus-visible { outline: 2px solid #b57408; outline-offset: 4px; }
	dl { margin: 0; font-size: 12px; font-variant-numeric: tabular-nums; }
	dl div { display: flex; justify-content: space-between; gap: 12px; padding: 10px 0; }
	dt { color: var(--live-muted); } dd { margin: 0; }
	.kaykay-hint { font-size: 11px; }
	a { color: inherit; text-underline-offset: 3px; }
	.kaykay-workspace { display: flex; flex-direction: column; flex: 1; min-width: 0; }
	.kaykay-caption { display: flex; justify-content: space-between; gap: 12px; padding: 16px 20px; font-size: 11px; color: var(--live-muted); border-bottom: 1px solid var(--live-border); }
	.kaykay-diagram { flex: 1; min-height: 400px; }
	@media (max-width: 1000px) { .kaykay-live { flex-direction: column-reverse; height: auto; min-height: 100%; } .kaykay-panel { width: auto; overflow: visible; border-right: 0; border-top: 1px solid var(--live-border); } .kaykay-workspace { flex: none; height: 55vh; min-height: 400px; } .kaykay-diagram { min-height: 0; } }
</style>

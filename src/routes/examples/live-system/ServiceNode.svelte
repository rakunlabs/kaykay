<script lang="ts">
	import { getContext } from 'svelte';
	import { Handle } from '$lib/index.js';
	import type { NodeProps } from '$lib/index.js';
	import { LIVE_SYSTEM, type LiveSystem } from './context.js';

	let { id, data }: NodeProps<{ label: string; description: string; capacity?: number }> = $props();
	const live = getContext<LiveSystem>(LIVE_SYSTEM);
	const metric = $derived(live.snapshot.nodes[id]);
	const offline = $derived(id === 'api-a' && live.settings.api_failed);
	const status = $derived(offline ? 'Offline' : metric.queue > 0 ? 'Queueing' : metric.rate > 0 ? 'Healthy' : 'Idle');
</script>

<div class="kaykay-service" class:offline class:busy={metric.queue > 0}>
	{#if id !== 'clients'}<Handle id="in" type="input" port="request" position="left" />{/if}
	<header><strong>{data.label}</strong><span>{status}</span></header>
	<p>{data.description}</p>
	<div class="kaykay-rate">{Math.round(metric.rate)} <small>req/s</small></div>
	{#if data.capacity}
		<meter min="0" max="1" value={metric.utilization} aria-label={`${data.label} utilization`}></meter>
		<footer><span>{Math.round(metric.utilization * 100)}% busy</span><span>{Math.round(metric.queue)} queued</span></footer>
	{:else}
		<footer>{id === 'cache' ? `${Math.round(live.settings.cache_hit * 100)}% cache hits` : 'Traffic source / routing'}</footer>
	{/if}
	{#if id !== 'database'}<Handle id="out" type="output" port="request" position="right" />{/if}
</div>

<style>
	.kaykay-service { width: 210px; padding: 16px; border: 1px solid var(--live-border, #d4d4d4); border-radius: 8px; background: var(--live-surface, #fff); color: var(--live-text, #202020); box-shadow: 0 3px 9px #0000000d; }
	header, footer { display: flex; justify-content: space-between; gap: 12px; align-items: center; }
	header strong { font-size: 14px; }
	header span { font-size: 10px; color: var(--live-muted, #626262); }
	p { margin: 8px 0 20px; color: var(--live-muted, #626262); font-size: 11px; }
	.kaykay-rate { font-size: 26px; font-variant-numeric: tabular-nums; }
	small, footer { font-size: 11px; color: var(--live-muted, #626262); }
	meter { width: 100%; height: 8px; margin: 12px 0 8px; accent-color: #b57408; }
	footer { margin-top: 10px; }
	.busy { border-color: #b57408; }
	.offline { border-color: #d34d43; border-style: dashed; }
</style>

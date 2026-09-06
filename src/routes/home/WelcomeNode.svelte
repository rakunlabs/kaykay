<script lang="ts">
	import { Handle, type NodeProps } from '$lib/index.js';

	interface WelcomeData {
		label: string;
		metadata: string;
		kind: 'request' | 'transform' | 'response' | 'log';
	}

	let { data }: NodeProps<WelcomeData> = $props();
</script>

<div class="kaykay-welcome-node">
	<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
		{#if data.kind === 'request'}
			<path d="M14 4h6v16h-6M3 12h12m-4-4 4 4-4 4" />
		{:else if data.kind === 'transform'}
			<path d="M4 7h16M4 17h16" />
			<circle cx="9" cy="7" r="3" />
			<circle cx="15" cy="17" r="3" />
		{:else if data.kind === 'response'}
			<path d="M9 4H4v16h16v-5M11 9l3 3 7-8" />
		{:else}
			<path d="M6 3h9l3 3v15H6zM14 3v5h4M9 12h6M9 16h6" />
		{/if}
	</svg>
	<strong>{data.label}</strong>
	<span class="kaykay-welcome-metadata">{data.metadata}</span>
	<!-- These fixed ports are visual connection points, not keyboard controls. -->
	<span inert>
		{#if data.kind !== 'request'}
			<Handle id="in" type="input" port="data" position="left" port_color="var(--site-accent)" />
		{/if}
		{#if data.kind === 'request' || data.kind === 'transform'}
			<Handle id="out" type="output" port="data" position="right" port_color="var(--site-accent)" />
		{/if}
	</span>
</div>

<style>
	.kaykay-welcome-node {
		position: relative;
		box-sizing: border-box;
		width: 130px;
		height: 94px;
		padding: 12px 14px;
		border: 1px solid var(--welcome-border, #dedbd8);
		border-radius: 7px;
		background: var(--welcome-surface, #fff);
		color: var(--welcome-text, #292724);
		box-shadow: 0 3px 8px rgb(0 0 0 / 4%);
	}

	.kaykay-welcome-node svg {
		display: block;
		margin-bottom: 7px;
		color: var(--site-accent);
	}

	.kaykay-welcome-node strong {
		display: block;
		font-size: 14px;
		font-weight: 600;
		line-height: 18px;
		letter-spacing: -0.02em;
	}

	.kaykay-welcome-metadata {
		display: block;
		margin-top: 3px;
		color: var(--welcome-muted, #706a65);
		font-size: 11px;
		line-height: 15px;
	}

	:global(.kaykay-dark) .kaykay-welcome-node {
		background: var(--welcome-surface, #292724);
		border-color: var(--welcome-border, #49443f);
		color: var(--welcome-text, #f2efec);
	}

	:global(.kaykay-dark) .kaykay-welcome-metadata {
		color: var(--welcome-muted, #b9b1a9);
	}
</style>

<script lang="ts">
	import { getFlow } from '../stores/flow.svelte.js';

	interface Props {
		showZoomLevel?: boolean;
		showFitView?: boolean;
		showLock?: boolean;
		position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
		class?: string;
	}

	let {
		showZoomLevel = true,
		showFitView = true,
		showLock = true,
		position = 'bottom-left',
		class: className = '',
	}: Props = $props();

	const flow = getFlow();

	const positionStyles: Record<string, string> = {
		'top-left': 'top: 10px; left: 10px;',
		'top-right': 'top: 10px; right: 10px;',
		'bottom-left': 'bottom: 10px; left: 10px;',
		'bottom-right': 'bottom: 10px; right: 10px;',
	};

	function handleZoomIn() {
		flow.zoomIn();
	}

	function handleZoomOut() {
		flow.zoomOut();
	}

	function handleResetZoom() {
		flow.resetZoom();
	}

	function handleFitView() {
		flow.fitView();
	}

	function handleToggleLock() {
		flow.toggleLocked();
	}

	const zoomPercent = $derived(Math.round(flow.viewport.zoom * 100));
	const isLocked = $derived(flow.locked);
</script>

<div
	class="kaykay-controls {className}"
	style={positionStyles[position]}
>
	<button
		class="kaykay-controls-btn"
		onclick={handleZoomIn}
		title="Zoom In"
		aria-label="Zoom In"
	>
		<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
			<path d="M8 3V13M3 8H13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
		</svg>
	</button>

	{#if showZoomLevel}
		<button
			class="kaykay-controls-level"
			onclick={handleResetZoom}
			title="Reset Zoom (100%)"
			aria-label="Reset Zoom"
		>
			{zoomPercent}%
		</button>
	{/if}

	<button
		class="kaykay-controls-btn"
		onclick={handleZoomOut}
		title="Zoom Out"
		aria-label="Zoom Out"
	>
		<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
			<path d="M3 8H13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
		</svg>
	</button>

	{#if showFitView}
		<button
			class="kaykay-controls-btn"
			onclick={handleFitView}
			title="Fit View"
			aria-label="Fit View"
		>
			<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path d="M2 5V2H5M11 2H14V5M14 11V14H11M5 14H2V11" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
			</svg>
		</button>
	{/if}

	{#if showLock}
		<button
			class="kaykay-controls-btn"
			class:kaykay-controls-btn-active={isLocked}
			onclick={handleToggleLock}
			title={isLocked ? 'Unlock' : 'Lock'}
			aria-label={isLocked ? 'Unlock' : 'Lock'}
		>
					{#if isLocked}
				<!-- Lock icon (closed) -->
				<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
					<rect x="3" y="7" width="10" height="7" rx="1" stroke="currentColor" stroke-width="2"/>
					<path d="M5 7V5C5 3.34315 6.34315 2 8 2C9.65685 2 11 3.34315 11 5V7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
				</svg>
			{:else}
				<!-- Unlock icon (shackle on left, open, stroke style) -->
				<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
					<rect x="5" y="7" width="10" height="7" rx="1" stroke="currentColor" stroke-width="2"/>
					<path d="M8 7V5C8 3.34315 6.65685 2 5 2C3.34315 2 2 3.34315 2 5V6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
				</svg>
			{/if}
		</button>
	{/if}
</div>

<style>
	/* Light mode (default) */
	.kaykay-controls {
		--kaykay-controls-bg: white;
		--kaykay-controls-shadow: #00000026;
		--kaykay-controls-btn-color: #374151;
		--kaykay-controls-btn-hover: #f3f4f6;
		--kaykay-controls-btn-active-bg: #e5e7eb;
		--kaykay-controls-level-color: #6b7280;

		position: absolute;
		display: flex;
		flex-direction: column;
		gap: 2px;
		background: var(--kaykay-controls-bg);
		box-shadow: 0 2px 8px var(--kaykay-controls-shadow);
		padding: 4px;
		z-index: 1000;
		opacity: 0.4;
		transition: opacity 0.2s ease;
	}

	.kaykay-controls:hover {
		opacity: 1;
	}

	/* Dark mode */
	:global(.kaykay-dark) .kaykay-controls,
	.kaykay-controls.kaykay-dark {
		--kaykay-controls-bg: #161618;
		--kaykay-controls-shadow: rgba(0, 0, 0, 0.4);
		--kaykay-controls-btn-color: #e5e7eb;
		--kaykay-controls-btn-hover: #374151;
		--kaykay-controls-btn-active-bg: #4b5563;
		--kaykay-controls-level-color: #9ca3af;
	}

	.kaykay-controls-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		border: none;
		background: transparent;
		cursor: pointer;
		color: var(--kaykay-controls-btn-color);
		transition: background-color 0.15s ease;
	}

	.kaykay-controls-btn:hover {
		background: var(--kaykay-controls-btn-hover);
	}

	.kaykay-controls-btn:active {
		background: var(--kaykay-controls-btn-active-bg);
	}

	.kaykay-controls-btn-active {
		background: var(--kaykay-controls-btn-active-bg);
	}

	.kaykay-controls-level {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 24px;
		border: none;
		background: transparent;
		cursor: pointer;
		color: var(--kaykay-controls-level-color);
		font-size: 11px;
		font-weight: 500;
		font-family: inherit;
		transition: background-color 0.15s ease, color 0.15s ease;
	}

	.kaykay-controls-level:hover {
		background: var(--kaykay-controls-btn-hover);
		color: var(--kaykay-controls-btn-color);
	}
</style>

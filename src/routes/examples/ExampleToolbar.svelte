<script lang="ts">
	interface Props {
		onReset?: () => void;
		sourcePath?: string;
	}

	let { onReset, sourcePath }: Props = $props();

	const sourceHref = $derived(
		sourcePath ? `https://github.com/rakunlabs/kaykay/blob/main/${sourcePath}` : undefined
	);
</script>

<div class="example-toolbar">
	{#if onReset}
		<button type="button" class="toolbar-button" onclick={onReset}>Reset example</button>
	{/if}
	{#if sourceHref}
		<a class="toolbar-button secondary" href={sourceHref} target="_blank" rel="noreferrer">
			View source
		</a>
	{/if}
</div>

<style>
	.example-toolbar {
		--toolbar-accent: var(--site-accent, #806000);
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		margin: 0 0 24px 0;
	}

	.toolbar-button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		box-sizing: border-box;
		min-height: 40px;
		padding: 0 12px;
		background: var(--site-accent-fill);
		border: 1px solid var(--site-accent-fill);
		border-radius: 6px;
		color: var(--site-accent-ink);
		font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
		font-size: 0.82rem;
		font-weight: 700;
		text-decoration: none;
		cursor: pointer;
		transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
	}

	.toolbar-button:hover {
		background: var(--site-accent-hover);
		border-color: var(--site-accent-hover);
	}

	.toolbar-button.secondary {
		background: transparent;
		color: var(--toolbar-accent);
		border-color: var(--toolbar-accent);
	}

	.toolbar-button.secondary:hover {
		background: var(--site-accent-soft);
		border-color: var(--toolbar-accent);
	}

	:global(.kaykay-light) .toolbar-button.secondary:hover {
		background: var(--site-accent-soft);
	}

	:global(.kaykay-dark) .example-toolbar {
		--toolbar-accent: var(--site-accent, #FFDC58);
	}

	.toolbar-button:focus-visible {
		outline: 2px solid var(--toolbar-accent);
		outline-offset: 3px;
	}
</style>

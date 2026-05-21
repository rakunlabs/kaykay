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
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		margin: 0 0 24px 0;
	}

	.toolbar-button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: 34px;
		padding: 0 12px;
		background: #eb5425;
		border: 1px solid #eb5425;
		border-radius: 6px;
		color: #fff;
		font-family: inherit;
		font-size: 0.82rem;
		font-weight: 700;
		text-decoration: none;
		cursor: pointer;
		transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
	}

	.toolbar-button:hover {
		background: #2d7fd3;
		border-color: #2d7fd3;
	}

	.toolbar-button.secondary {
		background: transparent;
		color: #eb5425;
	}

	.toolbar-button.secondary:hover {
		background: rgba(235, 84, 37, 0.12);
		border-color: #eb5425;
	}

	:global(.kaykay-light) .toolbar-button.secondary:hover {
		background: #fff0eb;
	}
</style>

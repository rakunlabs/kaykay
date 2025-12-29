<script lang="ts">
	import Handle from '../../../lib/components/Handle.svelte';
	import type { NodeProps } from '../../../lib/types/index.js';

	let { data }: NodeProps<{ label: string }> = $props();
</script>

<div class="custom-handle-node">
	<span>{data.label}</span>
	
	<!-- Diamond SVG handle -->
	<Handle id="in-diamond" type="input" port="data" position="left" class="diamond-handle">
		<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
			<path d="M8 0L16 8L8 16L0 8L8 0Z" fill="#f59e0b" stroke="#fbbf24" stroke-width="1"/>
		</svg>
	</Handle>
	
	<!-- Circle SVG handle -->
	<Handle id="out-circle" type="output" port="data" position="right" class="circle-handle">
		<svg width="14" height="14" viewBox="0 0 14 14" fill="none">
			<circle cx="7" cy="7" r="6" fill="#8b5cf6" stroke="#a78bfa" stroke-width="1"/>
		</svg>
	</Handle>
	
	<!-- Square handle with emoji -->
	<Handle id="in-emoji" type="input" port="signal" position="top" class="emoji-handle">
		<span class="emoji">⚡</span>
	</Handle>
	
	<!-- Image handle -->
	<Handle id="out-img" type="output" port="signal" position="bottom" class="img-handle">
		<div class="img-placeholder">🔗</div>
	</Handle>
</div>

<style>
	.custom-handle-node {
		background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
		border: 2px solid #475569;
		border-radius: 12px;
		padding: 20px 32px;
		color: #e2e8f0;
		font-weight: 500;
		min-width: 140px;
		text-align: center;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
	}

	/* Style for custom handle shapes */
	:global(.diamond-handle),
	:global(.circle-handle) {
		transition: transform 0.15s ease, filter 0.15s ease;
	}

	:global(.diamond-handle:hover),
	:global(.circle-handle:hover) {
		filter: brightness(1.2);
	}

	.emoji {
		font-size: 14px;
		line-height: 1;
	}

	.img-placeholder {
		font-size: 12px;
		line-height: 1;
	}

	:global(.emoji-handle),
	:global(.img-handle) {
		transition: transform 0.15s ease;
	}
</style>

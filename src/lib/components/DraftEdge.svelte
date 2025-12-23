<script lang="ts">
	import type { DraftConnection } from '../types/index.js';
	import { getBezierPath } from '../utils/edge-path.js';

	interface Props {
		connection: DraftConnection;
	}

	const { connection }: Props = $props();

	// Calculate bezier curve path from source to current mouse position
	// Infer target handle position based on relative position to source
	const path = $derived.by(() => {
		const { source_position, target_position, source_handle_position } = connection;
		
		// Determine target handle position based on where the mouse is relative to source
		// This creates a natural-feeling curve while dragging
		const dx = target_position.x - source_position.x;
		const dy = target_position.y - source_position.y;
		
		let targetHandlePosition: 'left' | 'right' | 'top' | 'bottom';
		if (Math.abs(dx) > Math.abs(dy)) {
			targetHandlePosition = dx > 0 ? 'left' : 'right';
		} else {
			targetHandlePosition = dy > 0 ? 'top' : 'bottom';
		}
		
		return getBezierPath(
			source_position,
			source_handle_position,
			target_position,
			targetHandlePosition,
			0.5 // Higher curvature for more visible bezier while dragging
		);
	});
</script>

<g class="kaykay-draft-edge">
	<path
		class="kaykay-draft-edge-path"
		d={path}
	/>
</g>

<style>
	.kaykay-draft-edge-path {
		fill: none;
		stroke: #ff6b6b;
		stroke-width: 3px;
		stroke-dasharray: 8 4;
		pointer-events: none;
		opacity: 0.8;
		animation: draft-dash-flow 0.3s linear infinite;
	}

	@keyframes draft-dash-flow {
		to {
			stroke-dashoffset: -12;
		}
	}

	.kaykay-draft-edge-path:hover {
		stroke-width: 4px;
	}
</style>

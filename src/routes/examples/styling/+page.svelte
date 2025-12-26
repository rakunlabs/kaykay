<script lang="ts">
	import Canvas from '../../../lib/components/Canvas.svelte';
	import type { FlowNode, FlowEdge, NodeTypes } from '../../../lib/types/index.js';
	import GradientNode from './GradientNode.svelte';
	import GlassNode from './GlassNode.svelte';
	import NeonNode from './NeonNode.svelte';
	import MinimalNode from './MinimalNode.svelte';
	import RoundedNode from './RoundedNode.svelte';
	import ShadowNode from './ShadowNode.svelte';

	// Custom styled nodes
	let nodes: FlowNode[] = $state([
		{ id: 'gradient', type: 'gradient', position: { x: 50, y: 50 }, data: { label: 'Gradient Node' } },
		{ id: 'glass', type: 'glass', position: { x: 300, y: 50 }, data: { label: 'Glass Effect' } },
		{ id: 'neon', type: 'neon', position: { x: 550, y: 50 }, data: { label: 'Neon Glow' } },
		{ id: 'minimal', type: 'minimal', position: { x: 50, y: 200 }, data: { label: 'Minimal' } },
		{ id: 'rounded', type: 'rounded', position: { x: 300, y: 200 }, data: { label: 'Rounded' } },
		{ id: 'shadow', type: 'shadow', position: { x: 550, y: 200 }, data: { label: 'Deep Shadow' } },
	]);

	let edges: FlowEdge[] = $state([
		{ id: 'e1', source: 'gradient', source_handle: 'out', target: 'glass', target_handle: 'in', color: '#8b5cf6' },
		{ id: 'e2', source: 'glass', source_handle: 'out', target: 'neon', target_handle: 'in', color: '#22c55e', animated: true },
		{ id: 'e3', source: 'minimal', source_handle: 'out', target: 'rounded', target_handle: 'in', style: 'dashed' },
		{ id: 'e4', source: 'rounded', source_handle: 'out', target: 'shadow', target_handle: 'in', type: 'step' },
	]);

	const nodeTypes: NodeTypes = {
		'gradient': GradientNode,
		'glass': GlassNode,
		'neon': NeonNode,
		'minimal': MinimalNode,
		'rounded': RoundedNode,
		'shadow': ShadowNode,
	};

	const callbacks = {
		on_connect: (edge: FlowEdge) => {
			edges = [...edges, edge];
		},
		on_delete: (nodeIds: string[], edgeIds: string[]) => {
			nodes = nodes.filter(n => !nodeIds.includes(n.id));
			edges = edges.filter(e => !edgeIds.includes(e.id));
		}
	};
</script>

<div class="example-page">
	<div class="example-sidebar">
		<h1>Styling & Theming</h1>
		<p>Customize the look and feel of your flow diagrams with CSS.</p>

		<div class="section">
			<h3>Theme Support</h3>
			<p>kaykay supports light and dark themes via CSS classes.</p>
			<div class="code-block">
				<pre>{`<!-- Dark theme (default) -->
<div class="kaykay-dark">
  <Canvas ... />
</div>

<!-- Light theme -->
<div class="kaykay-light">
  <Canvas ... />
</div>`}</pre>
			</div>
		</div>

		<div class="section">
			<h3>Custom Node Styles</h3>
			<p>Style nodes using standard CSS. Each example on the canvas shows a different styling approach.</p>
			<ul class="feature-list">
				<li><strong>Gradient</strong> - CSS gradients for backgrounds</li>
				<li><strong>Glass</strong> - Backdrop blur and transparency</li>
				<li><strong>Neon</strong> - Glowing box-shadow effects</li>
				<li><strong>Minimal</strong> - Clean, simple borders</li>
				<li><strong>Rounded</strong> - Pill-shaped nodes</li>
				<li><strong>Shadow</strong> - Layered shadow effects</li>
			</ul>
		</div>

		<div class="section">
			<h3>Edge Styling</h3>
			<p>Customize edges with colors, styles, and animations.</p>
			<div class="code-block">
				<pre>{`const edges = [
  {
    id: 'e1',
    source: 'a',
    target: 'b',
    // Custom color
    color: '#8b5cf6',
    // Line style: solid, dashed, dotted
    style: 'dashed',
    // Animated dashes
    animated: true,
    // Edge type: bezier, step, straight
    type: 'bezier'
  }
];`}</pre>
			</div>
		</div>

		<div class="section">
			<h3>CSS Variables</h3>
			<p>Override these CSS variables to customize the theme:</p>
			<div class="code-block">
				<pre>{`:root {
  --kaykay-bg: #0a0a14;
  --kaykay-grid: #252422;
  --kaykay-edge: #888;
  --kaykay-edge-selected: #eb5425;
  --kaykay-handle: #eb5425;
  --kaykay-selection: rgba(74, 158, 255, 0.2);
}`}</pre>
			</div>
		</div>

		<div class="tip">
			<strong>Tip:</strong> Use <code>:global()</code> in Svelte component styles to target nested kaykay elements.
		</div>
	</div>

	<div class="example-canvas">
		<Canvas {nodes} {edges} {nodeTypes} {callbacks} />
	</div>
</div>

<style>
	.example-page {
		display: flex;
		height: 100%;
	}

	.example-sidebar {
		width: 380px;
		padding: 24px;
		overflow-y: auto;
		border-right: 1px solid #1f1f1f;
		background: #161618;
		flex-shrink: 0;
	}

	:global(.kaykay-light) .example-sidebar {
		background: #fff;
		border-right: 1px solid #e0e0e0;
	}

	.example-sidebar h1 {
		margin: 0 0 8px 0;
		font-size: 1.5rem;
	}

	.example-sidebar > p {
		margin: 0 0 24px 0;
		color: #888;
	}

	.section {
		margin-bottom: 24px;
	}

	.section h3 {
		margin: 0 0 12px 0;
		font-size: 1rem;
		color: #eb5425;
	}

	.section p {
		margin: 0 0 12px 0;
		color: #aaa;
		font-size: 0.9rem;
	}

	.feature-list {
		margin: 0;
		padding-left: 20px;
		color: #ccc;
		font-size: 0.85rem;
		line-height: 1.8;
	}

	:global(.kaykay-light) .feature-list {
		color: #555;
	}

	.code-block {
		background: #252422;
		border: 1px solid #1f1f1f;
		border-radius: 8px;
		padding: 16px;
		overflow-x: auto;
	}

	:global(.kaykay-light) .code-block {
		background: #f5f5f5;
		border-color: #e0e0e0;
	}

	.code-block pre {
		margin: 0;
		font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
		font-size: 0.75rem;
		color: #a5d6ff;
		white-space: pre;
	}

	:global(.kaykay-light) .code-block pre {
		color: #0969da;
	}

	.tip {
		background: rgba(74, 158, 255, 0.1);
		border-left: 3px solid #eb5425;
		padding: 12px 16px;
		border-radius: 0 8px 8px 0;
		font-size: 0.85rem;
		color: #ccc;
	}

	.tip code {
		background: rgba(255, 255, 255, 0.1);
		padding: 2px 6px;
		border-radius: 4px;
		font-size: 0.8rem;
	}

	:global(.kaykay-light) .tip {
		color: #555;
	}

	.example-canvas {
		flex: 1;
		position: relative;
	}
</style>

<script lang="ts">
	import Canvas from '../../../lib/components/Canvas.svelte';
	import type { FlowNode, FlowEdge, NodeTypes } from '../../../lib/types/index.js';
	import SimpleNode from '../nodes/SimpleNode.svelte';

	let nodes: FlowNode[] = $state([
		{ id: 'n1', type: 'simple', position: { x: 100, y: 100 }, data: { label: 'Drag Me' } },
		{ id: 'n2', type: 'simple', position: { x: 350, y: 100 }, data: { label: 'Connect Me' } },
		{ id: 'n3', type: 'simple', position: { x: 100, y: 250 }, data: { label: 'Node A' } },
		{ id: 'n4', type: 'simple', position: { x: 350, y: 250 }, data: { label: 'Node B' } },
	]);

	let edges: FlowEdge[] = $state([
		{ id: 'e1', source: 'n3', source_handle: 'out', target: 'n4', target_handle: 'in' },
	]);

	const nodeTypes: NodeTypes = {
		'simple': SimpleNode,
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
		<h1>Touch Support</h1>
		<p>kaykay fully supports touch devices including tablets and phones.</p>

		<div class="section">
			<h3>Touch Gestures</h3>
			<ul class="feature-list">
				<li><strong>Single finger drag (canvas)</strong> - Pan the viewport</li>
				<li><strong>Single finger drag (node)</strong> - Move nodes</li>
				<li><strong>Pinch</strong> - Zoom in/out</li>
				<li><strong>Tap handle</strong> - Start connection</li>
				<li><strong>Tap node</strong> - Select node</li>
				<li><strong>Tap canvas</strong> - Deselect all</li>
			</ul>
		</div>

		<div class="section">
			<h3>Creating Connections</h3>
			<p>On touch devices, connections work slightly differently:</p>
			<ol class="feature-list">
				<li>Tap an output handle to start a connection</li>
				<li>Tap an input handle to complete it</li>
				<li>Tap the canvas to cancel</li>
			</ol>
		</div>

		<div class="section">
			<h3>Minimap Touch</h3>
			<p>The minimap also supports touch:</p>
			<ul class="feature-list">
				<li><strong>Tap</strong> - Jump to location</li>
				<li><strong>Drag</strong> - Pan the viewport</li>
			</ul>
		</div>

		<div class="section">
			<h3>Implementation</h3>
			<p>Touch support is built-in and automatic. The canvas uses:</p>
			<div class="code-block">
				<pre>{`/* Prevents browser gestures */
.canvas {
  touch-action: none;
}

/* Touch events handled */
- touchstart
- touchmove  
- touchend
- touchcancel`}</pre>
			</div>
		</div>

		<div class="section">
			<h3>Best Practices</h3>
			<ul class="feature-list">
				<li>Make handles at least 44x44px for easy tapping</li>
				<li>Provide enough spacing between nodes</li>
				<li>Consider larger fonts for mobile</li>
				<li>Test on actual devices</li>
			</ul>
		</div>

		<div class="tip">
			<strong>Try it:</strong> If you're on a touch device, try dragging nodes and creating connections with touch!
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
		font-size: 0.85rem;
		color: #ccc;
	}

	:global(.kaykay-light) .tip {
		color: #555;
	}

	.example-canvas {
		flex: 1;
		position: relative;
	}
</style>

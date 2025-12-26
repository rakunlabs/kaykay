<script lang="ts">
	import Canvas from '../../../lib/components/Canvas.svelte';
	import type { FlowNode, FlowEdge, NodeTypes } from '../../../lib/types/index.js';
	import type { FlowState } from '../../../lib/stores/flow.svelte.js';
	import BasicNode from '../nodes/BasicNode.svelte';

	let nodes: FlowNode[] = $state([
		{ id: 'n1', type: 'basic', position: { x: 50, y: 50 }, data: { label: 'Node A' } },
		{ id: 'n2', type: 'basic', position: { x: 50, y: 180 }, data: { label: 'Node B' } },
		{ id: 'n3', type: 'basic', position: { x: 300, y: 50 }, data: { label: 'Node C' } },
		{ id: 'n4', type: 'basic', position: { x: 300, y: 180 }, data: { label: 'Node D' } },
		{ id: 'n5', type: 'basic', position: { x: 550, y: 115 }, data: { label: 'Output' } },
	]);

	let edges: FlowEdge[] = $state([
		{ id: 'e1', source: 'n1', source_handle: 'out', target: 'n3', target_handle: 'in', type: 'bezier' },
		{ id: 'e2', source: 'n2', source_handle: 'out', target: 'n4', target_handle: 'in', type: 'step', color: '#22c55e' },
		{ id: 'e3', source: 'n3', source_handle: 'out', target: 'n5', target_handle: 'in', type: 'straight', style: 'dashed' },
		{ id: 'e4', source: 'n4', source_handle: 'out', target: 'n5', target_handle: 'in', type: 'bezier', color: '#f59e0b', animated: true },
	]);

	const nodeTypes: NodeTypes = {
		'basic': BasicNode,
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

	// Edge customization
	let selectedEdgeType = $state<'bezier' | 'step' | 'straight'>('bezier');
	let selectedEdgeStyle = $state<'solid' | 'dashed' | 'dotted'>('solid');
	let selectedEdgeColor = $state('#888888');
	let isAnimated = $state(false);

	// Reference to Canvas component to access internal flow state
	let canvasComponent: { getFlow: () => FlowState } | undefined;

	function addOrUpdateExampleEdge() {
		const flow = canvasComponent?.getFlow();
		if (!flow) return;

		// Check if edge already exists
		const existingEdge = flow.edges.find(
			e => e.source === 'n1' && e.source_handle === 'out' && e.target === 'n4' && e.target_handle === 'in'
		);

		if (existingEdge) {
			// Edge exists - update its properties
			existingEdge.type = selectedEdgeType;
			existingEdge.style = selectedEdgeStyle;
			existingEdge.color = selectedEdgeColor;
			existingEdge.animated = isAnimated;
		} else {
			// Edge doesn't exist - create it
			const newEdge: FlowEdge = {
				id: `e-${Date.now()}`,
				source: 'n1',
				source_handle: 'out',
				target: 'n4',
				target_handle: 'in',
				type: selectedEdgeType,
				style: selectedEdgeStyle,
				color: selectedEdgeColor,
				animated: isAnimated,
			};
			flow.edges.push(newEdge);
		}
	}
</script>

<div class="example-page">
	<div class="example-sidebar">
		<h1>Connections & Edges</h1>
		<p>Learn about different edge types, styles, colors, and interactive features.</p>

		<div class="section">
			<h3>Edge Types</h3>
			<p>kaykay supports three edge routing types:</p>
			<ul class="feature-list">
				<li><strong>Bezier</strong> - Smooth curved lines (default)</li>
				<li><strong>Step</strong> - Right-angle routing</li>
				<li><strong>Straight</strong> - Direct lines</li>
			</ul>
		</div>

		<div class="section">
			<h3>Edge Styles</h3>
			<ul class="feature-list">
				<li><strong>Solid</strong> - Continuous line</li>
				<li><strong>Dashed</strong> - Dashed pattern</li>
				<li><strong>Dotted</strong> - Dotted pattern</li>
				<li><strong>Animated</strong> - Moving dashes</li>
			</ul>
		</div>

		<div class="section">
			<h3>Create Custom Edge</h3>
			<div class="form-group">
				<label for="edge-type">Type</label>
				<select id="edge-type" bind:value={selectedEdgeType}>
					<option value="bezier">Bezier</option>
					<option value="step">Step</option>
					<option value="straight">Straight</option>
				</select>
			</div>
			<div class="form-group">
				<label for="edge-style">Style</label>
				<select id="edge-style" bind:value={selectedEdgeStyle}>
					<option value="solid">Solid</option>
					<option value="dashed">Dashed</option>
					<option value="dotted">Dotted</option>
				</select>
			</div>
			<div class="form-group">
				<span class="label-text">Color</span>
				<div class="color-options">
					{#each ['#888888', '#ef4444', '#22c55e', '#3b82f6', '#f59e0b', '#8b5cf6'] as color}
						<button
							class="color-swatch"
							class:active={selectedEdgeColor === color}
							style="background: {color}"
							onclick={() => selectedEdgeColor = color}
							aria-label="Select color {color}"
						></button>
					{/each}
				</div>
			</div>
			<div class="form-group">
				<label class="checkbox-label">
					<input type="checkbox" bind:checked={isAnimated} />
					Animated
				</label>
			</div>
			<button class="add-btn" onclick={addOrUpdateExampleEdge}>Add Edge (A → D)</button>
		</div>

		<div class="section">
			<h3>Interactions</h3>
			<ul class="feature-list">
				<li><strong>Right-click edge</strong> - Context menu</li>
				<li><strong>Ctrl+click edge</strong> - Add waypoint</li>
				<li><strong>Drag waypoint</strong> - Reposition</li>
				<li><strong>Ctrl+click waypoint</strong> - Remove it</li>
				<li><strong>Select + Delete</strong> - Remove edge</li>
			</ul>
		</div>

		<div class="code-block">
			<pre>{`const edges = [
  {
    id: 'e1',
    source: 'node-1',
    source_handle: 'out',
    target: 'node-2',
    target_handle: 'in',
    type: '${selectedEdgeType}',
    style: '${selectedEdgeStyle}',
    color: '${selectedEdgeColor}',
    animated: ${isAnimated}
  }
];`}</pre>
		</div>
	</div>

	<div class="example-canvas">
		<Canvas bind:this={canvasComponent} {nodes} {edges} {nodeTypes} {callbacks} />
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
		margin: 0 0 8px 0;
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

	.form-group {
		margin-bottom: 16px;
	}

	.form-group label,
	.form-group .label-text {
		display: block;
		margin-bottom: 6px;
		font-size: 0.85rem;
		color: #888;
	}

	.form-group select {
		width: 100%;
		padding: 10px 12px;
		background: #1f1f1f;
		border: 1px solid #252422;
		border-radius: 6px;
		color: #fff;
		font-size: 0.9rem;
	}

	:global(.kaykay-light) .form-group select {
		background: #f5f5f5;
		border-color: #e0e0e0;
		color: #333;
	}

	.color-options {
		display: flex;
		gap: 8px;
	}

	.color-swatch {
		width: 28px;
		height: 28px;
		border-radius: 6px;
		border: 2px solid transparent;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.color-swatch:hover {
		transform: scale(1.1);
	}

	.color-swatch.active {
		border-color: #fff;
		box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.3);
	}

	.checkbox-label {
		display: flex !important;
		align-items: center;
		gap: 8px;
		cursor: pointer;
	}

	.checkbox-label input {
		width: 16px;
		height: 16px;
	}

	.add-btn {
		width: 100%;
		padding: 12px;
		background: #eb5425;
		border: none;
		border-radius: 6px;
		color: #fff;
		font-size: 0.9rem;
		cursor: pointer;
		transition: background 0.15s ease;
	}

	.add-btn:hover {
		background: #2d7fd3;
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
		font-size: 0.8rem;
		color: #a5d6ff;
		white-space: pre;
	}

	:global(.kaykay-light) .code-block pre {
		color: #0969da;
	}

	.example-canvas {
		flex: 1;
		position: relative;
	}
</style>

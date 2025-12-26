<script lang="ts">
	import Canvas from '../../../lib/components/Canvas.svelte';
	import GroupNode from '../../../lib/components/GroupNode.svelte';
	import type { FlowNode, FlowEdge, NodeTypes } from '../../../lib/types/index.js';
	import SimpleNode from '../nodes/SimpleNode.svelte';

	let canvasRef: ReturnType<typeof Canvas> | undefined;

	let nodes: FlowNode[] = $state([
		// Input Group
		{
			id: 'group-inputs',
			type: 'group',
			position: { x: 30, y: 30 },
			width: 220,
			height: 200,
			data: { label: 'Inputs', color: '#22c55e' }
		},
		{
			id: 'input-1',
			type: 'simple',
			position: { x: 30, y: 40 },  // Relative to parent group
			data: { label: 'Source A' },
			parent_id: 'group-inputs'
		},
		{
			id: 'input-2',
			type: 'simple',
			position: { x: 30, y: 120 },  // Relative to parent group
			data: { label: 'Source B' },
			parent_id: 'group-inputs'
		},
		// Processing Group
		{
			id: 'group-process',
			type: 'group',
			position: { x: 300, y: 50 },
			width: 200,
			height: 150,
			data: { label: 'Processing', color: '#f59e0b' }
		},
		{
			id: 'process-1',
			type: 'simple',
			position: { x: 30, y: 45 },  // Relative to parent group
			data: { label: 'Transform' },
			parent_id: 'group-process'
		},
		// Output (not in a group)
		{
			id: 'output-1',
			type: 'simple',
			position: { x: 560, y: 100 },
			data: { label: 'Output' }
		},
		// Standalone node
		{
			id: 'standalone',
			type: 'simple',
			position: { x: 350, y: 270 },
			data: { label: 'Drag me into a group!' }
		},
	]);

	let edges: FlowEdge[] = $state([
		{ id: 'e1', source: 'input-1', source_handle: 'out', target: 'process-1', target_handle: 'in' },
		{ id: 'e2', source: 'input-2', source_handle: 'out', target: 'process-1', target_handle: 'in' },
		{ id: 'e3', source: 'process-1', source_handle: 'out', target: 'output-1', target_handle: 'in' },
	]);

	const nodeTypes: NodeTypes = {
		'group': GroupNode,
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

	function addGroup() {
		const flow = canvasRef?.getFlow();
		if (!flow) return;

		const colors = ['#eb5425', '#22c55e', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];
		const color = colors[Math.floor(Math.random() * colors.length)];

		const newGroup: FlowNode = {
			id: `group-${Date.now()}`,
			type: 'group',
			position: { x: 100 + Math.random() * 200, y: 100 + Math.random() * 100 },
			width: 200,
			height: 150,
			data: { label: 'New Group', color }
		};
		flow.addNode(newGroup);
	}

	function addNode() {
		const flow = canvasRef?.getFlow();
		if (!flow) return;

		const newNode: FlowNode = {
			id: `node-${Date.now()}`,
			type: 'simple',
			position: { x: 300 + Math.random() * 100, y: 250 + Math.random() * 50 },
			data: { label: `Node ${flow.nodes.filter(n => n.type !== 'group').length + 1}` }
		};
		flow.addNode(newNode);
	}
</script>

<div class="example-page">
	<div class="example-sidebar">
		<h1>Groups</h1>
		<p>Organize nodes into visual groups for better flow management.</p>

		<div class="button-row">
			<button class="action-btn" onclick={addGroup}>Add Group</button>
			<button class="action-btn secondary" onclick={addNode}>Add Node</button>
		</div>

		<div class="section">
			<h3>Group Features</h3>
			<ul class="feature-list">
				<li><strong>Drag nodes into groups</strong> - Nodes become children</li>
				<li><strong>Drag nodes out</strong> - Nodes become standalone</li>
				<li><strong>Double-click label</strong> - Edit group name</li>
				<li><strong>Right-click group</strong> - Color picker menu</li>
				<li><strong>Drag corner</strong> - Resize group</li>
				<li><strong>Move group</strong> - Children move with it</li>
			</ul>
		</div>

		<div class="section">
			<h3>Creating Groups</h3>
			<div class="code-block">
				<pre>{`const nodes = [
  // Group node
  {
    id: 'group-1',
    type: 'group',
    position: { x: 50, y: 50 },
    width: 250,
    height: 200,
    data: { 
      label: 'My Group', 
      color: '#eb5425' 
    }
  },
  // Child node
  {
    id: 'child-1',
    type: 'simple',
    position: { x: 70, y: 90 },
    data: { label: 'Child' },
    parent_id: 'group-1' // Links to parent
  }
];`}</pre>
			</div>
		</div>

		<div class="section">
			<h3>Register GroupNode</h3>
			<div class="code-block">
				<pre>{`import { GroupNode } from 'kaykay';

const nodeTypes = {
  group: GroupNode,
  custom: MyCustomNode
};`}</pre>
			</div>
		</div>

		<div class="section">
			<h3>Group Data Properties</h3>
			<table class="props-table">
				<tbody>
					<tr>
						<td><code>label</code></td>
						<td>Display name</td>
					</tr>
					<tr>
						<td><code>color</code></td>
						<td>Border & label color</td>
					</tr>
					<tr>
						<td><code>width</code></td>
						<td>Group width (on node)</td>
					</tr>
					<tr>
						<td><code>height</code></td>
						<td>Group height (on node)</td>
					</tr>
				</tbody>
			</table>
		</div>

		<div class="tip">
			<strong>Try it:</strong> Drag the standalone node into one of the groups, then move the group to see the node follow!
		</div>
	</div>

	<div class="example-canvas">
		<Canvas bind:this={canvasRef} {nodes} {edges} {nodeTypes} {callbacks} />
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
		margin: 0 0 20px 0;
		color: #888;
	}

	.button-row {
		display: flex;
		gap: 12px;
		margin-bottom: 24px;
	}

	.action-btn {
		flex: 1;
		padding: 12px;
		background: #eb5425;
		border: none;
		border-radius: 6px;
		color: #fff;
		font-size: 0.9rem;
		cursor: pointer;
		transition: background 0.15s ease;
	}

	.action-btn:hover {
		background: #2d7fd3;
	}

	.action-btn.secondary {
		background: #252422;
	}

	.action-btn.secondary:hover {
		background: #4a4a5e;
	}

	.section {
		margin-bottom: 24px;
	}

	.section h3 {
		margin: 0 0 12px 0;
		font-size: 1rem;
		color: #eb5425;
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

	.props-table {
		width: 100%;
		font-size: 0.85rem;
		border-collapse: collapse;
	}

	.props-table td {
		padding: 8px 12px;
		border-bottom: 1px solid #1f1f1f;
	}

	.props-table td:first-child {
		color: #f59e0b;
	}

	.props-table td:last-child {
		color: #aaa;
	}

	:global(.kaykay-light) .props-table td {
		border-color: #e0e0e0;
	}

	:global(.kaykay-light) .props-table td:last-child {
		color: #666;
	}

	.tip {
		background: rgba(74, 158, 255, 0.1);
		border-left: 3px solid #eb5425;
		padding: 12px 16px;
		border-radius: 0 8px 8px 0;
		font-size: 0.9rem;
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

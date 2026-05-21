<script lang="ts">
	import Canvas from '../../../lib/components/Canvas.svelte';
	import Controls from '../../../lib/components/Controls.svelte';
	import Minimap from '../../../lib/components/Minimap.svelte';
	import type { Flow, FlowCallbacks, FlowConfig, FlowEdge, FlowNode, NodeStatus, NodeTypes } from '../../../lib/types/index.js';
	import ExampleToolbar from '../ExampleToolbar.svelte';
	import { cloneFlowEdges, cloneFlowNodes } from '../example-utils.js';
	import BasicNode from '../nodes/BasicNode.svelte';

	// oxlint-disable-next-line no-unassigned-vars -- assigned by Svelte bind:this
	let canvasRef = $state<ReturnType<typeof Canvas> | undefined>();
	let selectedJson = $state('');
	let importJson = $state('');
	let lastChange = $state('No changes yet');
	let loadError = $state('');
	let executionState = $state<'idle' | 'running' | 'done'>('idle');
	let canvasKey = $state(0);

	const initialNodes: FlowNode[] = [
		{ id: 'source', type: 'basic', position: { x: 90, y: 120 }, data: { label: 'Source' } },
		{ id: 'validate', type: 'basic', position: { x: 330, y: 90 }, data: { label: 'Validate' } },
		{ id: 'output', type: 'basic', position: { x: 580, y: 120 }, data: { label: 'Output' } },
	];

	const initialEdges: FlowEdge[] = [
		{ id: 'source-validate', source: 'source', source_handle: 'out', target: 'validate', target_handle: 'in', type: 'bezier' },
		{ id: 'validate-output', source: 'validate', source_handle: 'out', target: 'output', target_handle: 'in', type: 'step', animated: true },
	];

	let nodes: FlowNode[] = $state(cloneFlowNodes(initialNodes));
	let edges: FlowEdge[] = $state(cloneFlowEdges(initialEdges));

	const nodeTypes: NodeTypes = {
		basic: BasicNode,
	};

	const node_statuses = $derived<Record<string, NodeStatus>>({
		source: executionState === 'idle' ? 'idle' : 'completed',
		validate: executionState === 'running' ? 'running' : executionState === 'done' ? 'completed' : 'idle',
		output: executionState === 'done' ? 'completed' : 'idle',
	});

	const config: FlowConfig = {
		max_history: 25,
		max_connections_per_input: 1,
		prevent_cycles: true,
	};

	const callbacks: FlowCallbacks = {
		on_change: (flow, reason) => {
			lastChange = `${reason} (${flow.nodes.length} nodes, ${flow.edges.length} edges)`;
		},
		on_selection_change: (nodeIds, edgeIds) => {
			lastChange = `selection:update (${nodeIds.length} nodes, ${edgeIds.length} edges)`;
		},
	};

	function getFlow() {
		return canvasRef?.getFlow();
	}

	function exportFlow(): void {
		const flow = getFlow();
		if (!flow) return;
		selectedJson = JSON.stringify(flow.toJSON(), null, 2);
		importJson = selectedJson;
		loadError = '';
	}

	function loadFlow(): void {
		const flow = getFlow();
		if (!flow) return;

		try {
			const parsed = JSON.parse(importJson) as Flow;
			flow.fromJSON(parsed);
			loadError = '';
			exportFlow();
		} catch (error) {
			loadError = error instanceof Error ? error.message : 'Invalid JSON';
		}
	}

	function addNode(): void {
		const flow = getFlow();
		if (!flow) return;

		const id = `node-${Date.now()}`;
		flow.addNode({
			id,
			type: 'basic',
			position: flow.screenToCanvas({ x: 420, y: 260 }),
			data: { label: 'New Node' },
		});
	}

	function runDemo(): void {
		executionState = 'running';
		setTimeout(() => {
			executionState = 'done';
		}, 900);
	}

	function resetRun(): void {
		executionState = 'idle';
	}

	function resetExample(): void {
		nodes = cloneFlowNodes(initialNodes);
		edges = cloneFlowEdges(initialEdges);
		selectedJson = '';
		importJson = '';
		lastChange = 'No changes yet';
		loadError = '';
		executionState = 'idle';
		canvasKey += 1;
	}
</script>

<div class="example-page">
	<div class="example-sidebar">
		<h1>State & History</h1>
		<p>Undo/redo, clipboard, JSON import/export, node statuses, and change callbacks.</p>
		<ExampleToolbar onReset={resetExample} sourcePath="src/routes/examples/state-history/+page.svelte" />

		<div class="section">
			<h3>State Controls</h3>
			<div class="button-grid">
				<button onclick={() => getFlow()?.undo()}>Undo</button>
				<button onclick={() => getFlow()?.redo()}>Redo</button>
				<button onclick={() => getFlow()?.copySelected()}>Copy</button>
				<button onclick={() => getFlow()?.paste()}>Paste</button>
				<button onclick={addNode}>Add Node</button>
				<button onclick={exportFlow}>Export JSON</button>
			</div>
			<p class="change-line">Last event: {lastChange}</p>
		</div>

		<div class="section">
			<h3>Execution Status</h3>
			<div class="button-grid">
				<button onclick={runDemo} disabled={executionState === 'running'}>Run</button>
				<button onclick={resetRun}>Reset</button>
			</div>
			<p>Statuses are passed with <code>node_statuses</code> and rendered by the built-in node wrapper.</p>
		</div>

		<div class="section">
			<h3>Import / Export</h3>
			<textarea bind:value={importJson} placeholder="Export first, then edit JSON here"></textarea>
			<div class="button-grid">
				<button onclick={loadFlow}>Load JSON</button>
				<button onclick={() => importJson = selectedJson}>Reset Text</button>
			</div>
			{#if loadError}
				<p class="error-text">{loadError}</p>
			{/if}
		</div>

		<div class="section">
			<h3>Keyboard Shortcuts</h3>
			<ul class="feature-list">
				<li><strong>Ctrl/Meta+Z</strong> - Undo</li>
				<li><strong>Ctrl/Meta+Shift+Z</strong> - Redo</li>
				<li><strong>Ctrl/Meta+C/V</strong> - Copy and paste</li>
				<li><strong>Arrow keys</strong> - Nudge selected nodes</li>
				<li><strong>Shift+Arrow</strong> - Larger nudge</li>
			</ul>
		</div>
	</div>

	<div class="example-canvas">
		{#key canvasKey}
			<Canvas bind:this={canvasRef} {nodes} {edges} {nodeTypes} {config} {callbacks} {node_statuses}>
				{#snippet controls()}
					<div class="floating-tools">
						<Controls />
						<Minimap selectedNodeColor="#f6a21a" />
					</div>
				{/snippet}
			</Canvas>
		{/key}
	</div>
</div>

<style>
	.example-page {
		display: flex;
		height: 100%;
	}

	.example-sidebar {
		width: 360px;
		padding: 24px;
		overflow-y: auto;
		background: #161618;
		border-right: 1px solid #1f1f1f;
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

	:global(.kaykay-light) .section p {
		color: #555;
	}

	.button-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 8px;
	}

	button {
		padding: 9px 12px;
		background: #eb5425;
		border: 0;
		border-radius: 6px;
		color: #fff;
		font-weight: 700;
		cursor: pointer;
		transition: background 0.15s ease;
	}

	button:hover:not(:disabled) {
		background: #2d7fd3;
	}

	button:disabled {
		opacity: 0.55;
		cursor: not-allowed;
	}

	textarea {
		width: 100%;
		min-height: 190px;
		box-sizing: border-box;
		padding: 12px;
		margin-bottom: 8px;
		background: #1f1f1f;
		border: 1px solid #252422;
		border-radius: 6px;
		color: #fff;
		font: 12px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
		resize: vertical;
	}

	:global(.kaykay-light) textarea {
		background: #f5f5f5;
		border-color: #e0e0e0;
		color: #333;
	}

	textarea::placeholder {
		color: #777;
	}

	:global(.kaykay-light) textarea::placeholder {
		color: #888;
	}

	.change-line,
	.error-text {
		font-size: 12px;
	}

	.error-text {
		color: #f87171;
	}

	.feature-list {
		margin: 0;
		padding-left: 18px;
		color: #ccc;
		font-size: 0.85rem;
		line-height: 1.7;
	}

	:global(.kaykay-light) .feature-list {
		color: #555;
	}

	.example-canvas {
		flex: 1;
		position: relative;
	}

	.floating-tools {
		position: absolute;
		right: 16px;
		bottom: 16px;
		display: grid;
		gap: 12px;
		z-index: 10;
	}

	code {
		background: #252422;
		padding: 2px 6px;
		border-radius: 4px;
		color: #f6a21a;
	}

	:global(.kaykay-light) code {
		background: #e8e8e8;
		color: #d97706;
	}
</style>

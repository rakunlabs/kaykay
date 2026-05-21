<script lang="ts">
	import Canvas from '../../../lib/components/Canvas.svelte';
	import Controls from '../../../lib/components/Controls.svelte';
	import type { FlowNode, FlowEdge, NodeTypes, Position } from '../../../lib/types/index.js';
	import ExampleToolbar from '../ExampleToolbar.svelte';
	import { cloneFlowEdges, cloneFlowNodes } from '../example-utils.js';
	import DataSourceNode from '../nodes/DataSourceNode.svelte';
	import InputNode from '../nodes/InputNode.svelte';
	import MultiHandleNode from '../nodes/MultiHandleNode.svelte';
	import OutputNode from '../nodes/OutputNode.svelte';
	import SimpleNode from '../nodes/SimpleNode.svelte';

	type PaletteNodeType = 'input' | 'simple' | 'multi-handle' | 'output' | 'data-source';

	interface PaletteItem {
		type: PaletteNodeType;
		label: string;
		description: string;
		accent: string;
		data: (sequence: number) => Record<string, unknown>;
	}

	// oxlint-disable-next-line no-unassigned-vars -- assigned by Svelte bind:this
	let canvasRef = $state<ReturnType<typeof Canvas> | undefined>();
	let isDragOver = $state(false);
	let nodeCounter = 2;
	let canvasKey = $state(0);

	const initialNodes: FlowNode[] = [
		{
			id: 'input-1',
			type: 'input',
			position: { x: 80, y: 100 },
			data: { label: 'Input 1' },
		},
		{
			id: 'processor-1',
			type: 'simple',
			position: { x: 360, y: 100 },
			data: { label: 'Processor 1' },
		},
		{
			id: 'output-1',
			type: 'output',
			position: { x: 640, y: 100 },
			data: { label: 'Output 1' },
		},
	];

	const initialEdges: FlowEdge[] = [
		{ id: 'e1', source: 'input-1', source_handle: 'out', target: 'processor-1', target_handle: 'in' },
		{ id: 'e2', source: 'processor-1', source_handle: 'out', target: 'output-1', target_handle: 'in' },
	];

	let nodes: FlowNode[] = $state(cloneFlowNodes(initialNodes));
	let edges: FlowEdge[] = $state(cloneFlowEdges(initialEdges));

	const nodeTypes: NodeTypes = {
		input: InputNode,
		simple: SimpleNode,
		'multi-handle': MultiHandleNode,
		output: OutputNode,
		'data-source': DataSourceNode,
	};

	const paletteItems: PaletteItem[] = [
		{
			type: 'input',
			label: 'Input Node',
			description: 'A source node with one output handle.',
			accent: '#22c55e',
			data: (sequence) => ({ label: `Input ${sequence}` }),
		},
		{
			type: 'simple',
			label: 'Processor',
			description: 'A basic node with input and output handles.',
			accent: '#4a9eff',
			data: (sequence) => ({ label: `Processor ${sequence}` }),
		},
		{
			type: 'multi-handle',
			label: 'Aggregator',
			description: 'A node with multiple input handles.',
			accent: '#f59e0b',
			data: (sequence) => ({ label: `Aggregator ${sequence}` }),
		},
		{
			type: 'output',
			label: 'Output Node',
			description: 'A destination node with one input handle.',
			accent: '#8b5cf6',
			data: (sequence) => ({ label: `Output ${sequence}` }),
		},
		{
			type: 'data-source',
			label: 'Typed Source',
			description: 'A source with text, number, and boolean ports.',
			accent: '#06b6d4',
			data: (sequence) => ({ label: `Source ${sequence}` }),
		},
	];

	const callbacks = {
		on_connect: (edge: FlowEdge) => {
			edges = [...edges, edge];
		},
		on_delete: (nodeIds: string[], edgeIds: string[]) => {
			nodes = nodes.filter((node) => !nodeIds.includes(node.id));
			edges = edges.filter((edge) => !edgeIds.includes(edge.id));
		},
	};

	function findPaletteItem(type: string): PaletteItem | undefined {
		return paletteItems.find((item) => item.type === type);
	}

	function createNode(item: PaletteItem, position: Position): FlowNode {
		const sequence = nodeCounter++;
		return {
			id: `${item.type}-${Date.now()}-${sequence}`,
			type: item.type,
			position,
			data: item.data(sequence),
		};
	}

	function addNode(item: PaletteItem, position: Position) {
		const flow = canvasRef?.getFlow();
		if (!flow) return;

		flow.addNode(createNode(item, position));
	}

	function handleDragStart(e: DragEvent, item: PaletteItem) {
		if (!e.dataTransfer) return;

		e.dataTransfer.effectAllowed = 'copy';
		e.dataTransfer.setData('application/x-kaykay-node', item.type);
		e.dataTransfer.setData('text/plain', item.type);
	}

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		isDragOver = true;

		if (e.dataTransfer) {
			e.dataTransfer.dropEffect = 'copy';
		}
	}

	function handleDragLeave(e: DragEvent) {
		const currentTarget = e.currentTarget as HTMLElement;
		const relatedTarget = e.relatedTarget;
		if (!(relatedTarget instanceof Node) || !currentTarget.contains(relatedTarget)) {
			isDragOver = false;
		}
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		isDragOver = false;

		const nodeType = e.dataTransfer?.getData('application/x-kaykay-node') || e.dataTransfer?.getData('text/plain');
		const item = nodeType ? findPaletteItem(nodeType) : undefined;
		const position = canvasRef?.clientToCanvas(e.clientX, e.clientY);

		if (!item || !position) return;

		addNode(item, position);
	}

	function addNodeAtCenter(item: PaletteItem) {
		const container = canvasRef?.getContainer();
		if (!container) return;

		const rect = container.getBoundingClientRect();
		const position = canvasRef?.clientToCanvas(rect.left + rect.width / 2, rect.top + rect.height / 2);
		if (!position) return;

		addNode(item, position);
	}

	function resetExample(): void {
		nodes = cloneFlowNodes(initialNodes);
		edges = cloneFlowEdges(initialEdges);
		isDragOver = false;
		nodeCounter = 2;
		canvasKey += 1;
	}
</script>

<div class="example-page">
	<div class="example-sidebar">
		<h1>Drag & Drop</h1>
		<p>Build a node palette by using native HTML drag-and-drop with the Canvas instance helpers.</p>
		<ExampleToolbar onReset={resetExample} sourcePath="src/routes/examples/drag-drop/+page.svelte" />

		<div class="palette">
			{#each paletteItems as item}
				<button
					type="button"
					class="palette-item"
					draggable="true"
					style:--accent={item.accent}
					ondragstart={(e) => handleDragStart(e, item)}
					onclick={() => addNodeAtCenter(item)}
				>
					<span class="palette-title">{item.label}</span>
					<span class="palette-description">{item.description}</span>
				</button>
			{/each}
		</div>

		<div class="section">
			<h3>How It Works</h3>
			<div class="code-block">
				<pre>{`function handleDrop(event) {
  event.preventDefault();

  const position = canvasRef.clientToCanvas(
    event.clientX,
    event.clientY
  );

  canvasRef.getFlow().addNode({
    id: crypto.randomUUID(),
    type: 'custom',
    position,
    data: { label: 'Dropped node' }
  });
}`}</pre>
			</div>
		</div>

		<div class="tip">
			<strong>Try it:</strong> Drag a palette item onto the canvas. Click a palette item to add it to the current viewport center.
		</div>
	</div>

	<div
		class="example-canvas"
		class:drop-active={isDragOver}
		ondragover={handleDragOver}
		ondragleave={handleDragLeave}
		ondrop={handleDrop}
		role="region"
		aria-label="Drag and drop canvas"
	>
		<div class="drop-hint">Drop nodes anywhere on the canvas</div>
		{#key canvasKey}
			<Canvas bind:this={canvasRef} {nodes} {edges} {nodeTypes} {callbacks}>
				<Controls />
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
		width: 400px;
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
		line-height: 1.6;
	}

	.palette {
		display: grid;
		gap: 12px;
		margin-bottom: 24px;
	}

	.palette-item {
		--accent: #eb5425;

		display: grid;
		gap: 6px;
		padding: 14px 16px;
		text-align: left;
		background: linear-gradient(135deg, color-mix(in srgb, var(--accent), transparent 82%), #252422);
		border: 1px solid color-mix(in srgb, var(--accent), transparent 35%);
		border-left: 4px solid var(--accent);
		border-radius: 10px;
		color: #fff;
		cursor: grab;
		font: inherit;
		transition: transform 0.15s ease, border-color 0.15s ease, background 0.15s ease;
	}

	.palette-item:hover {
		transform: translateX(3px);
		border-color: var(--accent);
	}

	.palette-item:active {
		cursor: grabbing;
	}

	:global(.kaykay-light) .palette-item {
		background: linear-gradient(135deg, color-mix(in srgb, var(--accent), transparent 90%), #fff);
		color: #222;
	}

	.palette-title {
		font-weight: 700;
		font-size: 0.95rem;
	}

	.palette-description {
		color: #aaa;
		font-size: 0.78rem;
		line-height: 1.5;
	}

	:global(.kaykay-light) .palette-description {
		color: #555;
	}

	.section {
		margin-bottom: 24px;
	}

	.section h3 {
		margin: 0 0 12px 0;
		font-size: 1rem;
		color: #eb5425;
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
		line-height: 1.6;
		white-space: pre;
	}

	:global(.kaykay-light) .code-block pre {
		color: #0969da;
	}

	.tip {
		padding: 14px 16px;
		background: rgba(235, 84, 37, 0.1);
		border: 1px solid rgba(235, 84, 37, 0.3);
		border-radius: 8px;
		color: #fca5a5;
		font-size: 0.85rem;
		line-height: 1.6;
	}

	:global(.kaykay-light) .tip {
		color: #92400e;
		background: #fff7ed;
		border-color: #fed7aa;
	}

	.example-canvas {
		position: relative;
		flex: 1;
		min-width: 0;
	}

	.example-canvas.drop-active::after {
		content: '';
		position: absolute;
		inset: 16px;
		z-index: 20;
		border: 2px dashed #eb5425;
		border-radius: 18px;
		background: rgba(235, 84, 37, 0.08);
		pointer-events: none;
	}

	.drop-hint {
		position: absolute;
		top: 16px;
		left: 16px;
		z-index: 21;
		padding: 8px 12px;
		background: rgba(22, 22, 24, 0.85);
		border: 1px solid rgba(255, 255, 255, 0.12);
		border-radius: 999px;
		color: #ddd;
		font-size: 0.78rem;
		pointer-events: none;
	}

	:global(.kaykay-light) .drop-hint {
		background: rgba(255, 255, 255, 0.9);
		border-color: rgba(0, 0, 0, 0.1);
		color: #555;
	}

	@media (max-width: 900px) {
		.example-page {
			flex-direction: column;
		}

		.example-sidebar {
			width: auto;
			max-height: 45vh;
			border-right: 0;
			border-bottom: 1px solid #1f1f1f;
		}

		.palette {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}
</style>

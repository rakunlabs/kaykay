<script lang="ts">
	import Canvas from '../../lib/components/Canvas.svelte';
	import type { Flow, FlowCallbacks, FlowNode, FlowEdge, NodeTypes } from '../../lib/types/index.js';
	import TextNode from '../TextNode.svelte';
	import ProcessNode from '../ProcessNode.svelte';
	import OutputNode from '../OutputNode.svelte';
	import GroupNode from '../../lib/components/GroupNode.svelte';
	import Minimap from '../../lib/components/Minimap.svelte';
	import Controls from '../../lib/components/Controls.svelte';
	import StickyNoteNode from '../../lib/components/StickyNoteNode.svelte';
	import VirtualWireInputNode from '../../lib/components/VirtualWireInputNode.svelte';
	import VirtualWireOutputNode from '../../lib/components/VirtualWireOutputNode.svelte';
	import { flattenVirtualWireFlow } from '../../lib/utils/virtual-wire.js';
	import MarkdownStickyNote from './MarkdownStickyNote.svelte';
	// Additional node types
	import LabeledNode from '../examples/nodes/LabeledNode.svelte';
	import DataSourceNode from '../examples/nodes/DataSourceNode.svelte';
	import InputNode from '../examples/nodes/InputNode.svelte';
	import MultiHandleNode from '../examples/nodes/MultiHandleNode.svelte';

	// Reference to canvas component
	// oxlint-disable-next-line no-unassigned-vars -- assigned by Svelte bind:this
	let canvasRef: ReturnType<typeof Canvas> | undefined;

	// Define initial nodes with diverse node types
	let nodes: FlowNode[] = $state([
		// Input group with various source nodes
		{
			id: 'group-1',
			type: 'group',
			position: { x: 40, y: 40 },
			width: 300,
			height: 350,
			data: { label: 'Data Sources', color: '#22c55e' }
		},
		{
			id: 'node-1',
			type: 'input',
			position: { x: 30, y: 50 },
			data: { label: 'Text Input' },
			parent_id: 'group-1'
		},
		{
			id: 'node-2',
			type: 'input',
			position: { x: 30, y: 120 },
			data: { label: 'Number Input' },
			parent_id: 'group-1'
		},
		{
			id: 'node-3',
			type: 'datasource',
			position: { x: 30, y: 190 },
			data: { label: 'API Data' },
			parent_id: 'group-1'
		},
		// Processing nodes
		{
			id: 'node-4',
			type: 'labeled',
			position: { x: 420, y: 60 },
			data: { label: 'Transform' }
		},
		{
			id: 'node-5',
			type: 'process',
			position: { x: 420, y: 200 },
			data: { operation: 'Merge', description: 'Combines inputs' }
		},
		{
			id: 'node-6',
			type: 'multihandle',
			position: { x: 420, y: 340 },
			data: { label: 'Aggregator' }
		},
		// Virtual wire pair: visually portals channels without drawing a long pair cable
		{
			id: 'wire-in-main',
			type: 'virtual-wire-input',
			position: { x: 620, y: 225 },
			data: {
				pair_id: 'main-bus',
				pair_label: 'Main Bus',
				label: 'Main Bus In',
				color: '#38bdf8',
				channels: [{ id: '1', label: '1' }, { id: '2', label: '2' }]
			}
		},
		{
			id: 'wire-out-main',
			type: 'virtual-wire-output',
			position: { x: 630, y: 20 },
			data: {
				pair_id: 'main-bus',
				pair_label: 'Main Bus',
				label: 'Main Bus Out',
				color: '#38bdf8',
				channels: [{ id: '1', label: '1' }, { id: '2', label: '2' }]
			}
		},
		{
			id: 'wire-out-main-mirror',
			type: 'virtual-wire-output',
			position: { x: 630, y: 360 },
			data: {
				pair_id: 'main-bus',
				pair_label: 'Main Bus',
				label: 'Main Bus Mirror Out',
				color: '#38bdf8',
				channels: [{ id: '1', label: '1' }, { id: '2', label: '2' }]
			}
		},
		// Output group
		{
			id: 'group-2',
			type: 'group',
			position: { x: 840, y: 100 },
			width: 280,
			height: 380,
			data: { label: 'Outputs', color: '#8b5cf6' }
		},
		{
			id: 'node-7',
			type: 'output',
			position: { x: 30, y: 50 },
			data: { title: 'Result A' },
			parent_id: 'group-2'
		},
		{
			id: 'node-8',
			type: 'output',
			position: { x: 30, y: 150 },
			data: { title: 'Result B' },
			parent_id: 'group-2'
		},
		{
			id: 'node-9',
			type: 'output',
			position: { x: 30, y: 250 },
			data: { title: 'Result A Mirror' },
			parent_id: 'group-2'
		},
		// Sticky notes (no handles)
		{
			id: 'sticky-1',
			type: 'sticky',
			position: { x: 450, y: 500 },
			width: 180,
			height: 100,
			data: { text: 'Remember to connect\nall data sources!', color: '#fef08a' }
		},
		{
			id: 'sticky-2',
			type: 'sticky',
			position: { x: 750, y: 420 },
			width: 200,
			height: 120,
			data: { text: 'Output nodes receive\nprocessed data here', color: '#bbf7d0' }
		},
		// Markdown sticky note example
		{
			id: 'sticky-3',
			type: 'markdown-sticky',
			position: { x: 100, y: 450 },
			width: 220,
			height: 140,
			data: { text: '**Markdown** support!\n_italic_ and `code`\n[kaykay repo](https://github.com/rakunlabs/kaykay)', color: '#bfdbfe' }
		}
	]);

	// Define initial edges connecting the nodes
	let edges: FlowEdge[] = $state([
		// Input to Transform (labeled node)
		{
			id: 'edge-1',
			source: 'node-1',
			source_handle: 'out',
			target: 'node-4',
			target_handle: 'text',
			type: 'bezier'
		},
		{
			id: 'edge-2',
			source: 'node-2',
			source_handle: 'out',
			target: 'node-4',
			target_handle: 'number',
			type: 'bezier'
		},
		// Transform to Aggregator
		{
			id: 'edge-5',
			source: 'node-4',
			source_handle: 'out',
			target: 'node-6',
			target_handle: 'in-1',
			type: 'bezier'
		},
		// Process to Aggregator
		{
			id: 'edge-6',
			source: 'node-5',
			source_handle: 'output',
			target: 'node-6',
			target_handle: 'in-2',
			type: 'bezier'
		},
		// Aggregator to virtual wire channel 1, then two portal outputs fan out to Result A and its mirror
		{
			id: 'edge-7',
			source: 'node-6',
			source_handle: 'out',
			target: 'wire-in-main',
			target_handle: 'in-1',
			type: 'bezier'
		},
		{
			id: 'edge-7-portal',
			source: 'wire-out-main',
			source_handle: 'out-1',
			target: 'node-7',
			target_handle: 'in',
			type: 'bezier',
			style: 'dashed',
			color: '#38bdf8'
		},
		{
			id: 'edge-7-portal-mirror',
			source: 'wire-out-main-mirror',
			source_handle: 'out-1',
			target: 'node-9',
			target_handle: 'in',
			type: 'bezier',
			style: 'dashed',
			color: '#38bdf8'
		},
		// Transform to virtual wire channel 2, then portal output to Result B
		{
			id: 'edge-8',
			source: 'node-4',
			source_handle: 'out',
			target: 'wire-in-main',
			target_handle: 'in-2',
			type: 'bezier'
		},
		{
			id: 'edge-8-portal',
			source: 'wire-out-main',
			source_handle: 'out-2',
			target: 'node-8',
			target_handle: 'in',
			type: 'bezier',
			style: 'dashed',
			color: '#38bdf8'
		}
	]);

	// svelte-ignore state_referenced_locally -- initial JSON snapshot mirrors the serialized canvas props.
	let liveJson = $state(stringifyFlow(flattenVirtualWireFlow({ nodes, edges })));
	let jsonStatus = $state('Synced with canvas');
	let jsonError = $state('');
	let jsonEditorFocused = $state(false);
	let isApplyingJson = false;

	// Register node types
	const nodeTypes: NodeTypes = {
		text: TextNode,
		process: ProcessNode,
		output: OutputNode,
		group: GroupNode,
		labeled: LabeledNode,
		datasource: DataSourceNode,
		input: InputNode,
		multihandle: MultiHandleNode,
		sticky: StickyNoteNode,
		'markdown-sticky': MarkdownStickyNote,
		'virtual-wire-input': VirtualWireInputNode,
		'virtual-wire-output': VirtualWireOutputNode
	};

	// Available node types for cycling when adding new nodes
	const addableNodeTypes = [
		{ type: 'text', data: (n: number) => ({ label: `Text ${n}`, color: '#eb5425' }) },
		{ type: 'input', data: (n: number) => ({ label: `Input ${n}` }) },
		{ type: 'labeled', data: (n: number) => ({ label: `Labeled ${n}` }) },
		{ type: 'datasource', data: (n: number) => ({ label: `Source ${n}` }) },
		{ type: 'process', data: (n: number) => ({ operation: `Process ${n}`, description: 'Custom process' }) },
		{ type: 'multihandle', data: (n: number) => ({ label: `Multi ${n}` }) },
		{ type: 'output', data: (n: number) => ({ title: `Output ${n}` }) },
		{ type: 'virtual-wire-input', data: (n: number) => ({ pair_id: `wire-${n}`, pair_label: `Wire ${n}`, label: `Wire In ${n}`, color: '#38bdf8', channels: [{ id: '1', label: '1' }] }) },
		{ type: 'virtual-wire-output', data: (n: number) => ({ pair_id: `wire-${n}`, pair_label: `Wire ${n}`, label: `Wire Out ${n}`, color: '#38bdf8', channels: [{ id: '1', label: '1' }] }) },
		{ type: 'sticky', data: (n: number) => ({ text: `Note ${n}\nDouble-click to edit...`, color: ['#fef08a', '#bbf7d0', '#bfdbfe', '#fecaca', '#e9d5ff'][n % 5] }), width: 180, height: 100 }
	];
	let nodeTypeIndex = 0;

	// Canvas configuration
	const config = {
		min_zoom: 0.5,
		max_zoom: 2,
		snap_to_grid: true,
		allow_delete: true,
		default_edge_type: 'bezier' as const
	};

	// Callbacks
	const callbacks: FlowCallbacks = {
		on_node_click: (nodeId: string) => console.log('Node clicked:', nodeId),
		on_connect: (edge: FlowEdge) => {
			console.log('New connection:', edge);
			edges.push(edge);
		},
		on_delete: (nodeIds: string[], edgeIds: string[]) => {
			console.log('Deleted:', { nodeIds, edgeIds });
			nodes = nodes.filter(n => !nodeIds.includes(n.id));
			edges = edges.filter(e => !edgeIds.includes(e.id));
		},
		on_change: (flow, reason) => {
			if (isApplyingJson) return;
			if (!jsonEditorFocused) {
				liveJson = stringifyFlow(flow);
			}
			jsonError = '';
			jsonStatus = `Synced: ${reason}`;
		}
	};

	function stringifyFlow(flow: Flow): string {
		return JSON.stringify(flow, null, 2);
	}

	function isRecord(value: unknown): value is Record<string, unknown> {
		return typeof value === 'object' && value !== null;
	}

	function parseFlowJson(json: string): Flow {
		const parsed: unknown = JSON.parse(json);
		if (!isRecord(parsed) || !Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) {
			throw new Error('Expected JSON shape: { nodes: FlowNode[], edges: FlowEdge[] }');
		}

		return {
			nodes: parsed.nodes as FlowNode[],
			edges: parsed.edges as FlowEdge[],
			kaykay: 'kaykay' in parsed ? (parsed.kaykay as Flow['kaykay']) : undefined,
		};
	}

	function syncExternalState(flow: Flow): void {
		nodes = flow.nodes;
		edges = flow.edges;
	}

	function getFlowJson(): Flow | null {
		const flow = canvasRef?.getFlow();
		return flow?.toJSON() ?? null;
	}

	function syncJsonFromCanvas(status = 'Synced with canvas'): void {
		const flowJson = getFlowJson();
		if (!flowJson) return;
		liveJson = stringifyFlow(flowJson);
		jsonError = '';
		jsonStatus = status;
	}

	function applyFlowJson(flowJson: Flow, options: { format?: boolean; status?: string } = {}): void {
		const flow = canvasRef?.getFlow();
		if (!flow) return;

		isApplyingJson = true;
		try {
			flow.fromJSON(flowJson);
			const normalized = flow.toJSON();
			syncExternalState(normalized);
			if (options.format) {
				liveJson = stringifyFlow(normalized);
			}
			jsonError = '';
			jsonStatus = options.status ?? `Applied JSON (${normalized.nodes.length} nodes, ${normalized.edges.length} edges)`;
		} finally {
			isApplyingJson = false;
		}
	}

	function handleJsonInput(): void {
		try {
			const flowJson = parseFlowJson(liveJson);
			applyFlowJson(flowJson);
		} catch (error) {
			jsonError = error instanceof Error ? error.message : 'Invalid JSON';
			jsonStatus = 'Canvas kept unchanged';
		}
	}

	function handleJsonBlur(): void {
		jsonEditorFocused = false;
		if (!jsonError) {
			syncJsonFromCanvas('Formatted from canvas');
		}
	}

	function formatJson(): void {
		try {
			const flowJson = parseFlowJson(liveJson);
			applyFlowJson(flowJson, { format: true, status: 'Formatted and applied JSON' });
		} catch (error) {
			jsonError = error instanceof Error ? error.message : 'Invalid JSON';
			jsonStatus = 'Cannot format invalid JSON';
		}
	}

	async function copyJson(): Promise<void> {
		try {
			await navigator.clipboard.writeText(liveJson);
			jsonStatus = 'Copied JSON to clipboard';
		} catch {
			jsonError = 'Failed to copy JSON';
		}
	}

	// Add new node function - cycles through different node types
	function addNode() {
		const flow = canvasRef?.getFlow();
		if (!flow) return;
		
		const nodeConfig = addableNodeTypes[nodeTypeIndex];
		const nodeCount = flow.nodes.filter(n => n.type === nodeConfig.type).length + 1;
		
		const newNode: FlowNode = {
			id: '',  // Auto-generate ID
			type: nodeConfig.type,
			position: { x: 100 + Math.random() * 300, y: 100 + Math.random() * 300 },
			data: nodeConfig.data(nodeCount),
			...('width' in nodeConfig && { width: nodeConfig.width }),
			...('height' in nodeConfig && { height: nodeConfig.height })
		};
		flow.addNode(newNode);
		
		// Cycle to next node type
		nodeTypeIndex = (nodeTypeIndex + 1) % addableNodeTypes.length;
	}

	// Add new group function
	function addGroup() {
		const flow = canvasRef?.getFlow();
		if (!flow) return;
		
		const colors = ['#eb5425', '#22c55e', '#f59e0b', '#ec4899', '#8b5cf6'];
		const color = colors[Math.floor(Math.random() * colors.length)];
		
		const newGroup: FlowNode = {
			id: `group-${Date.now()}`,
			type: 'group',
			position: { x: 100 + Math.random() * 100, y: 100 + Math.random() * 100 },
			width: 250,
			height: 200,
			data: { label: `Group ${flow.nodes.filter(n => n.type === 'group').length + 1}`, color }
		};
		flow.addNode(newGroup);
	}

	function addVirtualWirePair() {
		const flow = canvasRef?.getFlow();
		if (!flow) return;

		const pairNumber = flow.nodes.filter(n => n.type === 'virtual-wire-input').length + 1;
		const pairId = `wire-${Date.now()}`;
		const center = flow.screenToCanvas({ x: flow.canvas_width / 2, y: flow.canvas_height / 2 });
		const data = {
			pair_id: pairId,
			pair_label: `Wire ${pairNumber}`,
			color: '#38bdf8',
			channels: [{ id: '1', label: '1' }]
		};

		flow.beginTransaction();
		flow.addNode({
			id: `${pairId}-in`,
			type: 'virtual-wire-input',
			position: { x: center.x - 180, y: center.y - 40 },
			data: { ...data, label: `Wire In ${pairNumber}` }
		});
		flow.addNode({
			id: `${pairId}-out`,
			type: 'virtual-wire-output',
			position: { x: center.x + 80, y: center.y - 40 },
			data: { ...data, label: `Wire Out ${pairNumber}` }
		});
		flow.endTransaction(true, 'node:add');
	}

	// Export flow as JSON
	function exportFlow() {
		const flow = canvasRef?.getFlow();
		if (!flow) return;
		
		const data = flow.toJSON();
		const json = JSON.stringify(data, null, 2);
		liveJson = json;
		jsonError = '';
		jsonStatus = 'Exported current canvas JSON';
		const blob = new Blob([json], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'flow.json';
		a.click();
		URL.revokeObjectURL(url);
	}

	// Clear all nodes and edges
	function clearFlow() {
		const flow = canvasRef?.getFlow();
		if (!flow) return;
		
		if (confirm('Clear all nodes and edges?')) {
			// Remove all nodes (this also removes connected edges)
			const nodeIds = flow.nodes.map(n => n.id);
			nodeIds.forEach(id => flow.removeNode(id));
		}
	}

	// Hidden file input reference
	// oxlint-disable-next-line no-unassigned-vars -- assigned by Svelte bind:this
	let fileInput: HTMLInputElement;

	// Import flow from JSON file
	function importFlow() {
		fileInput?.click();
	}

	function handleFileSelect(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = (event) => {
			try {
				const json = event.target?.result as string;
				const data = JSON.parse(json);
				
				const flow = canvasRef?.getFlow();
				if (!flow) return;

				const flowJson = parseFlowJson(JSON.stringify(data));
				applyFlowJson(flowJson, { format: true, status: 'Imported JSON file' });
			} catch (err) {
				jsonError = err instanceof Error ? err.message : 'Failed to import JSON: Invalid format';
				jsonStatus = 'Import failed';
				alert('Failed to import JSON: Invalid format');
				console.error(err);
			}
		};
		reader.readAsText(file);
		
		// Reset input so same file can be selected again
		input.value = '';
	}
</script>

<div class="demo-container">
	<input
		type="file"
		accept=".json"
		bind:this={fileInput}
		onchange={handleFileSelect}
		style="display: none"
	/>
	<div class="controls">
		<h1>Playground</h1>
		<div class="button-group">
			<button onclick={addNode}>Add Node</button>
			<button onclick={addGroup}>Add Group</button>
			<button onclick={addVirtualWirePair}>Add Wire Pair</button>
			<button onclick={importFlow}>Import JSON</button>
			<button onclick={exportFlow}>Export JSON</button>
			<button onclick={clearFlow} class="danger">Clear All</button>
		</div>
		<p class="hint">
			<strong>Controls:</strong> Pan: Click & drag | Zoom: Mouse wheel | 
			Connect: Drag from output to input | Delete: Select & press Delete/Backspace |
			Waypoints: Ctrl+click edge to add, Ctrl+click waypoint to delete |
			Groups: Drag nodes into/out of groups |
			Selection: Ctrl+drag to select multiple, Ctrl+A to select all |
			Copy/Paste: Ctrl+C/V (works across browser tabs!) |
			Virtual Wire: connect into channel 1, exit from one or more channel 1 portals without a long pair cable
		</p>
	</div>
	
	<div class="playground-workspace">
		<div class="canvas-wrapper">
			<Canvas bind:this={canvasRef} {nodes} {edges} {nodeTypes} {config} {callbacks} >
				<Minimap />
				<Controls />
			</Canvas>
		</div>

		<aside class="json-panel">
			<div class="json-panel-header">
				<div>
					<h2>Live JSON</h2>
					<p>Edit valid JSON to update the canvas.</p>
				</div>
				<div class="json-actions">
					<button type="button" onclick={formatJson}>Format</button>
					<button type="button" onclick={copyJson}>Copy</button>
				</div>
			</div>

			<textarea
				class="json-editor"
				bind:value={liveJson}
				onfocus={() => jsonEditorFocused = true}
				onblur={handleJsonBlur}
				oninput={handleJsonInput}
				spellcheck="false"
				aria-label="Live flow JSON editor"
			></textarea>

			<p class:error={!!jsonError} class="json-status">
				{jsonError || jsonStatus}
			</p>
		</aside>
	</div>
</div>

<style>
	.demo-container {
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		color: white;
		font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
	}

	:global(.kaykay-light) .demo-container {
		background: #f5f5f5;
		color: #333;
	}

	.controls {
		padding: 1rem;
		background: #1f1f1f;
		border-bottom: 1px solid #333;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 1rem;
	}

	:global(.kaykay-light) .controls {
		background: #fff;
		border-bottom: 1px solid #ddd;
	}

	.button-group {
		display: flex;
		gap: 0.5rem;
	}

	.controls h1 {
		margin: 0;
		font-size: 1.5rem;
		flex: 1;
	}

	.controls button {
		padding: 0.5rem 1rem;
		background: #eb5425;
		border-radius: 4px;
		color: white;
		border: 1px solid #33333340;
		cursor: pointer;
		font-size: 0.9rem;
		transition: background 0.2s;
	}

	.controls button:hover {
		background: #1f1f1f;
		border: 1px solid #eb5425;
	}

	.controls button.danger {
		background: #dc2626;
	}

	.controls button.danger:hover {
		background: #b91c1c;
	}

	.hint {
		margin: 0;
		font-size: 0.85rem;
		color: #888;
	}

	:global(.kaykay-light) .hint {
		color: #666;
	}

	.playground-workspace {
		flex: 1;
		min-height: 0;
		display: flex;
		container-type: inline-size;
	}

	.canvas-wrapper {
		flex: 1;
		min-width: 0;
		position: relative;
		overflow: hidden;
	}

	.json-panel {
		width: 390px;
		box-sizing: border-box;
		padding: 14px;
		background: #161618;
		border-left: 1px solid #333;
		display: flex;
		flex-direction: column;
		gap: 12px;
		min-height: 0;
	}

	:global(.kaykay-light) .json-panel {
		background: #fff;
		border-left: 1px solid #ddd;
	}

	.json-panel-header {
		display: flex;
		gap: 12px;
		align-items: flex-start;
		justify-content: space-between;
	}

	.json-panel h2 {
		margin: 0 0 4px 0;
		font-size: 1rem;
		color: #eb5425;
	}

	.json-panel p {
		margin: 0;
		font-size: 0.78rem;
		color: #888;
		line-height: 1.4;
	}

	.json-actions {
		display: flex;
		gap: 6px;
		flex-shrink: 0;
	}

	.json-actions button {
		padding: 0.4rem 0.55rem;
		background: transparent;
		border: 1px solid #eb5425;
		border-radius: 4px;
		color: #eb5425;
		font-family: inherit;
		font-size: 0.75rem;
		cursor: pointer;
	}

	.json-actions button:hover {
		background: rgba(235, 84, 37, 0.12);
	}

	.json-editor {
		flex: 1;
		min-height: 0;
		width: 100%;
		box-sizing: border-box;
		padding: 12px;
		background: #0f0f12;
		border: 1px solid #333;
		border-radius: 6px;
		color: #dbeafe;
		font: 12px/1.55 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
		resize: none;
		outline: none;
	}

	.json-editor:focus {
		border-color: #eb5425;
		box-shadow: 0 0 0 2px rgba(235, 84, 37, 0.12);
	}

	:global(.kaykay-light) .json-editor {
		background: #f8fafc;
		border-color: #ddd;
		color: #1f2937;
	}

	.json-status {
		min-height: 1.1rem;
		color: #22c55e !important;
	}

	.json-status.error {
		color: #f87171 !important;
	}

	@container (max-width: 1400px) {
		.playground-workspace {
			flex-direction: column;
		}

		.canvas-wrapper {
			min-height: 520px;
		}

		.json-panel {
			width: 100%;
			height: 320px;
			border-left: 0;
			border-top: 1px solid #333;
		}

		:global(.kaykay-light) .json-panel {
			border-top-color: #ddd;
		}
	}

	@media (max-width: 1400px) {
		.playground-workspace {
			flex-direction: column;
		}

		.canvas-wrapper {
			min-height: 520px;
		}

		.json-panel {
			width: 100%;
			height: 320px;
			border-left: 0;
			border-top: 1px solid #333;
		}

		:global(.kaykay-light) .json-panel {
			border-top-color: #ddd;
		}
	}
</style>

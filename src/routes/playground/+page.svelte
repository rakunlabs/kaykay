<script lang="ts">
	import Canvas from '../../lib/components/Canvas.svelte';
	import type { FlowNode, FlowEdge, NodeTypes } from '../../lib/types/index.js';
	import TextNode from '../TextNode.svelte';
	import ProcessNode from '../ProcessNode.svelte';
	import OutputNode from '../OutputNode.svelte';
	import GroupNode from '../../lib/components/GroupNode.svelte';
	import Minimap from '../../lib/components/Minimap.svelte';
	import Controls from '../../lib/components/Controls.svelte';
	import StickyNoteNode from '../../lib/components/StickyNoteNode.svelte';
	import MarkdownStickyNote from './MarkdownStickyNote.svelte';
	// Additional node types
	import LabeledNode from '../examples/nodes/LabeledNode.svelte';
	import DataSourceNode from '../examples/nodes/DataSourceNode.svelte';
	import InputNode from '../examples/nodes/InputNode.svelte';
	import MultiHandleNode from '../examples/nodes/MultiHandleNode.svelte';

	// Reference to canvas component
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
		// Output group
		{
			id: 'group-2',
			type: 'group',
			position: { x: 700, y: 100 },
			width: 280,
			height: 280,
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
		// Aggregator to Output
		{
			id: 'edge-7',
			source: 'node-6',
			source_handle: 'out',
			target: 'node-7',
			target_handle: 'in',
			type: 'bezier'
		},
		// Transform directly to second output
		{
			id: 'edge-8',
			source: 'node-4',
			source_handle: 'out',
			target: 'node-8',
			target_handle: 'in',
			type: 'bezier'
		}
	]);

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
		'markdown-sticky': MarkdownStickyNote
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
	const callbacks = {
		on_node_click: (nodeId: string) => console.log('Node clicked:', nodeId),
		on_connect: (edge: FlowEdge) => {
			console.log('New connection:', edge);
			edges.push(edge);
		},
		on_delete: (nodeIds: string[], edgeIds: string[]) => {
			console.log('Deleted:', { nodeIds, edgeIds });
			nodes = nodes.filter(n => !nodeIds.includes(n.id));
			edges = edges.filter(e => !edgeIds.includes(e.id));
		}
	};

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

	// Export flow as JSON
	function exportFlow() {
		const flow = canvasRef?.getFlow();
		if (!flow) return;
		
		const data = flow.toJSON();
		const json = JSON.stringify(data, null, 2);
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

				// Load the imported data
				flow.fromJSON(data);
			} catch (err) {
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
			Copy/Paste: Ctrl+C/V (works across browser tabs!)
		</p>
	</div>
	
	<div class="canvas-wrapper">
		<Canvas bind:this={canvasRef} {nodes} {edges} {nodeTypes} {config} {callbacks} >
			<Minimap />
			<Controls />
		</Canvas>
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

	.canvas-wrapper {
		flex: 1;
		position: relative;
		overflow: hidden;
	}
</style>

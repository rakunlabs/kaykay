<script lang="ts">
	import Canvas from '../lib/components/Canvas.svelte';
	import type { FlowNode, FlowEdge, NodeTypes } from '../lib/types/index.js';
	import TextNode from './TextNode.svelte';
	import ProcessNode from './ProcessNode.svelte';
	import OutputNode from './OutputNode.svelte';
	import GroupNode from './GroupNode.svelte';
	import Minimap from '../lib/components/Minimap.svelte';

	// Reference to canvas component
	let canvasRef: ReturnType<typeof Canvas> | undefined;

	// Theme state
	let theme: 'light' | 'dark' = $state('dark');

	function toggleTheme() {
		theme = theme === 'dark' ? 'light' : 'dark';
	}

	// Define initial nodes
	let nodes: FlowNode[] = $state([
		{
			id: 'group-1',
			type: 'group',
			position: { x: 40, y: 40 },
			width: 280,
			height: 280,
			data: { label: 'Inputs', color: '#4a9eff' }
		},
		{
			id: 'node-1',
			type: 'text',
			position: { x: 60, y: 60 },
			data: { label: 'Input A', color: '#4a9eff' },
			parent_id: 'group-1'
		},
		{
			id: 'node-2',
			type: 'text',
			position: { x: 60, y: 160 },
			data: { label: 'Input B', color: '#ff6b6b' },
			parent_id: 'group-1'
		},
		{
			id: 'node-3',
			type: 'process',
			position: { x: 400, y: 140 },
			data: { operation: 'Merge', description: 'Combines two inputs' }
		},
		{
			id: 'node-4',
			type: 'output',
			position: { x: 640, y: 160 },
			data: { title: 'Result' }
		}
	]);

	// Define initial edges
	let edges: FlowEdge[] = $state([
		{
			id: 'edge-1',
			source: 'node-1',
			source_handle: 'out',
			target: 'node-3',
			target_handle: 'input-1',
			type: 'bezier'
		},
		{
			id: 'edge-2',
			source: 'node-2',
			source_handle: 'out',
			target: 'node-3',
			target_handle: 'input-2',
			type: 'bezier'
		},
		{
			id: 'edge-3',
			source: 'node-3',
			source_handle: 'output',
			target: 'node-4',
			target_handle: 'in',
			type: 'bezier'
		}
	]);

	// Register node types
	const nodeTypes: NodeTypes = {
		text: TextNode,
		process: ProcessNode,
		output: OutputNode,
		group: GroupNode
	};

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

	// Add new node function
	function addNode() {
		const flow = canvasRef?.getFlow();
		if (!flow) return;
		
		const newNode: FlowNode = {
			id: `node-${Date.now()}`,
			type: 'text',
			position: { x: 100 + Math.random() * 200, y: 100 + Math.random() * 200 },
			data: { label: `Node ${flow.nodes.length + 1}`, color: '#22c55e' }
		};
		flow.addNode(newNode);
	}

	// Add new group function
	function addGroup() {
		const flow = canvasRef?.getFlow();
		if (!flow) return;
		
		const colors = ['#4a9eff', '#22c55e', '#f59e0b', '#ec4899', '#8b5cf6'];
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

<div class="demo-container" class:light={theme === 'light'} class:dark={theme === 'dark'}>
	<input
		type="file"
		accept=".json"
		bind:this={fileInput}
		onchange={handleFileSelect}
		style="display: none"
	/>
	<div class="controls">
		<h1>kaykay - Flow Editor Demo</h1>
		<div class="button-group">
			<button onclick={addNode}>Add Node</button>
			<button onclick={addGroup}>Add Group</button>
			<button onclick={importFlow}>Import JSON</button>
			<button onclick={exportFlow}>Export JSON</button>
			<button onclick={clearFlow} class="danger">Clear All</button>
			<button onclick={toggleTheme} class="theme-toggle">
				{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
			</button>
		</div>
		<p class="hint">
			<strong>Controls:</strong> Pan: Click & drag | Zoom: Mouse wheel | 
			Connect: Drag from output to input | Delete: Select & press Delete/Backspace |
			Waypoints: Ctrl+click edge to add, Ctrl+click waypoint to delete |
			Groups: Drag nodes into/out of groups
		</p>
	</div>
	
	<div class="canvas-wrapper">
		<Canvas bind:this={canvasRef} {nodes} {edges} {nodeTypes} {config} {callbacks} >
			<Minimap />
		</Canvas>
	</div>
</div>

<style>
	.demo-container {
		width: 100vw;
		height: 100vh;
		display: flex;
		flex-direction: column;
		color: white;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
	}

	.demo-container.light {
		background: #f5f5f5;
		color: #333;
	}

	.controls {
		padding: 1rem;
		background: #1a1a2e;
		border-bottom: 1px solid #333;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 1rem;
	}

	.demo-container.light .controls {
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
		background: #4a9eff;
		color: white;
		border: none;
		cursor: pointer;
		font-size: 0.9rem;
		transition: background 0.2s;
	}

	.controls button:hover {
		background: #2d7fd3;
	}

	.controls button.danger {
		background: #dc2626;
	}

	.controls button.danger:hover {
		background: #b91c1c;
	}

	.controls button.theme-toggle {
		background: #6b7280;
	}

	.controls button.theme-toggle:hover {
		background: #4b5563;
	}

	.demo-container.light .controls button.theme-toggle {
		background: #374151;
	}

	.demo-container.light .controls button.theme-toggle:hover {
		background: #1f2937;
	}

	.hint {
		margin: 0;
		font-size: 0.85rem;
		color: #888;
	}

	.demo-container.light .hint {
		color: #666;
	}

	.canvas-wrapper {
		flex: 1;
		position: relative;
		overflow: hidden;
	}
</style>

<script lang="ts">
	import Canvas from '../../../lib/components/Canvas.svelte';
	import Controls from '../../../lib/components/Controls.svelte';
	import type { FlowNode, FlowEdge, NodeTypes } from '../../../lib/types/index.js';
	import ExampleToolbar from '../ExampleToolbar.svelte';
	import { cloneFlowEdges, cloneFlowNodes } from '../example-utils.js';
	import BlenderNode from './BlenderNode.svelte';

	interface BlenderSocket {
		id: string;
		label: string;
		port: string;
		color: string;
		shape?: 'circle' | 'square' | 'diamond' | 'triangle' | 'diagonal';
		field?: 'text' | 'number' | 'checkbox';
		value?: string | number | boolean;
		placeholder?: string;
	}

	interface BlenderNodeData {
		label: string;
		category: string;
		accent: string;
		inputs?: BlenderSocket[];
		outputs?: BlenderSocket[];
	}

	const socketColors = {
		geometry: '#76b96f',
		float: '#b4b4b4',
		integer: '#6fa8dc',
		boolean: '#d6a23a',
		vector: '#8c7ae6',
	};

	const socketShapes = {
		geometry: 'diamond' as const,
		float: 'circle' as const,
		integer: 'square' as const,
		boolean: 'triangle' as const,
		vector: 'diagonal' as const,
	};

	const initialNodes: FlowNode[] = [
		{
			id: 'group-input',
			type: 'blender',
			position: { x: 60, y: 120 },
			data: {
				label: 'Group Input',
				category: 'Interface',
				accent: '#5f7ea6',
				outputs: [
					{ id: 'geometry', label: 'Geometry', port: 'geometry', color: socketColors.geometry, shape: socketShapes.geometry },
					{ id: 'density', label: 'Density', port: 'float', color: socketColors.float, shape: socketShapes.float },
					{ id: 'selection-mask', label: 'Selection Mask', port: 'boolean', color: socketColors.boolean, shape: socketShapes.boolean },
				],
			},
		},
		{
			id: 'mesh-to-points',
			type: 'blender',
			position: { x: 350, y: 75 },
			data: {
				label: 'Mesh to Points',
				category: 'Geometry',
				accent: '#668b5b',
				inputs: [
					{ id: 'mesh', label: 'Mesh', port: 'geometry', color: socketColors.geometry, shape: socketShapes.geometry },
					{ id: 'radius', label: 'Radius', port: 'float', color: socketColors.float, shape: socketShapes.float, field: 'number', value: 0.04 },
					{ id: 'selection', label: 'Selection', port: 'boolean', color: socketColors.boolean, shape: socketShapes.boolean, field: 'checkbox', value: true },
				],
				outputs: [
					{ id: 'points', label: 'Points', port: 'geometry', color: socketColors.geometry, shape: socketShapes.geometry },
				],
			},
		},
		{
			id: 'ico-sphere',
			type: 'blender',
			position: { x: 350, y: 335 },
			data: {
				label: 'Ico Sphere',
				category: 'Mesh Primitive',
				accent: '#956d46',
				inputs: [
					{ id: 'radius', label: 'Radius', port: 'float', color: socketColors.float, shape: socketShapes.float, field: 'number', value: 0.12 },
					{ id: 'subdivisions', label: 'Subdivisions', port: 'integer', color: socketColors.integer, shape: socketShapes.integer, field: 'number', value: 2 },
				],
				outputs: [
					{ id: 'mesh', label: 'Mesh', port: 'geometry', color: socketColors.geometry, shape: socketShapes.geometry },
				],
			},
		},
		{
			id: 'instance-on-points',
			type: 'blender',
			position: { x: 675, y: 105 },
			data: {
				label: 'Instance on Points',
				category: 'Instances',
				accent: '#7b6aa6',
				inputs: [
					{ id: 'points', label: 'Points', port: 'geometry', color: socketColors.geometry, shape: socketShapes.geometry },
					{ id: 'instance', label: 'Instance', port: 'geometry', color: socketColors.geometry, shape: socketShapes.geometry },
					{ id: 'pick-instance', label: 'Pick Instance', port: 'boolean', color: socketColors.boolean, shape: socketShapes.boolean, field: 'checkbox', value: false },
					{ id: 'rotation', label: 'Rotation', port: 'vector', color: socketColors.vector, shape: socketShapes.vector, field: 'text', value: '0, 0, 0' },
					{ id: 'scale', label: 'Scale', port: 'float', color: socketColors.float, shape: socketShapes.float, field: 'number', value: 1 },
				],
				outputs: [
					{ id: 'instances', label: 'Instances', port: 'geometry', color: socketColors.geometry, shape: socketShapes.geometry },
				],
			},
		},
		{
			id: 'join-geometry',
			type: 'blender',
			position: { x: 995, y: 180 },
			data: {
				label: 'Join Geometry',
				category: 'Geometry',
				accent: '#668b5b',
				inputs: [
					{ id: 'base', label: 'Base Geometry', port: 'geometry', color: socketColors.geometry, shape: socketShapes.geometry },
					{ id: 'instances', label: 'Instances', port: 'geometry', color: socketColors.geometry, shape: socketShapes.geometry },
				],
				outputs: [
					{ id: 'geometry', label: 'Geometry', port: 'geometry', color: socketColors.geometry, shape: socketShapes.geometry },
				],
			},
		},
		{
			id: 'group-output',
			type: 'blender',
			position: { x: 1295, y: 205 },
			data: {
				label: 'Group Output',
				category: 'Interface',
				accent: '#8e5b54',
				inputs: [
					{ id: 'geometry', label: 'Geometry', port: 'geometry', color: socketColors.geometry, shape: socketShapes.geometry },
				],
			},
		},
	];

	const initialEdges: FlowEdge[] = [
		{ id: 'e1', source: 'group-input', source_handle: 'geometry', target: 'mesh-to-points', target_handle: 'mesh', color: socketColors.geometry },
		{ id: 'e2', source: 'group-input', source_handle: 'density', target: 'mesh-to-points', target_handle: 'radius', color: socketColors.float },
		{ id: 'e3', source: 'group-input', source_handle: 'selection-mask', target: 'mesh-to-points', target_handle: 'selection', color: socketColors.boolean },
		{ id: 'e4', source: 'mesh-to-points', source_handle: 'points', target: 'instance-on-points', target_handle: 'points', color: socketColors.geometry },
		{ id: 'e5', source: 'ico-sphere', source_handle: 'mesh', target: 'instance-on-points', target_handle: 'instance', color: socketColors.geometry },
		{ id: 'e6', source: 'group-input', source_handle: 'geometry', target: 'join-geometry', target_handle: 'base', color: socketColors.geometry },
		{ id: 'e7', source: 'instance-on-points', source_handle: 'instances', target: 'join-geometry', target_handle: 'instances', color: socketColors.geometry },
		{ id: 'e8', source: 'join-geometry', source_handle: 'geometry', target: 'group-output', target_handle: 'geometry', color: socketColors.geometry },
	];

	let nodes: FlowNode[] = $state(cloneFlowNodes(initialNodes));
	let edges: FlowEdge[] = $state(cloneFlowEdges(initialEdges));
	let canvasKey = $state(0);

	const nodeTypes: NodeTypes = {
		blender: BlenderNode,
	};

	const config = {
		min_zoom: 0.35,
		max_zoom: 2,
		default_edge_type: 'bezier' as const,
	};

	const callbacks = {
		on_connect: (edge: FlowEdge) => {
			edges = [...edges, edge];
		},
		on_delete: (nodeIds: string[], edgeIds: string[]) => {
			nodes = nodes.filter((node) => !nodeIds.includes(node.id));
			edges = edges.filter((edge) => !edgeIds.includes(edge.id));
		},
	};

	function resetExample(): void {
		nodes = cloneFlowNodes(initialNodes);
		edges = cloneFlowEdges(initialEdges);
		canvasKey += 1;
	}
</script>

<div class="example-page">
	<div class="example-sidebar">
		<h1>Blender Style</h1>
		<p>Geometry Nodes inspired styling with edge sockets, compact fields, collapsible headers, and horizontal resizing.</p>
		<ExampleToolbar onReset={resetExample} sourcePath="src/routes/examples/blender-style/+page.svelte" />

		<div class="section">
			<h3>Edge Sockets</h3>
			<p>Handles can be aligned to each row while sitting on the node border. kaykay measures the actual DOM position, so the edge connects to that row.</p>
			<div class="code-block">
				<pre>{`<div class="socket-row">
  <Handle
    id="points"
    type="output"
    port="geometry"
    position="right"
    class="blender-socket"
  />
  <span>Points</span>
</div>`}</pre>
			</div>
		</div>

		<div class="section">
			<h3>Fields in Nodes</h3>
			<p>Inputs can sit in the same row as a border socket. Form fields opt out of node dragging so users can edit values normally.</p>
			<ul class="feature-list">
				<li><strong>Geometry</strong> uses green diamond sockets.</li>
				<li><strong>Float</strong> uses neutral circular sockets.</li>
				<li><strong>Integer</strong> uses blue square sockets.</li>
				<li><strong>Boolean</strong> uses amber triangular sockets.</li>
				<li><strong>Vector</strong> uses purple diagonal sockets.</li>
			</ul>
		</div>

		<div class="section">
			<h3>Field Overrides</h3>
			<p>Fields like <code>Selection</code> are local fallback values. If an edge is connected, your evaluation layer should read the connected value instead of the checkbox.</p>
		</div>

		<div class="section">
			<h3>Header Controls</h3>
			<p>The title bar includes a Blender-style collapse arrow. Drag the left or right edge of a node to resize it only on the horizontal axis.</p>
		</div>

		<div class="section">
			<h3>Theme Hooks</h3>
			<div class="code-block">
				<pre>{`.blender-canvas :global(.kaykay-canvas) {
  --kaykay-canvas-bg: #1c1e22;
  --kaykay-canvas-dot-rgb: 80, 84, 94;
}

:global(.blender-socket.kaykay-handle) {
  position: relative !important;
  left: auto !important;
  width: 10px;
  height: 10px;
}`}</pre>
			</div>
		</div>

		<div class="tip">
			<strong>Try it:</strong> edit numeric fields, collapse a node from the arrow, and drag a node's left or right edge to resize it horizontally.
		</div>
	</div>

	<div class="example-canvas blender-canvas">
		{#key canvasKey}
			<Canvas {nodes} {edges} {nodeTypes} {config} {callbacks}>
				<Controls position="bottom-right" />
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
		width: 410px;
		padding: 24px;
		overflow-y: auto;
		border-right: 1px solid #15171b;
		background: #16181d;
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
		margin: 0 0 22px 0;
		color: #8f96a3;
		line-height: 1.6;
	}

	.section {
		margin-bottom: 24px;
	}

	.section h3 {
		margin: 0 0 10px 0;
		font-size: 1rem;
		color: #f6a21a;
	}

	.section p {
		margin: 0 0 12px 0;
		color: #b6bbc5;
		font-size: 0.9rem;
		line-height: 1.6;
	}

	:global(.kaykay-light) .section p,
	:global(.kaykay-light) .example-sidebar > p {
		color: #555;
	}

	.feature-list {
		margin: 0;
		padding-left: 20px;
		color: #ccd0d8;
		font-size: 0.85rem;
		line-height: 1.8;
	}

	:global(.kaykay-light) .feature-list {
		color: #555;
	}

	.code-block {
		background: #202229;
		border: 1px solid #101216;
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
		line-height: 1.6;
		color: #9cdcfe;
		white-space: pre;
	}

	:global(.kaykay-light) .code-block pre {
		color: #0969da;
	}

	.tip {
		padding: 14px 16px;
		background: rgba(246, 162, 26, 0.1);
		border: 1px solid rgba(246, 162, 26, 0.28);
		border-radius: 8px;
		color: #f3c47a;
		font-size: 0.85rem;
		line-height: 1.6;
	}

	:global(.kaykay-light) .tip {
		background: #fff7ed;
		border-color: #fed7aa;
		color: #92400e;
	}

	.example-canvas {
		flex: 1;
		min-width: 0;
	}

	.blender-canvas :global(.kaykay-canvas) {
		--kaykay-canvas-bg: #1c1e22;
		--kaykay-canvas-dot-rgb: 72, 76, 86;
	}

	.blender-canvas :global(.kaykay-edge-path) {
		stroke-width: 3px;
		filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.55));
	}

	.blender-canvas :global(.kaykay-edge.selected .kaykay-edge-path) {
		stroke-width: 4px;
		filter: brightness(1.18) drop-shadow(0 0 4px rgba(246, 162, 26, 0.35));
	}

	.blender-canvas :global(.kaykay-node.selected) {
		outline-color: #f6a21a;
	}

	@media (max-width: 1000px) {
		.example-page {
			flex-direction: column;
		}

		.example-sidebar {
			width: auto;
			max-height: 45vh;
			border-right: 0;
			border-bottom: 1px solid #15171b;
		}
	}
</style>

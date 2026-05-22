<script lang="ts">
	import { tick } from 'svelte';

	// API Reference page - documentation only, no canvas
	let searchQuery = $state('');
	let apiContent = $state<HTMLDivElement | null>(null);
	let hasApiResults = $state(true);
	const normalizedSearch = $derived(searchQuery.trim().toLowerCase());

	$effect(() => {
		const query = normalizedSearch;
		if (!apiContent) return;

		tick().then(() => {
			if (!apiContent) return;

			const entries = apiContent.querySelectorAll<HTMLElement>('.component, .type-def, .method-group');
			for (const entry of entries) {
				const text = entry.textContent?.toLowerCase() ?? '';
				entry.classList.toggle('filtered-out', query.length > 0 && !text.includes(query));
			}

			const sections = apiContent.querySelectorAll<HTMLElement>('.api-section');
			let has_visible_section = false;
			for (const section of sections) {
				const sectionEntries = section.querySelectorAll<HTMLElement>('.component, .type-def, .method-group');
				const hasVisibleEntry = Array.from(sectionEntries).some((entry) => !entry.classList.contains('filtered-out'));
				section.classList.toggle('filtered-out', query.length > 0 && sectionEntries.length > 0 && !hasVisibleEntry);
				if (!section.classList.contains('filtered-out')) has_visible_section = true;
			}

			hasApiResults = query.length === 0 || has_visible_section;
		});
	});
</script>

<div class="api-page">
	<h1>API Reference</h1>
	<p class="intro">Complete reference for kaykay components, types, and configuration.</p>
	<div class="api-search">
		<label for="api-search">Search API</label>
		<div class="api-search-row">
			<input
				id="api-search"
				type="search"
				bind:value={searchQuery}
				placeholder="Canvas, FlowState, callbacks..."
			/>
			{#if searchQuery}
				<button type="button" onclick={() => searchQuery = ''}>Clear</button>
			{/if}
		</div>
	</div>
	{#if normalizedSearch && !hasApiResults}
		<p class="no-results">No API entries matched "{searchQuery}".</p>
	{/if}

	<div class="api-content" bind:this={apiContent}>
	<section class="api-section">
		<h2>Components</h2>
		
		<div class="component">
			<h3>Canvas</h3>
			<p>The main component that renders the flow diagram.</p>
			<div class="code-block">
				<pre>{`<Canvas
  flow={savedFlow}
  nodeTypes={nodeTypes}
  callbacks={callbacks}
  config={config}
  node_statuses={nodeStatuses}
>
  {#snippet background()}
    <!-- Custom background -->
  {/snippet}
  {#snippet controls()}
    <Controls />
  {/snippet}
  {#snippet children()}
    <Minimap />
  {/snippet}
</Canvas>`}</pre>
			</div>
			<table class="props-table">
				<thead>
					<tr>
						<th>Prop</th>
						<th>Type</th>
						<th>Description</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td><code>flow</code></td>
						<td><code>Flow?</code></td>
						<td>Full serialized flow. Prefer this when loading JSON returned by <code>flow.toJSON()</code>.</td>
					</tr>
					<tr>
						<td><code>nodes</code></td>
						<td><code>FlowNode[]</code></td>
						<td>Array of node definitions</td>
					</tr>
					<tr>
						<td><code>edges</code></td>
						<td><code>FlowEdge[]</code></td>
						<td>Array of edge definitions</td>
					</tr>
					<tr>
						<td><code>nodeTypes</code></td>
						<td><code>NodeTypes</code></td>
						<td>Map of node type names to components</td>
					</tr>
					<tr>
						<td><code>callbacks</code></td>
						<td><code>FlowCallbacks</code></td>
						<td>Event callback handlers</td>
					</tr>
					<tr>
						<td><code>config</code></td>
						<td><code>FlowConfig</code></td>
						<td>Optional configuration</td>
					</tr>
					<tr>
						<td><code>node_statuses</code></td>
						<td><code>Record&lt;string, NodeStatus&gt;?</code></td>
						<td>Per-node execution status passed to custom node components</td>
					</tr>
					<tr>
						<td><code>class</code></td>
						<td><code>string?</code></td>
						<td>Additional CSS class</td>
					</tr>
					<tr>
						<td><code>background</code></td>
						<td><code>Snippet?</code></td>
						<td>Custom background snippet</td>
					</tr>
					<tr>
						<td><code>controls</code></td>
						<td><code>Snippet?</code></td>
						<td>Controls snippet (e.g., zoom controls)</td>
					</tr>
					<tr>
						<td><code>children</code></td>
						<td><code>Snippet?</code></td>
						<td>Additional children (e.g., Minimap)</td>
					</tr>
				</tbody>
			</table>
		</div>

		<div class="component">
			<h3>Canvas Instance Methods</h3>
			<p>Bind the Canvas component when you need imperative access, such as adding a node where a palette item is dropped.</p>
			<div class="code-block">
				<pre>{`let canvasRef: ReturnType<typeof Canvas> | undefined;

function handleDrop(event: DragEvent) {
  event.preventDefault();

  const position = canvasRef?.clientToCanvas(
    event.clientX,
    event.clientY
  );
  if (!position) return;

  const node: FlowNode = {
    id: crypto.randomUUID(),
    type: 'custom',
    position,
    data: { label: 'Dropped node' }
  };

  canvasRef?.getFlow().addNode(node);
}

<div ondragover={(event) => event.preventDefault()} ondrop={handleDrop}>
  <Canvas bind:this={canvasRef} {nodes} {edges} {nodeTypes} />
</div>`}</pre>
			</div>
			<table class="props-table">
				<thead>
					<tr>
						<th>Method</th>
						<th>Type</th>
						<th>Description</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td><code>getFlow()</code></td>
						<td><code>() =&gt; FlowState</code></td>
						<td>Returns the internal flow state for adding nodes, edges, viewport changes, and serialization.</td>
					</tr>
					<tr>
						<td><code>clientToCanvas()</code></td>
						<td><code>(x: number, y: number) =&gt; Position | null</code></td>
						<td>Converts browser client coordinates to canvas coordinates, including current pan and zoom.</td>
					</tr>
					<tr>
						<td><code>getViewport()</code></td>
						<td><code>() =&gt; Viewport</code></td>
						<td>Returns the current viewport values.</td>
					</tr>
					<tr>
						<td><code>getContainer()</code></td>
						<td><code>() =&gt; HTMLDivElement | null</code></td>
						<td>Returns the canvas container element for wiring native browser events.</td>
					</tr>
				</tbody>
			</table>
		</div>

		<div class="component">
			<h3>Handle</h3>
			<p>Connection point on a node for edges.</p>
			<div class="code-block">
				<pre>{`<Handle
  id="input-1"
  type="input"
  port="data"
  position="left"
  label="Input"
/>`}</pre>
			</div>
			<table class="props-table">
				<thead>
					<tr>
						<th>Prop</th>
						<th>Type</th>
						<th>Description</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td><code>id</code></td>
						<td><code>string</code></td>
						<td>Unique ID within the node</td>
					</tr>
					<tr>
						<td><code>type</code></td>
						<td><code>'input' | 'output'</code></td>
						<td>Handle direction</td>
					</tr>
					<tr>
						<td><code>port</code></td>
						<td><code>string</code></td>
						<td>Port type for connection matching</td>
					</tr>
					<tr>
						<td><code>position</code></td>
						<td><code>'left' | 'right' | 'top' | 'bottom'</code></td>
						<td>Position on the node</td>
					</tr>
					<tr>
						<td><code>label</code></td>
						<td><code>string?</code></td>
						<td>Optional label text</td>
					</tr>
					<tr>
						<td><code>accept</code></td>
						<td><code>string[]?</code></td>
						<td>Additional port types to accept</td>
					</tr>
				</tbody>
			</table>
		</div>

		<div class="component">
			<h3>HandleGroup</h3>
			<p>Groups multiple handles on one side of a node.</p>
			<div class="code-block">
				<pre>{`<HandleGroup position="left">
  <Handle id="in-1" type="input" port="data" />
  <Handle id="in-2" type="input" port="data" />
</HandleGroup>`}</pre>
			</div>
		</div>

		<div class="component">
			<h3>GroupNode</h3>
			<p>Built-in component for creating visual node groups.</p>
			<div class="code-block">
				<pre>{`import { GroupNode } from 'kaykay';

const nodeTypes = {
  group: GroupNode,
  // ... other types
};`}</pre>
			</div>
		</div>

		<div class="component">
			<h3>VirtualWireInputNode / VirtualWireOutputNode</h3>
			<p>Built-in portal nodes for reducing long edge clutter. Connect into a numbered input channel, then connect out of the matching output channel elsewhere on the canvas. No long pair edge is drawn between the two nodes. Users can rename the shared pair label, add channels from the header, rename labels inline, and delete unused channels while stable IDs remain in kaykay editor metadata.</p>
			<div class="code-block">
				<pre>{`import {
  VirtualWireInputNode,
  VirtualWireOutputNode,
  resolveVirtualWireEdges
} from 'kaykay';

const nodeTypes = {
  'virtual-wire-input': VirtualWireInputNode,
  'virtual-wire-output': VirtualWireOutputNode
};

const nodes = [
  {
    id: 'wire-in',
    type: 'virtual-wire-input',
    position: { x: 260, y: 120 },
    data: {
      pair_id: 'main-bus',
      pair_label: 'Main Bus',
      label: 'Main Bus In',
      channels: [{ id: '1', label: '1' }]
    }
  },
  {
    id: 'wire-out',
    type: 'virtual-wire-output',
    position: { x: 720, y: 120 },
    data: {
      pair_id: 'main-bus',
      pair_label: 'Main Bus',
      label: 'Main Bus Out',
      channels: [{ id: '1', label: '1' }]
    }
  }
];

// For execution/dataflow, collapse portal segments into logical direct edges.
const logicalEdges = resolveVirtualWireEdges(nodes, edges);`}</pre>
			</div>
		</div>

		<div class="component">
			<h3>Minimap</h3>
			<p>Optional minimap for navigation. Click, drag, touch, or keyboard arrows to pan viewport.</p>
			<div class="code-block">
				<pre>{`<Canvas {nodes} {edges} {nodeTypes}>
  {#snippet children()}
    <Minimap width={200} height={150} />
  {/snippet}
</Canvas>`}</pre>
			</div>
			<table class="props-table">
				<thead>
					<tr>
						<th>Prop</th>
						<th>Type</th>
						<th>Description</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td><code>width</code></td>
						<td><code>number</code></td>
						<td>Width in pixels (default: 200)</td>
					</tr>
					<tr>
						<td><code>height</code></td>
						<td><code>number</code></td>
						<td>Height in pixels (default: 150)</td>
					</tr>
					<tr>
						<td><code>backgroundColor</code></td>
						<td><code>string?</code></td>
						<td>Background color override</td>
					</tr>
					<tr>
						<td><code>nodeColor</code></td>
						<td><code>string?</code></td>
						<td>Node rectangle color override</td>
					</tr>
					<tr>
						<td><code>selectedNodeColor</code></td>
						<td><code>string?</code></td>
						<td>Selected node rectangle color override</td>
					</tr>
					<tr>
						<td><code>viewportColor</code></td>
						<td><code>string?</code></td>
						<td>Viewport indicator color override</td>
					</tr>
					<tr>
						<td><code>class</code></td>
						<td><code>string?</code></td>
						<td>Additional CSS class</td>
					</tr>
				</tbody>
			</table>
		</div>

		<div class="component">
			<h3>Controls</h3>
			<p>Zoom controls with optional fit view and lock toggle.</p>
			<div class="code-block">
				<pre>{`<Canvas {nodes} {edges} {nodeTypes}>
  {#snippet controls()}
    <Controls position="bottom-left" />
  {/snippet}
</Canvas>`}</pre>
			</div>
			<table class="props-table">
				<thead>
					<tr>
						<th>Prop</th>
						<th>Type</th>
						<th>Description</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td><code>position</code></td>
						<td><code>'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'</code></td>
						<td>Position on canvas (default: 'bottom-left')</td>
					</tr>
					<tr>
						<td><code>showZoomLevel</code></td>
						<td><code>boolean</code></td>
						<td>Show zoom percentage (default: true)</td>
					</tr>
					<tr>
						<td><code>showFitView</code></td>
						<td><code>boolean</code></td>
						<td>Show fit view button (default: true)</td>
					</tr>
					<tr>
						<td><code>showLock</code></td>
						<td><code>boolean</code></td>
						<td>Show lock toggle button (default: true)</td>
					</tr>
					<tr>
						<td><code>class</code></td>
						<td><code>string?</code></td>
						<td>Additional CSS class</td>
					</tr>
				</tbody>
			</table>
		</div>
	</section>

	<section class="api-section">
		<h2>Types</h2>

		<div class="type-def">
			<h3>FlowNode</h3>
			<div class="code-block">
				<pre>{`interface FlowNode<T = Record<string, unknown>> {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: T;
  width?: number;
  height?: number;
  selected?: boolean;
  parent_id?: string;  // For grouping
  z_index?: number;
}`}</pre>
			</div>
		</div>

		<div class="type-def">
			<h3>FlowEdge</h3>
			<div class="code-block">
				<pre>{`interface FlowEdge<T = Record<string, unknown>> {
  id: string;
  source: string;
  source_handle: string;
  target: string;
  target_handle: string;
  type?: 'bezier' | 'straight' | 'step' | string;
  style?: 'solid' | 'dashed' | 'dotted';
  color?: string;
  animated?: boolean;
  label?: string;
  waypoints?: Position[];
  data?: T;
}`}</pre>
			</div>
		</div>

		<div class="type-def">
			<h3>VirtualWireNodeData</h3>
			<div class="code-block">
				<pre>{`interface VirtualWireNodeData {
  pair_id: string;
  pair_label?: string;
  label?: string;
  color?: string;
  channels?: VirtualWireChannel[];
}

interface VirtualWireChannel {
  id: string;      // "1", "2", "3", ...
  label?: string;
  port?: string;
}`}</pre>
			</div>
		</div>

		<div class="type-def">
			<h3>NodeProps</h3>
			<div class="code-block">
				<pre>{`interface NodeProps<T = Record<string, unknown>> {
  id: string;
  data: T;
  selected: boolean;
  status?: NodeStatus;
}`}</pre>
			</div>
		</div>

		<div class="type-def">
			<h3>FlowCallbacks</h3>
			<div class="code-block">
				<pre>{`interface FlowCallbacks {
  on_node_click?: (node_id: string) => void;
  on_node_drag_start?: (node_id: string) => void;
  on_node_drag_end?: (node_id: string, position: Position) => void;
  on_connect?: (edge: FlowEdge) => void;
  on_edge_click?: (edge_id: string) => void;
  on_delete?: (node_ids: string[], edge_ids: string[]) => void;
  on_viewport_change?: (viewport: Viewport) => void;
  on_selection_change?: (node_ids: string[], edge_ids: string[]) => void;
  on_undo?: () => void;
  on_redo?: () => void;
  on_change?: (flow: Flow, reason: FlowChangeReason) => void;
}`}</pre>
			</div>
		</div>

		<div class="type-def">
			<h3>FlowConfig</h3>
			<div class="code-block">
				<pre>{`interface FlowConfig {
  min_zoom?: number;      // Default: 0.1
  max_zoom?: number;      // Default: 4
  snap_to_grid?: boolean; // Default: false
  grid_size?: number;     // Default: 10
  allow_delete?: boolean; // Default: true
  default_edge_type?: EdgeType;
  locked?: boolean;       // Prevent modifications
  max_history?: number;   // Default: 50
  max_connections_per_input?: number;
  max_connections_per_output?: number;
  prevent_cycles?: boolean;
  is_valid_connection?: (context: ConnectionValidationContext) => ConnectionValidationResult;
}`}</pre>
			</div>
		</div>
	</section>

	<section class="api-section">
		<h2>JSON Flow Model</h2>
		<p>The import/export format is plain JSON. Use it to persist a diagram, send it to an API, or power an editor like the Playground live JSON panel.</p>

		<div class="type-def">
			<h3>Flow</h3>
			<p><code>Flow</code> is the complete serialized diagram returned by <code>flow.toJSON()</code> and accepted by <code>flow.fromJSON()</code>.</p>
			<div class="code-block">
				<pre>{`interface Flow {
  nodes: FlowNode[];
  edges: FlowEdge[];
}

const json = canvasRef.getFlow().toJSON();
canvasRef.getFlow().fromJSON(json);`}</pre>
			</div>
		</div>

		<div class="type-def">
			<h3>Example JSON</h3>
			<div class="code-block">
				<pre>{`{
  "nodes": [
    {
      "id": "source",
      "type": "input",
      "position": { "x": 80, "y": 120 },
      "data": { "label": "Source" }
    },
    {
      "id": "group-a",
      "type": "group",
      "position": { "x": 40, "y": 60 },
      "width": 320,
      "height": 220,
      "data": { "label": "Processing" }
    },
    {
      "id": "transform",
      "type": "process",
      "position": { "x": 40, "y": 70 },
      "parent_id": "group-a",
      "data": { "operation": "Transform" }
    }
  ],
  "edges": [
    {
      "id": "source-transform",
      "source": "source",
      "source_handle": "out",
      "target": "transform",
      "target_handle": "in",
      "type": "bezier",
      "label": "raw data",
      "style": "dashed",
      "animated": true,
      "color": "#eb5425",
      "waypoints": [{ "x": 220, "y": 150 }],
      "data": { "schema": "raw-event" }
    }
  ]
}`}</pre>
			</div>
		</div>

		<div class="type-def">
			<h3>Node JSON</h3>
			<table class="props-table">
				<thead>
					<tr>
						<th>Field</th>
						<th>Type</th>
						<th>Description</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td><code>id</code></td>
						<td><code>string</code></td>
						<td>Stable node identifier. Edges reference this value.</td>
					</tr>
					<tr>
						<td><code>type</code></td>
						<td><code>string</code></td>
						<td>Looks up the renderer in <code>nodeTypes</code>, for example <code>process</code> or <code>group</code>.</td>
					</tr>
					<tr>
						<td><code>position</code></td>
						<td><code>Position</code></td>
						<td>Canvas coordinates. If <code>parent_id</code> is set, the position is relative to that parent group.</td>
					</tr>
					<tr>
						<td><code>data</code></td>
						<td><code>Record&lt;string, unknown&gt;</code></td>
						<td>Custom serializable payload passed to the node component as <code>data</code>.</td>
					</tr>
					<tr>
						<td><code>width</code> / <code>height</code></td>
						<td><code>number?</code></td>
						<td>Optional fixed dimensions. Useful for groups, sticky notes, and resizable nodes.</td>
					</tr>
					<tr>
						<td><code>parent_id</code></td>
						<td><code>string?</code></td>
						<td>Places a node inside a group node. Invalid or cyclic parent references are removed during load.</td>
					</tr>
					<tr>
						<td><code>z_index</code></td>
						<td><code>number?</code></td>
						<td>Optional drawing order override.</td>
					</tr>
				</tbody>
			</table>
		</div>

		<div class="type-def">
			<h3>Edge JSON</h3>
			<table class="props-table">
				<thead>
					<tr>
						<th>Field</th>
						<th>Type</th>
						<th>Description</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td><code>source</code> / <code>target</code></td>
						<td><code>string</code></td>
						<td>Node IDs connected by the edge. Edges with missing nodes are ignored during load.</td>
					</tr>
					<tr>
						<td><code>source_handle</code> / <code>target_handle</code></td>
						<td><code>string</code></td>
						<td>Handle IDs on the source and target nodes.</td>
					</tr>
					<tr>
						<td><code>type</code></td>
						<td><code>EdgeType?</code></td>
						<td>Built-in path type or a custom key registered in <code>edgeTypes</code>.</td>
					</tr>
					<tr>
						<td><code>label</code></td>
						<td><code>string?</code></td>
						<td>Optional rendered label.</td>
					</tr>
					<tr>
						<td><code>style</code> / <code>animated</code> / <code>color</code></td>
						<td><code>EdgeStyle?</code> / <code>boolean?</code> / <code>string?</code></td>
						<td>Visual styling for built-in edge rendering.</td>
					</tr>
					<tr>
						<td><code>waypoints</code></td>
						<td><code>Position[]?</code></td>
						<td>Intermediate routing points for manually shaped edges.</td>
					</tr>
					<tr>
						<td><code>data</code></td>
						<td><code>Record&lt;string, unknown&gt;?</code></td>
						<td>Custom serializable payload passed to custom edge components.</td>
					</tr>
				</tbody>
			</table>
		</div>

		<div class="type-def">
			<h3>Handles and Ports</h3>
			<p>Handles are declared by node components, not stored on each node JSON object. Edges store the selected handle IDs, while <code>port</code> and <code>accept</code> on <code>&lt;Handle&gt;</code> control whether a new connection is valid.</p>
			<div class="code-block">
				<pre>{`<Handle id="out" type="output" port="text" position="right" />
<Handle id="in" type="input" port="processed" accept={["text"]} position="left" />

{
  "source": "source",
  "source_handle": "out",
  "target": "transform",
  "target_handle": "in"
}`}</pre>
			</div>
		</div>

		<div class="type-def">
			<h3>Viewport JSON</h3>
			<p><code>Viewport</code> is runtime pan/zoom state. It is available through viewport APIs, but it is not included in <code>Flow</code> serialization.</p>
			<div class="code-block">
				<pre>{`interface Viewport {
  x: number;
  y: number;
  zoom: number;
}

const viewport = canvasRef.getViewport();
canvasRef.getFlow().setViewport(viewport);`}</pre>
			</div>
		</div>

		<div class="method-group">
			<h3>Import and Export Notes</h3>
			<ul class="feature-list">
				<li><code>toJSON()</code> returns cloned node and edge data so callers can safely stringify or store it.</li>
				<li><code>fromJSON()</code> normalizes invalid nodes, duplicate IDs, dangling edges, and cyclic group parents before loading.</li>
				<li>Only serializable values should be stored in <code>node.data</code> and <code>edge.data</code>.</li>
				<li>Custom node and edge type names must still be registered in <code>nodeTypes</code> and <code>edgeTypes</code> when the JSON is loaded.</li>
			</ul>
		</div>

		<div class="method-group">
			<h3>Virtual Wire Resolution</h3>
			<p><code>flow.toJSON()</code> stores virtual wires as backend-compatible direct edges in <code>nodes</code>/<code>edges</code>. New kaykay UIs restore the portal nodes from <code>kaykay.virtual_wires</code> metadata during <code>fromJSON()</code>; older engines can ignore that key.</p>
			<ul class="feature-list">
				<li>Use the <code>flow</code> prop for initial load or <code>flow.fromJSON(json)</code> after mount to restore the portal UI from the full <code>Flow</code>.</li>
				<li>Passing only <code>json.nodes</code> and <code>json.edges</code> to <code>&lt;Canvas&gt;</code> intentionally renders the backend-compatible direct-edge fallback because top-level metadata is unavailable.</li>
				<li>During <code>fromJSON()</code>, current direct edges are the source of truth. If an older tool deletes or retargets a flattened direct edge, kaykay mirrors that change instead of restoring stale portal connections.</li>
				<li>Resolved direct edges store kaykay details at <code>edge.data.kaykay_virtual_wire</code>; engines that do not need editor details can ignore unknown <code>edge.data</code> keys.</li>
			</ul>
			<div class="code-block">
				<pre>{`const serialized = flow.toJSON();
// serialized.nodes has no virtual-wire nodes.
// serialized.edges has source -> target direct edges.
// serialized.kaykay.virtual_wires lets kaykay restore the editor portal view.

// source -> virtual input 1 + virtual output 1 -> target
// is saved as source -> target for dataflow/execution.`}</pre>
			</div>
		</div>
	</section>

	<section class="api-section">
		<h2>Flow State Methods</h2>
		<p>Access the flow state via <code>canvas.getFlow()</code>:</p>
		
		<div class="method-group">
			<h3>Node Operations</h3>
			<div class="code-block">
				<pre>{`flow.addNode(node: FlowNode): string
flow.removeNode(nodeId: string): void
flow.getNode(nodeId: string): NodeState | undefined
flow.updateNodePosition(nodeId: string, position: Position): void
flow.updateNodeData(nodeId: string, data: Partial<T>): void
flow.updateNodeDimensions(nodeId: string, width: number, height: number): void
flow.resizeNode(nodeId: string, width: number, height: number): void
flow.getChildNodes(parentId: string): NodeState[]
flow.getAbsolutePosition(nodeId: string): Position
flow.setNodeParent(nodeId: string, parentId: string | undefined): void
flow.updateGroupMembership(groupId: string): void`}</pre>
			</div>
		</div>

		<div class="method-group">
			<h3>Edge Operations</h3>
			<div class="code-block">
				<pre>{`flow.addEdge(edge: FlowEdge): boolean
flow.removeEdge(edgeId: string): void
flow.getEdge(edgeId: string): FlowEdge | undefined
flow.updateEdge(edgeId: string, updates: Partial<FlowEdge>): void
flow.canConnect(sourceNodeId: string, sourceHandleId: string, targetNodeId: string, targetHandleId: string): boolean
flow.getConnectionValidation(sourceNodeId: string, sourceHandleId: string, targetNodeId: string, targetHandleId: string): { valid: boolean; reason?: string }
flow.canConnectPorts(sourcePort: string, targetPort: string, targetAccept?: string[]): boolean

// Waypoints for custom edge routing
flow.addEdgeWaypoint(edgeId: string, position: Position, index?: number): void
flow.updateEdgeWaypoint(edgeId: string, waypointIndex: number, position: Position): void
flow.removeEdgeWaypoint(edgeId: string, waypointIndex: number): void
flow.clearEdgeWaypoints(edgeId: string): void`}</pre>
			</div>
		</div>

		<div class="method-group">
			<h3>Selection</h3>
			<div class="code-block">
				<pre>{`flow.selectNode(nodeId: string, additive?: boolean): void
flow.selectEdge(edgeId: string, additive?: boolean): void
flow.selectAll(): void
flow.clearSelection(): void
flow.deleteSelected(): void

// Read selected IDs
flow.selected_node_ids: Set<string>
flow.selected_edge_ids: Set<string>`}</pre>
			</div>
		</div>

		<div class="method-group">
			<h3>Viewport</h3>
			<div class="code-block">
				<pre>{`flow.setViewport(viewport: Viewport): void
flow.pan(dx: number, dy: number): void
flow.zoom(delta: number, center: Position): void
flow.zoomIn(step?: number): void
flow.zoomOut(step?: number): void
flow.resetZoom(): void
flow.setZoom(zoom: number): void
flow.fitView(padding?: number): void
flow.screenToCanvas(screenPos: Position): Position
flow.canvasToScreen(canvasPos: Position): Position

// Read viewport state
flow.viewport: Viewport  // { x, y, zoom }`}</pre>
			</div>
		</div>

		<div class="method-group">
			<h3>Lock State</h3>
			<div class="code-block">
				<pre>{`flow.locked: boolean        // Read lock state
flow.setLocked(locked: boolean): void
flow.toggleLocked(): void`}</pre>
			</div>
		</div>

		<div class="method-group">
			<h3>Handle Operations</h3>
			<div class="code-block">
				<pre>{`flow.getHandle(nodeId: string, handleId: string): HandleState | undefined
flow.getHandlePosition(nodeId: string, handleId: string): Position | undefined`}</pre>
			</div>
		</div>

		<div class="method-group">
			<h3>History and Clipboard</h3>
			<div class="code-block">
				<pre>{`flow.undo(): boolean
flow.redo(): boolean
flow.canUndo: boolean
flow.canRedo: boolean
flow.clearHistory(): void
flow.beginTransaction(): void
flow.endTransaction(commit?: boolean, reason?: FlowChangeReason): void
flow.copySelected(): void
flow.paste(position?: Position, clipboardData?: { nodes: FlowNode[]; edges: FlowEdge[] }): void`}</pre>
			</div>
		</div>

		<div class="method-group">
			<h3>Import/Export</h3>
			<div class="code-block">
				<pre>{`const json: Flow = flow.toJSON()
flow.fromJSON(json: Flow): void`}</pre>
			</div>
		</div>
	</section>
	</div>
</div>

<style>
	.api-page {
		padding: 32px;
		max-width: 900px;
		margin: 0 auto;
		color: #ccc;
	}

	:global(.kaykay-light) .api-page {
		color: #333;
	}

	h1 {
		margin: 0 0 8px 0;
		font-size: 2rem;
	}

	.intro {
		margin: 0 0 32px 0;
		color: #888;
		font-size: 1.1rem;
	}

	.api-search {
		position: sticky;
		top: 0;
		z-index: 5;
		margin: 0 0 32px 0;
		padding: 14px;
		background: rgba(22, 22, 24, 0.92);
		border: 1px solid #1f1f1f;
		border-radius: 10px;
		backdrop-filter: blur(10px);
	}

	:global(.kaykay-light) .api-search {
		background: rgba(255, 255, 255, 0.92);
		border-color: #e0e0e0;
	}

	.api-search label {
		display: block;
		margin-bottom: 8px;
		color: #888;
		font-size: 0.8rem;
		text-transform: uppercase;
		letter-spacing: 0.08em;
	}

	.api-search-row {
		display: flex;
		gap: 8px;
	}

	.api-search input {
		flex: 1;
		min-width: 0;
		padding: 11px 12px;
		background: #1f1f1f;
		border: 1px solid #252422;
		border-radius: 7px;
		color: #fff;
		font-family: inherit;
	}

	.api-search button {
		padding: 0 12px;
		background: #eb5425;
		border: 1px solid #eb5425;
		border-radius: 7px;
		color: #fff;
		font-family: inherit;
		font-weight: 700;
		cursor: pointer;
	}

	:global(.kaykay-light) .api-search input {
		background: #f5f5f5;
		border-color: #e0e0e0;
		color: #333;
	}

	:global(.filtered-out) {
		display: none !important;
	}

	.no-results {
		margin: -12px 0 32px 0;
		padding: 14px 16px;
		background: rgba(235, 84, 37, 0.1);
		border: 1px solid rgba(235, 84, 37, 0.3);
		border-radius: 8px;
		color: #f6a21a;
	}

	.api-section {
		margin-bottom: 48px;
	}

	.api-section > h2 {
		font-size: 1.5rem;
		margin: 0 0 24px 0;
		padding-bottom: 8px;
		border-bottom: 1px solid #1f1f1f;
		color: #eb5425;
	}

	:global(.kaykay-light) .api-section > h2 {
		border-color: #e0e0e0;
	}

	.component,
	.type-def,
	.method-group {
		margin-bottom: 32px;
	}

	.component h3,
	.type-def h3,
	.method-group h3 {
		font-size: 1.2rem;
		margin: 0 0 8px 0;
		color: #fff;
	}

	:global(.kaykay-light) .component h3,
	:global(.kaykay-light) .type-def h3,
	:global(.kaykay-light) .method-group h3 {
		color: #333;
	}

	.component > p,
	.type-def > p,
	.api-section > p {
		margin: 0 0 16px 0;
		color: #aaa;
	}

	:global(.kaykay-light) .component > p,
	:global(.kaykay-light) .type-def > p,
	:global(.kaykay-light) .api-section > p {
		color: #666;
	}

	.feature-list {
		margin: 0;
		padding-left: 20px;
		color: #aaa;
		line-height: 1.7;
	}

	:global(.kaykay-light) .feature-list {
		color: #666;
	}

	.code-block {
		background: #1f1f1f;
		border: 1px solid #1f1f1f;
		border-radius: 8px;
		padding: 16px;
		margin-bottom: 16px;
		overflow-x: auto;
		scrollbar-width: thin;
		scrollbar-color: rgba(120, 120, 120, 0.46) rgba(255, 255, 255, 0.03);
	}

	.code-block::-webkit-scrollbar {
		width: 6px;
		height: 6px;
	}

	.code-block::-webkit-scrollbar-track {
		background: rgba(255, 255, 255, 0.03);
		border-radius: 999px;
	}

	.code-block::-webkit-scrollbar-thumb {
		background: rgba(120, 120, 120, 0.46);
		border: 1px solid transparent;
		border-radius: 999px;
		background-clip: padding-box;
	}

	.code-block::-webkit-scrollbar-thumb:hover {
		background: rgba(150, 150, 150, 0.68);
		background-clip: padding-box;
	}

	:global(.kaykay-light) .code-block {
		background: #1f1f1f;
		border-color: #e0e0e0;
		scrollbar-color: rgba(82, 82, 82, 0.46) rgba(255, 255, 255, 0.06);
	}

	:global(.kaykay-light) .code-block::-webkit-scrollbar-track {
		background: rgba(255, 255, 255, 0.06);
	}

	:global(.kaykay-light) .code-block::-webkit-scrollbar-thumb {
		background: rgba(82, 82, 82, 0.46);
		background-clip: padding-box;
	}

	:global(.kaykay-light) .code-block::-webkit-scrollbar-thumb:hover {
		background: rgba(82, 82, 82, 0.68);
		background-clip: padding-box;
	}

	.code-block pre {
		margin: 0;
		font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
		font-size: 0.85rem;
		color: #a5d6ff;
		white-space: pre;
	}

	:global(.kaykay-light) .code-block pre {
		color: #fff;
	}

	.props-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.9rem;
	}

	.props-table th,
	.props-table td {
		padding: 12px;
		text-align: left;
		border-bottom: 1px solid #1f1f1f;
	}

	:global(.kaykay-light) .props-table th,
	:global(.kaykay-light) .props-table td {
		border-color: #e0e0e0;
	}

	.props-table th {
		color: #888;
		font-weight: 500;
	}

	.props-table td:first-child {
		color: #f59e0b;
	}

	.props-table td:nth-child(2) {
		color: #22c55e;
		font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
		font-size: 0.85rem;
	}

	.props-table code {
		background: #161618;
		padding: 2px 6px;
		border-radius: 4px;
	}

	:global(.kaykay-light) .props-table code {
		background: #1f1f1f;
	}
</style>

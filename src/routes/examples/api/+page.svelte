<script lang="ts">
	// API Reference page - documentation only, no canvas
</script>

<div class="api-page">
	<h1>API Reference</h1>
	<p class="intro">Complete reference for kaykay components, types, and configuration.</p>

	<section class="api-section">
		<h2>Components</h2>
		
		<div class="component">
			<h3>Canvas</h3>
			<p>The main component that renders the flow diagram.</p>
			<div class="code-block">
				<pre>{`<Canvas
  nodes={nodes}
  edges={edges}
  nodeTypes={nodeTypes}
  callbacks={callbacks}
  config={config}
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
			<h3>Minimap</h3>
			<p>Optional minimap for navigation. Click or drag to pan viewport.</p>
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
				<pre>{`interface FlowEdge {
  id: string;
  source: string;
  source_handle: string;
  target: string;
  target_handle: string;
  type?: 'bezier' | 'straight' | 'step';
  style?: 'solid' | 'dashed' | 'dotted';
  color?: string;
  animated?: boolean;
  label?: string;
  waypoints?: Position[];
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
  grid_size?: number;     // Default: 20
  allow_delete?: boolean; // Default: true
  default_edge_type?: EdgeType;
  locked?: boolean;       // Prevent modifications
}`}</pre>
			</div>
		</div>
	</section>

	<section class="api-section">
		<h2>Flow State Methods</h2>
		<p>Access the flow state via <code>canvas.getFlow()</code>:</p>
		
		<div class="method-group">
			<h3>Node Operations</h3>
			<div class="code-block">
				<pre>{`flow.addNode(node: FlowNode): void
flow.removeNode(nodeId: string): void
flow.getNode(nodeId: string): NodeState | undefined
flow.updateNodePosition(nodeId: string, position: Position): void
flow.updateNodeData(nodeId: string, data: Partial<T>): void
flow.updateNodeDimensions(nodeId: string, width: number, height: number): void
flow.getChildNodes(parentId: string): NodeState[]
flow.getAbsolutePosition(nodeId: string): Position
flow.setNodeParent(nodeId: string, parentId: string | undefined): void`}</pre>
			</div>
		</div>

		<div class="method-group">
			<h3>Edge Operations</h3>
			<div class="code-block">
				<pre>{`flow.addEdge(edge: FlowEdge): boolean
flow.removeEdge(edgeId: string): void
flow.getEdge(edgeId: string): FlowEdge | undefined
flow.updateEdge(edgeId: string, updates: Partial<FlowEdge>): void

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
			<h3>Import/Export</h3>
			<div class="code-block">
				<pre>{`const json: Flow = flow.toJSON()
flow.fromJSON(json: Flow): void`}</pre>
			</div>
		</div>
	</section>
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
	.api-section > p {
		margin: 0 0 16px 0;
		color: #aaa;
	}

	:global(.kaykay-light) .component > p,
	:global(.kaykay-light) .api-section > p {
		color: #666;
	}

	.code-block {
		background: #1f1f1f;
		border: 1px solid #1f1f1f;
		border-radius: 8px;
		padding: 16px;
		margin-bottom: 16px;
		overflow-x: auto;
	}

	:global(.kaykay-light) .code-block {
		background: #1f1f1f;
		border-color: #e0e0e0;
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

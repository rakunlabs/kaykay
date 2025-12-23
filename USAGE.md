# kaykay Usage Example

This example demonstrates how to use the kaykay flow editor library in your Svelte 5 application.

## File Structure

```
src/routes/
├── +page.svelte       # Main demo page with Canvas setup
├── TextNode.svelte    # Example custom node component
├── ProcessNode.svelte # Example node with multiple inputs
└── OutputNode.svelte  # Example terminal node
```

## Creating Custom Nodes

Custom nodes are Svelte components that receive `NodeProps`:

```typescript
interface NodeProps<T = Record<string, unknown>> {
  id: string;        // Unique node identifier
  data: T;           // Custom data for your node
  selected: boolean; // Whether the node is currently selected
}
```

Example node component:

```svelte
<script lang="ts">
  import Handle from 'kaykay';
  import type { NodeProps } from 'kaykay';

  let { id, data, selected }: NodeProps<{ label: string }> = $props();
</script>

<div class="my-node">
  <h3>{data.label}</h3>
  <Handle id="in" type="input" port="data" position="left" />
  <Handle id="out" type="output" port="data" position="right" />
</div>
```

## Handle Configuration

Handles define connection points on nodes:

- `id` - Unique identifier within the node
- `type` - Either "input" or "output"
- `port` - Port type name (e.g., "data", "signal", "raw")
- `position` - Where to place the handle: "left", "right", "top", "bottom"
- `accept` - (Optional) Array of port types an input can accept
- `label` - (Optional) Display label for the handle

## HandleGroup Component

Use `HandleGroup` to group multiple handles on the same side of a node. Handles inside a group automatically inherit the group's position and are evenly spaced:

```svelte
<script lang="ts">
  import { Handle, HandleGroup } from 'kaykay';
</script>

<div class="my-node">
  <HandleGroup position="left">
    <Handle id="in-1" type="input" port="data" label="Input 1" />
    <Handle id="in-2" type="input" port="data" label="Input 2" />
  </HandleGroup>
  
  <Handle id="out" type="output" port="data" position="right" />
</div>
```

## Port Type Validation

Connections are validated based on port types:

```svelte
<!-- This output only connects to inputs with port="data" -->
<Handle id="out" type="output" port="data" position="right" />

<!-- This input accepts both "data" and "processed" ports -->
<Handle id="in" type="input" port="data" accept={["data", "processed"]} position="left" />
```

## Canvas Setup

```svelte
<script lang="ts">
  import { Canvas } from 'kaykay';
  import type { FlowNode, FlowEdge, NodeTypes } from 'kaykay';
  import MyNode from './MyNode.svelte';

  // Define nodes with positions and data
  let nodes: FlowNode[] = $state([
    {
      id: 'node-1',
      type: 'custom',
      position: { x: 100, y: 100 },
      data: { label: 'My Node' }
    }
  ]);

  // Define edges between nodes
  let edges: FlowEdge[] = $state([]);

  // Register your custom node components
  const nodeTypes: NodeTypes = {
    custom: MyNode
  };

  // Optional configuration
  const config = {
    min_zoom: 0.5,
    max_zoom: 2,
    snap_to_grid: false,
    allow_delete: true,
    default_edge_type: 'bezier'
  };

  // Optional callbacks
  const callbacks = {
    on_connect: (edge) => {
      edges.push(edge); // Add new connections to your state
    },
    on_delete: (nodeIds, edgeIds) => {
      nodes = nodes.filter(n => !nodeIds.includes(n.id));
      edges = edges.filter(e => !edgeIds.includes(e.id));
    }
  };
</script>

<Canvas {nodes} {edges} {nodeTypes} {config} {callbacks} />
```

## User Interactions

The Canvas provides these built-in interactions:

- **Pan**: Click and drag on empty space (or middle mouse button)
- **Zoom**: Mouse wheel
- **Select**: Click on nodes or edges (Shift+click for multi-select)
- **Delete**: Select items and press Delete or Backspace
- **Connect**: Click and drag from an output handle to an input handle
- **Move Nodes**: Click and drag nodes
- **Edge Waypoints**: Ctrl+click on an edge to add a waypoint, drag waypoints to reposition, right-click to remove

## Styling Custom Nodes

Use global styles or scoped styles in your node components. Selected nodes automatically get a selection indicator from the Canvas.

```css
:global(.kaykay-node.selected .my-node) {
  border-color: #4a9eff;
  box-shadow: 0 0 0 2px #4a9eff;
}
```

## Data Flow

The library uses Svelte 5's `$state` runes for reactivity. Update your nodes and edges arrays directly:

```typescript
// Add a new node
nodes.push(newNode);

// Update node data
const node = nodes.find(n => n.id === 'node-1');
if (node) {
  node.data = { ...node.data, label: 'Updated' };
}

// Remove an edge
edges = edges.filter(e => e.id !== 'edge-1');
```

## Edge Waypoints

Edges support waypoints for routing around obstacles. Waypoints can be added interactively or programmatically:

```typescript
// Define edges with waypoints
let edges: FlowEdge[] = $state([
  {
    id: 'edge-1',
    source: 'node-1',
    source_handle: 'out',
    target: 'node-2',
    target_handle: 'in',
    waypoints: [
      { x: 250, y: 150 },
      { x: 250, y: 300 }
    ]
  }
]);
```

Waypoints can also be managed programmatically via the flow state:

```typescript
const flow = canvasRef?.getFlow();

// Add waypoint at the end
flow.addEdgeWaypoint('edge-1', { x: 200, y: 150 });

// Add waypoint at specific index
flow.addEdgeWaypoint('edge-1', { x: 200, y: 150 }, 0);

// Update waypoint position
flow.updateEdgeWaypoint('edge-1', 0, { x: 220, y: 160 });

// Remove a waypoint
flow.removeEdgeWaypoint('edge-1', 0);

// Clear all waypoints from an edge
flow.clearEdgeWaypoints('edge-1');
```

## Testing Your Implementation

1. Run `pnpm dev` to start the development server
2. Open http://localhost:5173
3. Try interacting with the flow:
   - Drag nodes around
   - Create connections between compatible handles
   - Zoom and pan the canvas
   - Select and delete nodes

## Next Steps

- Customize node appearance with your own styling
- Add more node types for different operations
- Implement port type validation for your use case
- Add custom callbacks for node/edge events
- Export/import flow data as JSON

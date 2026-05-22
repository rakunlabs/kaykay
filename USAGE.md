# kaykay Usage Example

This example demonstrates how to use the kaykay flow editor library in your Svelte 5 application.

## File Structure

```
src/routes/
├── +page.svelte           # Landing/About page
├── +layout.svelte         # App layout with sidebar navigation
├── playground/
│   └── +page.svelte       # Interactive demo/playground
├── examples/
│   ├── getting-started/   # Getting started guide
│   ├── basic-nodes/       # Basic node examples
│   ├── drag-drop/         # Palette drag-and-drop example
│   ├── connections/       # Edge/connection examples
│   ├── groups/            # Group node examples
│   ├── styling/           # Styling examples
│   ├── state-history/     # Undo/redo, clipboard, status, and JSON examples
│   ├── blender-style/     # Blender Geometry Nodes-inspired theme
│   ├── touch/             # Touch support examples
│   ├── api/               # API reference
│   └── nodes/             # Shared custom node components
├── TextNode.svelte        # Example custom node component
├── ProcessNode.svelte     # Example node with multiple inputs
└── OutputNode.svelte      # Example terminal node
```

## Creating Custom Nodes

Custom nodes are Svelte components that receive `NodeProps`:

```typescript
interface NodeProps<T = Record<string, unknown>> {
  id: string;        // Unique node identifier
  data: T;           // Custom data for your node
  selected: boolean; // Whether the node is currently selected
  status?: NodeStatus; // Optional execution status
}
```

Example node component:

```svelte
<script lang="ts">
  import { Handle } from 'kaykay';
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

## GroupNode Component

kaykay provides a built-in `GroupNode` component for creating visual groups that can contain other nodes. Groups support:

- Resizable boundaries (drag the corner handle)
- Editable labels (double-click to edit)
- Custom colors (right-click for color picker)
- Automatic parent-child relationships (drag nodes into/out of groups)

```svelte
<script lang="ts">
  import { Canvas, GroupNode } from 'kaykay';
  import type { FlowNode, NodeTypes } from 'kaykay';

  let nodes: FlowNode[] = $state([
    {
      id: 'group-1',
      type: 'group',
      position: { x: 50, y: 50 },
      width: 300,
      height: 200,
      data: { label: 'My Group', color: '#eb5425' }
    },
    {
      id: 'node-1',
      type: 'custom',
      position: { x: 70, y: 80 },
      data: { label: 'Child Node' },
      parent_id: 'group-1'  // Makes this node a child of the group
    }
  ]);

  const nodeTypes: NodeTypes = {
    group: GroupNode,
    custom: MyCustomNode
  };
</script>

<Canvas {nodes} {edges} {nodeTypes} />
```

Group nodes use the following data properties:
- `label` - Display name shown above the group
- `color` - Border and label color (also tints the background)

## Virtual Wire Nodes

Use `VirtualWireInputNode` and `VirtualWireOutputNode` to make a long or crowded connection behave like a portal. The canvas shows only local edges into and out of the portal nodes; it does not draw a long cable between the pair.

Portal nodes share the same `pair_id`. Channel `1` on the input maps to channel `1` on every matching output portal, channel `2` maps to channel `2`, and so on. You can place multiple `VirtualWireOutputNode` instances with the same `pair_id` to fan one input channel out to multiple distant targets. Users can edit the shared pair display name, add channels from the header `+`, rename channel labels inline, and delete unused channels. Pair and channel IDs stay stable in kaykay editor metadata while labels are user-editable.

```svelte
<script lang="ts">
  import {
    Canvas,
    VirtualWireInputNode,
    VirtualWireOutputNode,
    resolveVirtualWireEdges
  } from 'kaykay';
  import type { FlowEdge, FlowNode, NodeTypes } from 'kaykay';

  let nodes: FlowNode[] = $state([
    { id: 'source', type: 'custom', position: { x: 60, y: 120 }, data: { label: 'Source' } },
    {
      id: 'wire-in',
      type: 'virtual-wire-input',
      position: { x: 280, y: 120 },
      data: { pair_id: 'bus-a', pair_label: 'Bus A', label: 'Bus In', channels: [{ id: '1', label: '1' }] }
    },
    {
      id: 'wire-out-a',
      type: 'virtual-wire-output',
      position: { x: 720, y: 120 },
      data: { pair_id: 'bus-a', pair_label: 'Bus A', label: 'Bus Out', channels: [{ id: '1', label: '1' }] }
    },
    {
      id: 'wire-out-b',
      type: 'virtual-wire-output',
      position: { x: 720, y: 240 },
      data: { pair_id: 'bus-a', pair_label: 'Bus A', label: 'Bus Out Mirror', channels: [{ id: '1', label: '1' }] }
    },
    { id: 'target-a', type: 'custom', position: { x: 940, y: 120 }, data: { label: 'Target A' } },
    { id: 'target-b', type: 'custom', position: { x: 940, y: 240 }, data: { label: 'Target B' } }
  ]);

  let edges: FlowEdge[] = $state([
    { id: 'source-wire', source: 'source', source_handle: 'out', target: 'wire-in', target_handle: 'in-1' },
    { id: 'wire-target-a', source: 'wire-out-a', source_handle: 'out-1', target: 'target-a', target_handle: 'in' },
    { id: 'wire-target-b', source: 'wire-out-b', source_handle: 'out-1', target: 'target-b', target_handle: 'in' }
  ]);

  const nodeTypes: NodeTypes = {
    custom: MyCustomNode,
    'virtual-wire-input': VirtualWireInputNode,
    'virtual-wire-output': VirtualWireOutputNode
  };

  $effect(() => {
    const logicalEdges = resolveVirtualWireEdges(nodes, edges);
    // logicalEdges contains source -> target-a and source -> target-b.
  });
</script>

<Canvas {nodes} {edges} {nodeTypes} />
```

`flow.toJSON()` serializes virtual wires as backend-compatible direct edges in `nodes` and `edges`, with the editor-only portal details under `kaykay.virtual_wires`. Older backends and UIs can ignore the `kaykay` key and execute/render the direct edge. New kaykay UIs restore the virtual wire nodes from that metadata.

Compatibility notes:

- To restore the portal UI from saved JSON, pass the full saved flow to `<Canvas flow={json}>` for initial load or call `flow.fromJSON(json)` after mount. Passing only `json.nodes` and `json.edges` to `<Canvas>` intentionally renders the backend-compatible direct edges because the top-level `kaykay` metadata is not available.
- During `fromJSON()`, current direct edges are the source of truth. If an older tool deletes or retargets a flattened direct edge, kaykay mirrors that change instead of restoring stale portal connections.
- Resolved direct edges use namespaced metadata at `edge.data.kaykay_virtual_wire`; consumers should ignore unknown `edge.data` keys unless they explicitly need kaykay editor details.

Virtual wire data properties:

- `pair_id` - Shared ID linking input and output portal nodes; multiple outputs with the same ID create fan-out
- `pair_label` - Optional shared display name shown in the header; does not affect pairing
- `channels` - Numbered channel definitions, e.g. `{ id: '1', label: '1' }`
- `label` - Optional title shown in the node
- `color` - Optional accent color shared by the pair

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

## Drag & Drop Node Palette

Canvas exposes helpers that make native HTML drag-and-drop work with pan and zoom. Use `clientToCanvas` to convert the drop event's browser coordinates into a node position, then add the node through `getFlow()`.

```svelte
<script lang="ts">
  import { Canvas } from 'kaykay';
  import type { FlowNode } from 'kaykay';

  let canvasRef: ReturnType<typeof Canvas> | undefined;

  function handleDragStart(event: DragEvent, type: string) {
    event.dataTransfer?.setData('application/x-kaykay-node', type);
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault();

    const type = event.dataTransfer?.getData('application/x-kaykay-node');
    const position = canvasRef?.clientToCanvas(event.clientX, event.clientY);
    if (!type || !position) return;

    const node: FlowNode = {
      id: crypto.randomUUID(),
      type,
      position,
      data: { label: 'Dropped node' }
    };

    canvasRef?.getFlow().addNode(node);
  }
</script>

<button draggable="true" ondragstart={(event) => handleDragStart(event, 'custom')}>
  Custom Node
</button>

<div ondragover={(event) => event.preventDefault()} ondrop={handleDrop}>
  <Canvas bind:this={canvasRef} {nodes} {edges} {nodeTypes} />
</div>
```

## User Interactions

The Canvas provides these built-in interactions:

- **Pan**: Click and drag on empty space, middle mouse button, or normal wheel/trackpad scroll
- **Zoom**: Ctrl/Meta + mouse wheel
- **Select**: Click on nodes or edges (Shift+click for multi-select)
- **Selection Rectangle**: Ctrl/Meta+drag empty space to toggle nodes, Shift+drag to add, Alt+drag to subtract
- **Delete**: Select items and press Delete or Backspace
- **Connect**: Click and drag from an output handle to an input handle
- **Move Nodes**: Click and drag nodes
- **Edge Waypoints**: Ctrl/Meta+click on an edge to add a waypoint, drag waypoints to reposition, Ctrl/Meta+click a waypoint to remove it

## Custom Edges

Register custom edge components with `edgeTypes`. Custom edge components receive `EdgeProps` including source/target positions, handles, the computed SVG path, selection state, and `onselect`.

```svelte
<script lang="ts">
  import { BaseEdge, type EdgeProps } from 'kaykay';

  let { path, selected, edge, label_position, onselect }: EdgeProps<{ tone?: string }> = $props();
</script>

<BaseEdge
  {path}
  {selected}
  label={edge.label}
  {label_position}
  color={edge.data?.tone ?? '#3b82f6'}
  onclick={(event) => {
    event.stopPropagation();
    onselect();
  }}
/>
```

```svelte
<Canvas {nodes} {edges} {nodeTypes} edgeTypes={{ custom: CustomEdge }} />
```

Set an edge's `type` to the key registered in `edgeTypes`:

```typescript
const edges = [
  {
    id: 'custom-edge',
    source: 'a',
    source_handle: 'out',
    target: 'b',
    target_handle: 'in',
    type: 'custom',
    data: { tone: '#f97316' }
  }
];
```

Selected built-in edges also expose reconnect anchors. Drag either endpoint to another compatible handle to reconnect the existing edge.

## Overlay Components

Use `Panel` for fixed canvas UI, `ViewportPortal` for content that moves and scales with the flow coordinate system, and `Background` for custom grid variants.

```svelte
<script lang="ts">
  import { Background, Canvas, Controls, Panel, ViewportPortal } from 'kaykay';

  let canvasRef: ReturnType<typeof Canvas> | undefined;
</script>

<Canvas bind:this={canvasRef} {nodes} {edges} {nodeTypes}>
  <Background variant="lines" color="rgba(59, 130, 246, 0.2)" />
  <Panel position="top-right">
    <button onclick={() => canvasRef?.getFlow().fitView()}>Fit</button>
  </Panel>
  <ViewportPortal target="front">
    <div style="position: absolute; transform: translate(100px, 100px); pointer-events: auto;">
      Viewport overlay
    </div>
  </ViewportPortal>
  <Controls />
</Canvas>
```

## Generic Node Resizer

Add `NodeResizer` inside any custom node component. It automatically finds the parent kaykay node if `node_id` is omitted.

```svelte
<script lang="ts">
  import { Handle, NodeResizer, type NodeProps } from 'kaykay';

  let { selected, data }: NodeProps<{ label: string }> = $props();
</script>

<div class="resizable-node">
  <NodeResizer is_visible={selected} min_width={120} min_height={80} />
  <strong>{data.label}</strong>
  <Handle id="in" type="input" port="data" position="left" />
  <Handle id="out" type="output" port="data" position="right" />
</div>
```

## Graph Utilities

kaykay exports utility helpers for common graph operations:

```typescript
import {
  getConnectedEdges,
  getIncomers,
  getNodesBounds,
  getOutgoers,
  getViewportForBounds,
  isEdge,
  isNode,
  resolveVirtualWireEdges
} from 'kaykay';
```

## Interaction Configuration

Use `FlowConfig` toggles to customize editing behavior:

```typescript
const config = {
  nodes_draggable: true,
  nodes_connectable: true,
  elements_selectable: true,
  selection_on_drag: false,
  pan_on_drag: true,
  pan_on_scroll: true,
  zoom_on_scroll: false,
  nodes_focusable: true
};
```

## Styling Custom Nodes

Use global styles or scoped styles in your node components. Selected nodes automatically get a selection indicator from the Canvas.

```css
:global(.kaykay-node.selected .my-node) {
  border-color: #eb5425;
  box-shadow: 0 0 0 2px #eb5425;
}
```

## Blender-Style Edge Sockets

Handles can be aligned with node rows while sitting on the node border. This is useful for Blender Geometry Nodes-style UIs where each label or field has a matching input/output socket.

```svelte
<div class="node-row">
  <Handle id="radius" type="input" port="float" position="left" class="inline-socket">
    <span class="circle-socket"></span>
  </Handle>
  <span>Radius</span>
  <input type="number" value="0.05" data-kaykay-no-drag />
</div>

<style>
  :global(.inline-socket.kaykay-handle) {
    position: relative !important;
    left: auto !important;
    right: auto !important;
    top: auto !important;
    margin: 0 !important;
    width: 10px;
    height: 10px;
  }

  .circle-socket {
    width: 10px;
    height: 10px;
    border-radius: 999px;
    background: #b4b4b4;
  }
</style>
```

Use the `Handle` children snippet to draw custom socket shapes such as circles, squares, diamonds, triangles, or diagonal markers.

Use `data-kaykay-no-drag` on form controls or custom interactive elements inside nodes so users can edit values without starting a node drag.

Fields are usually fallback values. For example, a `Selection` checkbox can be used when nothing is connected; if a boolean edge is connected to that socket, your flow evaluation should use the connected input value instead. kaykay stores and validates the graph, but your application decides how connected values override local fields.

For Blender-like behavior, add a small button in the title bar for collapse/expand and resize handles on the left/right edges. Resize width only; keep height controlled by the content.

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

## CSS Color Variables

kaykay exposes CSS custom properties (variables) for theming. Set these on a parent element or `:root` to customize colors:

### Canvas

```css
:root {
  --kaykay-canvas-bg: #f5f5f5;             /* Canvas background color */
  --kaykay-canvas-dot-rgb: 204, 204, 204;  /* Grid dot color (RGB values) */
}
```

Note: Use `kaykay-dark` class on the canvas or a parent element for dark mode. Use `kaykay-light` class for light mode (default).

### Nodes

```css
:root {
  --kaykay-node-selected-outline: #eb5425; /* Selection outline color */
}
```

### Handles

```css
:root {
  /* Base handle colors */
  --kaykay-handle-bg: #555;                /* Default handle background */
  --kaykay-handle-border: #888;            /* Default handle border */
  
  /* Input handle colors */
  --kaykay-handle-input-bg: #fff;          /* Input handle background */
  --kaykay-handle-input-border: #999;      /* Input handle border */
  
  /* Output handle colors */
  --kaykay-handle-output-bg: #fff;         /* Output handle background */
  --kaykay-handle-output-border: #999;     /* Output handle border */
  
  /* Connection states */
  --kaykay-handle-can-connect-bg: #4ade80;     /* Compatible handle background */
  --kaykay-handle-can-connect-border: #22c55e; /* Compatible handle border */
  --kaykay-handle-can-connect-shadow: #4ade80; /* Compatible handle glow */
  --kaykay-handle-incompatible-bg: #666;       /* Incompatible handle background */
  --kaykay-handle-incompatible-border: #444;   /* Incompatible handle border */
  --kaykay-handle-connecting-bg: #fbbf24;      /* Active connection handle background */
  --kaykay-handle-connecting-border: #f59e0b;  /* Active connection handle border */
  
  /* Labels */
  --kaykay-handle-letter-color: #333;      /* Handle letter color */
  --kaykay-handle-label-color: #888;       /* Handle label text color */
  --kaykay-handle-label-bg: #fff;          /* Handle label background */
}
```

### Minimap

```css
:root {
  --kaykay-minimap-bg: rgba(0, 0, 0, 0.8);           /* Background color */
  --kaykay-minimap-node: #eb5425;                    /* Node color */
  --kaykay-minimap-viewport: rgba(74, 158, 255, 0.3); /* Viewport indicator */
  --kaykay-minimap-border: rgba(255, 255, 255, 0.1); /* Border color */
  --kaykay-minimap-border-hover: rgba(255, 255, 255, 0.3); /* Border color on hover */
}
```

### Edges

```css
:root {
  --kaykay-edge-stroke: #888;              /* Edge line color */
  --kaykay-edge-label: #888;               /* Edge label text color */
}
```

### Waypoints

```css
:root {
  --kaykay-waypoint-fill: #fff;            /* Waypoint fill color */
  --kaykay-waypoint-stroke: #888;          /* Waypoint border color */
  --kaykay-waypoint-hover-fill: #eb5425;   /* Waypoint fill on hover */
  --kaykay-waypoint-hover-stroke: #2563eb; /* Waypoint border on hover */
  --kaykay-waypoint-dragging-fill: #fbbf24; /* Waypoint fill while dragging */
  --kaykay-waypoint-dragging-stroke: #f59e0b; /* Waypoint border while dragging */
  --kaykay-waypoint-selected-stroke: #eb5425; /* Waypoint border when edge is selected */
}
```

### Draft Edge (connection in progress)

```css
:root {
  --kaykay-draft-edge-stroke: #ff6b6b;     /* Draft edge color while connecting */
}
```

### Group Node

```css
:root {
  --kaykay-group-bg: rgba(100, 100, 120, 0.1);  /* Group background */
  --kaykay-group-border: #666;                   /* Group border color */
  --kaykay-group-label-color: #888;              /* Group label text color */
  --kaykay-group-label-bg: #252422;              /* Group label background */
  --kaykay-group-resize-handle: #666;            /* Resize handle color */
  --kaykay-group-resize-handle-hover: #eb5425;   /* Resize handle hover color */
  --kaykay-group-menu-bg: #1e1e1e;               /* Context menu background */
  --kaykay-group-menu-border: #333;              /* Context menu border */
  --kaykay-group-menu-label: #888;               /* Context menu label color */
}
```

### Example: Custom Theme

```css
:root {
  /* Canvas */
  --kaykay-canvas-bg: #252422;
  --kaykay-canvas-dot-rgb: 80, 80, 120;
  
  /* Handles */
  --kaykay-handle-input-bg: #e0e0e0;
  --kaykay-handle-output-bg: #e0e0e0;
  --kaykay-handle-can-connect-bg: #10b981;
  --kaykay-handle-can-connect-border: #059669;
  --kaykay-handle-label-color: #a0a0a0;
  --kaykay-handle-label-bg: #2a2a3a;
  
  /* Minimap */
  --kaykay-minimap-bg: rgba(30, 30, 50, 0.9);
  --kaykay-minimap-node: #60a5fa;
  --kaykay-minimap-viewport: rgba(96, 165, 250, 0.2);
  
  /* Edges */
  --kaykay-edge-stroke: #666;
  --kaykay-edge-label: #999;
  --kaykay-waypoint-fill: #2a2a3a;
  --kaykay-waypoint-stroke: #666;
  --kaykay-draft-edge-stroke: #f87171;
  
  /* Nodes */
  --kaykay-node-selected-outline: #60a5fa;
}
```

### Dark/Light Mode

kaykay components use light mode by default. Control the theme using CSS classes:

```html
<!-- Dark mode on all kaykay components -->
<div class="kaykay-dark">
  <Canvas {nodes} {edges} {nodeTypes} />
</div>

<!-- Light mode (default, explicit) -->
<div class="kaykay-light">
  <Canvas {nodes} {edges} {nodeTypes} />
</div>

<!-- Apply directly to Canvas -->
<Canvas class="kaykay-dark" {nodes} {edges} {nodeTypes} />
```

## Next Steps

- Customize node appearance with your own styling
- Add more node types for different operations
- Implement port type validation for your use case
- Add custom callbacks for node/edge events
- Export/import flow data as JSON

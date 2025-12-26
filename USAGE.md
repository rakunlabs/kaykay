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
      data: { label: 'My Group', color: '#4a9eff' }
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
  --kaykay-node-selected-outline: #4a9eff; /* Selection outline color */
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
  --kaykay-minimap-node: #4a9eff;                    /* Node color */
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
  --kaykay-waypoint-hover-fill: #4a9eff;   /* Waypoint fill on hover */
  --kaykay-waypoint-hover-stroke: #2563eb; /* Waypoint border on hover */
  --kaykay-waypoint-dragging-fill: #fbbf24; /* Waypoint fill while dragging */
  --kaykay-waypoint-dragging-stroke: #f59e0b; /* Waypoint border while dragging */
  --kaykay-waypoint-selected-stroke: #4a9eff; /* Waypoint border when edge is selected */
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
  --kaykay-group-label-bg: #1a1a2e;              /* Group label background */
  --kaykay-group-resize-handle: #666;            /* Resize handle color */
  --kaykay-group-resize-handle-hover: #4a9eff;   /* Resize handle hover color */
  --kaykay-group-menu-bg: #1e1e1e;               /* Context menu background */
  --kaykay-group-menu-border: #333;              /* Context menu border */
  --kaykay-group-menu-label: #888;               /* Context menu label color */
}
```

### Example: Custom Theme

```css
:root {
  /* Canvas */
  --kaykay-canvas-bg: #1a1a2e;
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

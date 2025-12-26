<img align="left" height="72" src="static/kaykay.png">

# kaykay

A Svelte 5 flow/node editor library with typed port connections.

## Features

- **Custom Nodes**: Define your own node components
- **Typed Ports**: Custom port types (e.g., `raw`, `processed`) with connection validation
- **Visual Connections**: Bezier curve edges between handles
- **Pan/Zoom**: Navigate large flows with mouse wheel and drag
- **Selection**: Click to select nodes/edges, Delete to remove
- **JSON Export**: Get the flow structure as JSON

## Installation

```bash
pnpm add kaykay
```

## Quick Start

Check out the [interactive playground](/playground) for a complete working example!

```svelte
<script lang="ts">
  import { Canvas, Handle, type NodeProps, type FlowNode } from 'kaykay';

  // Define a custom node component
  const MyNode = {
    // ... your Svelte component with Handles
  };

  const nodeTypes = { custom: MyNode };
  
  const nodes: FlowNode[] = [
    { id: '1', type: 'custom', position: { x: 0, y: 0 }, data: { label: 'Hello' } },
  ];
</script>

<Canvas {nodes} {nodeTypes} />
```

### Running the Demo

```bash
pnpm install
pnpm dev
```

Then open http://localhost:5173 to see:
- **Landing page** at `/` with installation and feature overview
- **Interactive playground** at `/playground` with custom nodes and full demo
- **Documentation** with getting started guide, examples, and API reference

## Port Types

Handles have a `port` prop that defines what types of connections they accept:

```svelte
<!-- Only connects to handles with port="raw" -->
<Handle id="in" type="input" port="raw" />

<!-- Accepts multiple port types -->
<Handle id="in" type="input" port="data" accept={["raw", "processed"]} />
```

## License

MIT

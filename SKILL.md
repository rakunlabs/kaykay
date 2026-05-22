---
name: kaykay
description: Use when building a Svelte 5 flow editor with kaykay: Canvas, custom nodes, typed handles, edges, Flow JSON, virtual wires, and backend-compatible serialization.
---

# kaykay Skill

kaykay is a Svelte 5 flow/node editor library. Use it when an app needs a visual canvas with draggable nodes, typed input/output handles, connectable edges, pan/zoom, selection, history, JSON import/export, and optional portal-style virtual wires.

This skill is written for agents that may not have the kaykay source repository. It explains how to use the published package from an application.

## Install

kaykay has no runtime dependencies. `svelte` is a peer dependency.

```bash
pnpm add kaykay
```

Use it in a Svelte 5 app.

## Minimal Canvas

Register every node `type` with a Svelte component through `nodeTypes`.

```svelte
<script lang="ts">
  import { Canvas } from 'kaykay';
  import type { FlowEdge, FlowNode, NodeTypes } from 'kaykay';
  import MyNode from './MyNode.svelte';

  const nodes: FlowNode[] = [
    {
      id: 'source',
      type: 'custom',
      position: { x: 80, y: 120 },
      data: { label: 'Source' }
    },
    {
      id: 'target',
      type: 'custom',
      position: { x: 420, y: 120 },
      data: { label: 'Target' }
    }
  ];

  const edges: FlowEdge[] = [
    {
      id: 'source-target',
      source: 'source',
      source_handle: 'out',
      target: 'target',
      target_handle: 'in'
    }
  ];

  const nodeTypes: NodeTypes = {
    custom: MyNode
  };
</script>

<Canvas {nodes} {edges} {nodeTypes} />
```

## Custom Nodes And Handles

Custom node components receive `NodeProps<T>`. Add `Handle` components inside the node to define connection points.

```svelte
<script lang="ts">
  import { Handle } from 'kaykay';
  import type { NodeProps } from 'kaykay';

  interface Data {
    label: string;
  }

  let { data, selected }: NodeProps<Data> = $props();
</script>

<div class:selected class="my-node">
  <Handle id="in" type="input" port="text" position="left" />
  <strong>{data.label}</strong>
  <Handle id="out" type="output" port="text" position="right" />
</div>
```

Handle basics:

- `id`: unique within the node.
- `type`: `input` or `output`.
- `port`: semantic data type, such as `text`, `number`, `image`, or `*`.
- `accept`: optional input-side list of accepted source port types.
- `position`: `left`, `right`, `top`, or `bottom`.

## Flow JSON Shape

kaykay stores a flow as plain JSON:

```ts
interface Flow {
  nodes: FlowNode[];
  edges: FlowEdge[];
  kaykay?: KaykayFlowMetadata;
}
```

Common node fields:

```ts
interface FlowNode<T = Record<string, unknown>> {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: T;
  width?: number;
  height?: number;
  parent_id?: string;
  z_index?: number;
}
```

Common edge fields:

```ts
interface FlowEdge<T = Record<string, unknown>> {
  id: string;
  source: string;
  source_handle: string;
  target: string;
  target_handle: string;
  type?: 'bezier' | 'straight' | 'step' | string;
  label?: string;
  data?: T;
}
```

Only put serializable data in `node.data` and `edge.data`.

## Loading And Saving

Use the full `flow` prop when loading a value previously returned by `flow.toJSON()`.

```svelte
<Canvas flow={savedFlow} {nodeTypes} />
```

Use `nodes` and `edges` when the app intentionally provides a direct graph without kaykay editor metadata.

```svelte
<Canvas {nodes} {edges} {nodeTypes} />
```

For imperative access, bind the canvas and use `getFlow()`.

```svelte
<script lang="ts">
  import { Canvas } from 'kaykay';
  import type { Flow } from 'kaykay';

  let canvasRef: ReturnType<typeof Canvas> | undefined;

  function save(): Flow | null {
    return canvasRef?.getFlow().toJSON() ?? null;
  }

  function load(flow: Flow): void {
    canvasRef?.getFlow().fromJSON(flow);
  }
</script>

<Canvas bind:this={canvasRef} {nodes} {edges} {nodeTypes} />
```

`toJSON()` returns cloned JSON safe to stringify. `fromJSON()` normalizes invalid nodes, duplicate IDs, dangling edges, and cyclic group parents.

## Adding Nodes And Edges Programmatically

```ts
const flow = canvasRef.getFlow();

flow.addNode({
  id: 'new-node',
  type: 'custom',
  position: { x: 160, y: 180 },
  data: { label: 'New Node' }
});

flow.addEdge({
  id: 'new-edge',
  source: 'new-node',
  source_handle: 'out',
  target: 'target',
  target_handle: 'in'
});
```

Useful `FlowState` methods include `addNode`, `removeNode`, `updateNodeData`, `addEdge`, `removeEdge`, `updateEdge`, `toJSON`, `fromJSON`, `fitView`, `setViewport`, `undo`, and `redo`.

## Connection Validation

Use typed ports to prevent invalid connections. Exact matches connect by default. Inputs can accept additional types with `accept`.

```svelte
<Handle id="out" type="output" port="text" position="right" />
<Handle id="in" type="input" port="text" accept={['markdown']} position="left" />
```

Use config for global validation behavior:

```svelte
<Canvas
  {nodes}
  {edges}
  {nodeTypes}
  config={{
    prevent_cycles: true,
    max_connections_per_input: 1,
    is_valid_connection: ({ source_handle, target_handle }) => {
      if (source_handle.port === 'debug' && target_handle.port !== 'debug') {
        return 'Debug output can only connect to debug input';
      }
      return true;
    }
  }}
/>
```

## Callbacks

Use callbacks to synchronize app state or react to user actions.

```ts
const callbacks = {
  on_connect: (edge) => {
    console.log('Connected', edge);
  },
  on_change: (flow, reason) => {
    localStorage.setItem('flow', JSON.stringify(flow));
  },
  on_delete: (node_ids, edge_ids) => {
    console.log('Deleted', { node_ids, edge_ids });
  }
};
```

```svelte
<Canvas {nodes} {edges} {nodeTypes} {callbacks} />
```

## Virtual Wires

Virtual wires are portal nodes that reduce long edge clutter. A `virtual-wire-input` and a `virtual-wire-output` with the same `pair_id` behave like a hidden cable. Channel `1` maps to channel `1`, channel `2` maps to channel `2`, and so on.

```svelte
<script lang="ts">
  import {
    Canvas,
    VirtualWireInputNode,
    VirtualWireOutputNode
  } from 'kaykay';
  import type { FlowEdge, FlowNode, NodeTypes } from 'kaykay';
  import MyNode from './MyNode.svelte';

  const nodes: FlowNode[] = [
    { id: 'source', type: 'custom', position: { x: 60, y: 120 }, data: { label: 'Source' } },
    {
      id: 'wire-in',
      type: 'virtual-wire-input',
      position: { x: 300, y: 120 },
      data: { pair_id: 'bus-a', pair_label: 'Bus A', channels: [{ id: '1', label: '1' }] }
    },
    {
      id: 'wire-out',
      type: 'virtual-wire-output',
      position: { x: 620, y: 120 },
      data: { pair_id: 'bus-a', pair_label: 'Bus A', channels: [{ id: '1', label: '1' }] }
    },
    { id: 'target', type: 'custom', position: { x: 880, y: 120 }, data: { label: 'Target' } }
  ];

  const edges: FlowEdge[] = [
    { id: 'source-wire', source: 'source', source_handle: 'out', target: 'wire-in', target_handle: 'in-1' },
    { id: 'wire-target', source: 'wire-out', source_handle: 'out-1', target: 'target', target_handle: 'in' }
  ];

  const nodeTypes: NodeTypes = {
    custom: MyNode,
    'virtual-wire-input': VirtualWireInputNode,
    'virtual-wire-output': VirtualWireOutputNode
  };
</script>

<Canvas {nodes} {edges} {nodeTypes} />
```

Virtual wire serialization is backend-compatible:

- `toJSON()` saves completed virtual wire paths as direct `source -> target` edges in top-level `edges`.
- kaykay editor details are kept in top-level `kaykay.virtual_wires`.
- Direct resolved edges include `edge.data.kaykay_virtual_wire` metadata.
- Backends and older UIs can ignore `kaykay` and unknown `edge.data` keys.
- New UIs should load the full saved flow with `<Canvas flow={savedFlow}>` or `flow.fromJSON(savedFlow)` to restore portal nodes.
- If an older tool deletes or retargets the flattened direct edge, kaykay treats that direct edge as the source of truth when hydrating.

## Backend Execution Guidance

For execution engines, read only top-level `nodes` and `edges` from `flow.toJSON()` unless the engine explicitly needs kaykay editor metadata.

```ts
const executable = canvasRef.getFlow().toJSON();
sendToBackend({
  nodes: executable.nodes,
  edges: executable.edges
});
```

Backend engines should tolerate unknown keys, especially `flow.kaykay` and `edge.data.kaykay_virtual_wire`.

## Styling And Theme

Wrap the canvas or app with theme classes when needed:

```svelte
<div class="kaykay-dark">
  <Canvas {nodes} {edges} {nodeTypes} />
</div>
```

Custom nodes can use normal component CSS. Use stable handle IDs because saved edges reference `source_handle` and `target_handle` by ID.

## Common Mistakes

- Do not forget to register each node `type` in `nodeTypes`.
- Do not use `nodes` and `edges` alone when loading a full saved flow if you want virtual wire portal UI restored; use the `flow` prop or `fromJSON()`.
- Do not store functions, classes, DOM nodes, or non-serializable values in `node.data` or `edge.data`.
- Do not rename handle IDs casually; saved edges reference handle IDs.
- Do not assume every backend understands kaykay editor metadata; keep execution logic based on top-level `nodes` and `edges`.

## If You Are Editing kaykay Itself

If the agent has the kaykay source repository and is contributing to the package, also read `AGENTS.md` for repo-specific commands, style rules, and file layout.

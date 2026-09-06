export const quick_start_files = {
	'App.svelte': `<script lang="ts">
  import { Canvas } from 'kaykay';
  import type { FlowEdge, FlowNode, NodeTypes } from 'kaykay';
  import CustomNode from './CustomNode.svelte';

  const nodeTypes: NodeTypes = { custom: CustomNode };
  const nodes: FlowNode[] = [
    { id: 'source', type: 'custom', position: { x: 30, y: 80 },
      data: { label: 'Hello' } },
    { id: 'target', type: 'custom', position: { x: 250, y: 80 },
      data: { label: 'Svelte' } }
  ];
  const edges: FlowEdge[] = [{
    id: 'hello-svelte',
    source: 'source', source_handle: 'out',
    target: 'target', target_handle: 'in',
    color: '#806000',
    animated: true,
    animation: { pattern: 'dots', color: '#FFDC58', speed: 48 }
  }];
</script>

<div class="editor">
  <Canvas {nodes} {edges} {nodeTypes} />
</div>

<style>
  .editor { height: 360px; }
</style>`,
	'CustomNode.svelte': `<script lang="ts">
  import { Handle } from 'kaykay';
  import type { NodeProps } from 'kaykay';

  let { data }: NodeProps<{ label: string }> = $props();
</script>

<div class="custom-node">
  <Handle id="in" type="input" port="data" position="left" />
  <strong>{data.label}</strong>
  <Handle id="out" type="output" port="data" position="right" />
</div>

<style>
  .custom-node {
    min-width: 100px;
    padding: 16px;
    border: 1px solid #806000;
    border-radius: 6px;
    background: #fff;
    color: #202020;
    font: 14px system-ui, sans-serif;
  }
</style>`,
};

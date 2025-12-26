<script lang="ts">
	import Canvas from '../../../lib/components/Canvas.svelte';
	import type { FlowNode, FlowEdge, NodeTypes } from '../../../lib/types/index.js';
	import SimpleNode from '../nodes/SimpleNode.svelte';

	// Example nodes for the preview
	const nodes: FlowNode[] = [
		{ id: 'node-1', type: 'simple', position: { x: 100, y: 80 }, data: { label: 'Input' } },
		{ id: 'node-2', type: 'simple', position: { x: 350, y: 80 }, data: { label: 'Process' } },
		{ id: 'node-3', type: 'simple', position: { x: 600, y: 80 }, data: { label: 'Output' } }
	];

	const edges: FlowEdge[] = [
		{ id: 'e1', source: 'node-1', source_handle: 'out', target: 'node-2', target_handle: 'in' },
		{ id: 'e2', source: 'node-2', source_handle: 'out', target: 'node-3', target_handle: 'in' }
	];

	const nodeTypes: NodeTypes = {
		simple: SimpleNode
	};

	// Track current section
	let currentSection = $state(1);
</script>

<div class="docs-page">
	<div class="docs-sidebar">
		<div class="docs-header">
			<h1>Getting Started</h1>
			<p>Learn how to install kaykay and create your first flow diagram.</p>
		</div>

		<nav class="docs-nav">
			<button class:active={currentSection === 1} onclick={() => currentSection = 1}>
				1. Installation
			</button>
			<button class:active={currentSection === 2} onclick={() => currentSection = 2}>
				2. Create a Node
			</button>
			<button class:active={currentSection === 3} onclick={() => currentSection = 3}>
				3. Set Up Canvas
			</button>
			<button class:active={currentSection === 4} onclick={() => currentSection = 4}>
				4. Add Edges
			</button>
		</nav>

		<div class="docs-content">
			{#if currentSection === 1}
				<section>
					<h2>Installation</h2>
					<p>Install kaykay using your preferred package manager:</p>
					
					<div class="code-block">
						<div class="code-header">Terminal</div>
						<pre><code class="language-bash"># Using pnpm
pnpm add kaykay

# Using npm
npm install kaykay

# Using yarn
yarn add kaykay</code></pre>
					</div>

					<p>kaykay requires Svelte 5 as a peer dependency.</p>
				</section>

			{:else if currentSection === 2}
				<section>
					<h2>Create a Custom Node</h2>
					<p>Nodes are Svelte components. Create a new file for your custom node:</p>
					
					<div class="code-block">
						<div class="code-header">MyNode.svelte</div>
						<pre><code class="language-svelte">&lt;script lang="ts"&gt;
  import {"{"} Handle {"}"} from 'kaykay';
  import type {"{"} NodeProps {"}"} from 'kaykay';

  let {"{"} data {"}"}: NodeProps&lt;{"{"} label: string {"}"}&gt; = $props();
&lt;/script&gt;

&lt;div class="my-node"&gt;
  &lt;span&gt;{"{"}data.label{"}"}&lt;/span&gt;
  
  &lt;Handle 
    id="in" 
    type="input" 
    port="data" 
    position="left" 
  /&gt;
  &lt;Handle 
    id="out" 
    type="output" 
    port="data" 
    position="right" 
  /&gt;
&lt;/div&gt;

&lt;style&gt;
  .my-node {"{"}
    background: #1f1f1f;
    border: 2px solid #eb5425;
    border-radius: 4px;
    padding: 16px 24px;
    color: #fff;
  {"}"}
&lt;/style&gt;</code></pre>
					</div>

					<div class="info-box">
						<strong>Handle Props:</strong>
						<ul>
							<li><code>id</code> - Unique identifier for the handle</li>
							<li><code>type</code> - "input" or "output"</li>
							<li><code>port</code> - Port type for connection validation</li>
							<li><code>position</code> - "left", "right", "top", or "bottom"</li>
						</ul>
					</div>
				</section>

			{:else if currentSection === 3}
				<section>
					<h2>Set Up the Canvas</h2>
					<p>Import your node and set up the Canvas component:</p>
					
					<div class="code-block">
						<div class="code-header">+page.svelte</div>
						<pre><code class="language-svelte">&lt;script lang="ts"&gt;
  import {"{"} Canvas {"}"} from 'kaykay';
  import type {"{"} FlowNode, FlowEdge, NodeTypes {"}"} from 'kaykay';
  import MyNode from './MyNode.svelte';

  // Define your nodes
  const nodes: FlowNode[] = [
    {"{"}
      id: 'node-1',
      type: 'custom',
      position: {"{"} x: 100, y: 100 {"}"},
      data: {"{"} label: 'Hello' {"}"}
    {"}"},
    {"{"}
      id: 'node-2',
      type: 'custom',
      position: {"{"} x: 350, y: 100 {"}"},
      data: {"{"} label: 'World' {"}"}
    {"}"}
  ];

  // Register node types
  const nodeTypes: NodeTypes = {"{"}
    custom: MyNode
  {"}"};
&lt;/script&gt;

&lt;Canvas {"{"}nodes{"}"} {"{"}nodeTypes{"}"} /&gt;</code></pre>
					</div>

					<div class="info-box">
						<strong>Node Properties:</strong>
						<ul>
							<li><code>id</code> - Unique identifier</li>
							<li><code>type</code> - Must match a key in nodeTypes</li>
							<li><code>position</code> - x, y coordinates</li>
							<li><code>data</code> - Custom data passed to component</li>
						</ul>
					</div>
				</section>

			{:else if currentSection === 4}
				<section>
					<h2>Add Edges (Connections)</h2>
					<p>Define edges to connect nodes together:</p>
					
					<div class="code-block">
						<div class="code-header">+page.svelte</div>
						<pre><code class="language-svelte">&lt;script lang="ts"&gt;
  import {"{"} Canvas {"}"} from 'kaykay';
  import type {"{"} FlowNode, FlowEdge, NodeTypes {"}"} from 'kaykay';
  import MyNode from './MyNode.svelte';

  const nodes: FlowNode[] = [
    {"{"} id: 'node-1', type: 'custom', position: {"{"} x: 100, y: 80 {"}"}, data: {"{"} label: 'Input' {"}"} {"}"},
    {"{"} id: 'node-2', type: 'custom', position: {"{"} x: 350, y: 80 {"}"}, data: {"{"} label: 'Process' {"}"} {"}"},
    {"{"} id: 'node-3', type: 'custom', position: {"{"} x: 600, y: 80 {"}"}, data: {"{"} label: 'Output' {"}"} {"}"}
  ];

  // Define edges between nodes
  const edges: FlowEdge[] = [
    {"{"}
      id: 'e1',
      source: 'node-1',
      source_handle: 'out',
      target: 'node-2',
      target_handle: 'in'
    {"}"},
    {"{"}
      id: 'e2',
      source: 'node-2',
      source_handle: 'out',
      target: 'node-3',
      target_handle: 'in'
    {"}"}
  ];

  const nodeTypes: NodeTypes = {"{"}
    custom: MyNode
  {"}"};
&lt;/script&gt;

&lt;Canvas {"{"}nodes{"}"} {"{"}edges{"}"} {"{"}nodeTypes{"}"} /&gt;</code></pre>
					</div>

					<div class="info-box">
						<strong>Edge Properties:</strong>
						<ul>
							<li><code>id</code> - Unique identifier</li>
							<li><code>source</code> - Source node ID</li>
							<li><code>source_handle</code> - Output handle ID</li>
							<li><code>target</code> - Target node ID</li>
							<li><code>target_handle</code> - Input handle ID</li>
						</ul>
					</div>
				</section>
			{/if}
		</div>

		<div class="tips">
			<h3>Try it out!</h3>
			<ul>
				<li>Drag nodes to reposition them</li>
				<li>Scroll to zoom in/out</li>
				<li>Drag from output to input handles to create connections</li>
				<li>Select a node/edge and press Delete to remove it</li>
			</ul>
		</div>
	</div>

	<div class="docs-preview">
		<div class="preview-label">Live Preview</div>
		<Canvas {nodes} {edges} {nodeTypes} />
	</div>
</div>

<style>
	.docs-page {
		display: flex;
		height: 100%;
	}

	.docs-sidebar {
		width: 500px;
		padding: 24px;
		overflow-y: auto;
		border-right: 1px solid #1f1f1f;
		background: #161618;
		flex-shrink: 0;
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	:global(.kaykay-light) .docs-sidebar {
		background: #fff;
		border-right: 1px solid #e0e0e0;
	}

	.docs-header h1 {
		margin: 0 0 8px 0;
		font-size: 1.5rem;
	}

	.docs-header p {
		margin: 0;
		color: #888;
		font-size: 0.95rem;
	}

	.docs-nav {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.docs-nav button {
		padding: 12px 16px;
		background: #252422;
		border: 1px solid #1f1f1f;
		border-radius: 4px;
		color: #aaa;
		font-size: 0.9rem;
		text-align: left;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.docs-nav button:hover {
		background: #1f1f1f;
		color: #fff;
	}

	.docs-nav button.active {
		background: #eb5425;
		border-color: #eb5425;
		color: #fff;
	}

	:global(.kaykay-light) .docs-nav button {
		background: #f5f5f5;
		border-color: #e0e0e0;
		color: #666;
	}

	:global(.kaykay-light) .docs-nav button:hover {
		background: #e8e8e8;
		color: #333;
	}

	:global(.kaykay-light) .docs-nav button.active {
		background: #eb5425;
		border-color: #eb5425;
		color: #fff;
	}

	.docs-content {
		flex: 1;
	}

	.docs-content section h2 {
		margin: 0 0 12px 0;
		font-size: 1.2rem;
	}

	.docs-content section p {
		margin: 0 0 16px 0;
		color: #ccc;
		font-size: 0.9rem;
		line-height: 1.6;
	}

	:global(.kaykay-light) .docs-content section p {
		color: #555;
	}

	.code-block {
		background: #121217;
		border: 1px solid #1f1f1f;
		border-radius: 4px;
		margin-bottom: 16px;
		overflow: hidden;
	}

	:global(.kaykay-light) .code-block {
		background: #f8f8f8;
		border-color: #e0e0e0;
	}

	.code-header {
		padding: 8px 12px;
		background: #252422;
		border-bottom: 1px solid #1f1f1f;
		font-size: 0.75rem;
		color: #888;
		font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
	}

	:global(.kaykay-light) .code-header {
		background: #f0f0f0;
		border-color: #e0e0e0;
		color: #666;
	}

	.code-block pre {
		margin: 0;
		padding: 16px;
		overflow-x: auto;
	}

	.code-block code {
		font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
		font-size: 0.8rem;
		line-height: 1.6;
		color: #a5d6ff;
	}

	:global(.kaykay-light) .code-block code {
		color: #0969da;
	}

	.info-box {
		background: rgba(74, 158, 255, 0.1);
		border: 1px solid rgba(74, 158, 255, 0.3);
		border-radius: 4px;
		padding: 12px 16px;
		margin-bottom: 16px;
	}

	.info-box strong {
		display: block;
		margin-bottom: 8px;
		color: #eb5425;
		font-size: 0.85rem;
	}

	.info-box ul {
		margin: 0;
		padding-left: 20px;
		font-size: 0.8rem;
		color: #aaa;
		line-height: 1.8;
	}

	:global(.kaykay-light) .info-box ul {
		color: #666;
	}

	.info-box code {
		background: #252422;
		padding: 2px 6px;
		border-radius: 4px;
		font-size: 0.75rem;
		color: #f59e0b;
	}

	:global(.kaykay-light) .info-box code {
		background: #e8e8e8;
		color: #d97706;
	}

	.tips {
		background: rgba(34, 197, 94, 0.1);
		border: 1px solid rgba(34, 197, 94, 0.3);
		border-radius: 4px;
		padding: 16px;
	}

	.tips h3 {
		margin: 0 0 12px 0;
		font-size: 0.95rem;
		color: #22c55e;
	}

	.tips ul {
		margin: 0;
		padding-left: 20px;
		font-size: 0.85rem;
		color: #aaa;
		line-height: 1.8;
	}

	:global(.kaykay-light) .tips ul {
		color: #666;
	}

	.docs-preview {
		flex: 1;
		position: relative;
	}

	.preview-label {
		position: absolute;
		top: 12px;
		left: 12px;
		background: rgba(0, 0, 0, 0.6);
		color: #fff;
		padding: 6px 12px;
		border-radius: 4px;
		font-size: 0.75rem;
		z-index: 10;
	}

	:global(.kaykay-light) .preview-label {
		background: rgba(255, 255, 255, 0.9);
		color: #333;
		border: 1px solid #e0e0e0;
	}
</style>

<script lang="ts">
	import Canvas from '../../../lib/components/Canvas.svelte';
	import type { FlowNode, FlowEdge, NodeTypes } from '../../../lib/types/index.js';
	import InputNode from '../nodes/InputNode.svelte';
	import OutputNode from '../nodes/OutputNode.svelte';
	import MultiHandleNode from '../nodes/MultiHandleNode.svelte';
	import LabeledNode from '../nodes/LabeledNode.svelte';
	import DataSourceNode from '../nodes/DataSourceNode.svelte';
	import StyledNode from '../nodes/StyledNode.svelte';
	import SimpleNode from '../nodes/SimpleNode.svelte';

	const nodeTypes: NodeTypes = {
		'simple': SimpleNode,
		'input': InputNode,
		'output': OutputNode,
		'multi-handle': MultiHandleNode,
		'labeled': LabeledNode,
		'data-source': DataSourceNode,
		'styled': StyledNode,
	};

	// Track current section and update preview accordingly
	let currentSection = $state<'input' | 'output' | 'multi' | 'labeled' | 'styled'>('input');

	// Different node/edge configs for each section
	const previewConfigs = {
		input: {
			nodes: [
				{ id: 'input-1', type: 'input', position: { x: 100, y: 80 }, data: { label: 'Data Source' } },
				{ id: 'input-2', type: 'input', position: { x: 100, y: 180 }, data: { label: 'Config' } },
				{ id: 'simple', type: 'simple', position: { x: 400, y: 130 }, data: { label: 'Processor' } }
			],
			edges: [
				{ id: 'e1', source: 'input-1', source_handle: 'out', target: 'simple', target_handle: 'in' },
				{ id: 'e2', source: 'input-2', source_handle: 'out', target: 'simple', target_handle: 'in' }
			]
		},
		output: {
			nodes: [
				{ id: 'simple', type: 'simple', position: { x: 100, y: 100 }, data: { label: 'Generator' } },
				{ id: 'output-1', type: 'output', position: { x: 400, y: 50 }, data: { label: 'Display' } },
				{ id: 'output-2', type: 'output', position: { x: 400, y: 150 }, data: { label: 'Logger' } }
			],
			edges: [
				{ id: 'e1', source: 'simple', source_handle: 'out', target: 'output-1', target_handle: 'in' },
				{ id: 'e2', source: 'simple', source_handle: 'out', target: 'output-2', target_handle: 'in' }
			]
		},
		multi: {
			nodes: [
				{ id: 'input-1', type: 'input', position: { x: 50, y: 30 }, data: { label: 'Input A' } },
				{ id: 'input-2', type: 'input', position: { x: 50, y: 120 }, data: { label: 'Input B' } },
				{ id: 'input-3', type: 'input', position: { x: 50, y: 210 }, data: { label: 'Input C' } },
				{ id: 'multi', type: 'multi-handle', position: { x: 300, y: 100 }, data: { label: 'Aggregator' } },
				{ id: 'output', type: 'output', position: { x: 550, y: 120 }, data: { label: 'Result' } }
			],
			edges: [
				{ id: 'e1', source: 'input-1', source_handle: 'out', target: 'multi', target_handle: 'in-1' },
				{ id: 'e2', source: 'input-2', source_handle: 'out', target: 'multi', target_handle: 'in-2' },
				{ id: 'e3', source: 'input-3', source_handle: 'out', target: 'multi', target_handle: 'in-3' },
				{ id: 'e4', source: 'multi', source_handle: 'out', target: 'output', target_handle: 'in' }
			]
		},
		labeled: {
			nodes: [
				{ id: 'data-source', type: 'data-source', position: { x: 50, y: 60 }, data: { label: 'Data Source' } },
				{ id: 'labeled-1', type: 'labeled', position: { x: 350, y: 60 }, data: { label: 'Processor' } },
				{ id: 'output', type: 'output', position: { x: 600, y: 100 }, data: { label: 'Result' } }
			],
			edges: [
				{ id: 'e1', source: 'data-source', source_handle: 'text-out', target: 'labeled-1', target_handle: 'text' },
				{ id: 'e2', source: 'data-source', source_handle: 'number-out', target: 'labeled-1', target_handle: 'number' },
				{ id: 'e3', source: 'data-source', source_handle: 'bool-out', target: 'labeled-1', target_handle: 'bool' },
				{ id: 'e4', source: 'labeled-1', source_handle: 'out', target: 'output', target_handle: 'in' }
			]
		},
		styled: {
			nodes: [
				{ id: 'styled-1', type: 'styled', position: { x: 100, y: 100 }, data: { label: 'Source' } },
				{ id: 'styled-2', type: 'styled', position: { x: 400, y: 100 }, data: { label: 'Target' } }
			],
			edges: [
				{ id: 'e1', source: 'styled-1', source_handle: 'out', target: 'styled-2', target_handle: 'in' }
			]
		}
	};

	let currentNodes = $derived(previewConfigs[currentSection].nodes as FlowNode[]);
	let currentEdges = $derived(previewConfigs[currentSection].edges as FlowEdge[]);
</script>

<div class="docs-page">
	<div class="docs-sidebar">
		<div class="docs-header">
			<h1>Basic Nodes</h1>
			<p>Learn how to create different types of nodes with various handle configurations.</p>
		</div>

		<nav class="docs-nav">
			<button class:active={currentSection === 'input'} onclick={() => currentSection = 'input'}>
				Input Node
			</button>
			<button class:active={currentSection === 'output'} onclick={() => currentSection = 'output'}>
				Output Node
			</button>
			<button class:active={currentSection === 'multi'} onclick={() => currentSection = 'multi'}>
				Multiple Handles
			</button>
			<button class:active={currentSection === 'labeled'} onclick={() => currentSection = 'labeled'}>
				Labeled Handles
			</button>
			<button class:active={currentSection === 'styled'} onclick={() => currentSection = 'styled'}>
				Styled Handles
			</button>
		</nav>

		<div class="docs-content">
			{#if currentSection === 'input'}
				<section>
					<h2>Input Node (Source)</h2>
					<p>An input node only has output handles - it's a data source that sends data to other nodes.</p>
					
					<div class="code-block">
						<div class="code-header">InputNode.svelte</div>
						<pre><code>&lt;script lang="ts"&gt;
  import {"{"} Handle {"}"} from 'kaykay';
  import type {"{"} NodeProps {"}"} from 'kaykay';

  let {"{"} data {"}"}: NodeProps&lt;{"{"} label: string {"}"}&gt; = $props();
&lt;/script&gt;

&lt;div class="input-node"&gt;
  &lt;span&gt;{"{"}data.label{"}"}&lt;/span&gt;
  
  &lt;!-- Only output handle - this is a source node --&gt;
  &lt;Handle 
    id="out" 
    type="output" 
    port="data" 
    position="right" 
  /&gt;
&lt;/div&gt;

&lt;style&gt;
  .input-node {"{"}
    background: #1f1f1f;
    border: 2px solid #22c55e;
    border-radius: 8px;
    padding: 16px 24px;
    color: #fff;
  {"}"}
&lt;/style&gt;</code></pre>
					</div>
				</section>

			{:else if currentSection === 'output'}
				<section>
					<h2>Output Node (Sink)</h2>
					<p>An output node only has input handles - it's a destination that receives data from other nodes.</p>
					
					<div class="code-block">
						<div class="code-header">OutputNode.svelte</div>
						<pre><code>&lt;script lang="ts"&gt;
  import {"{"} Handle {"}"} from 'kaykay';
  import type {"{"} NodeProps {"}"} from 'kaykay';

  let {"{"} data {"}"}: NodeProps&lt;{"{"} label: string {"}"}&gt; = $props();
&lt;/script&gt;

&lt;div class="output-node"&gt;
  &lt;span&gt;{"{"}data.label{"}"}&lt;/span&gt;
  
  &lt;!-- Only input handle - this is a sink node --&gt;
  &lt;Handle 
    id="in" 
    type="input" 
    port="data" 
    position="left" 
  /&gt;
&lt;/div&gt;

&lt;style&gt;
  .output-node {"{"}
    background: #1f1f1f;
    border: 2px solid #ef4444;
    border-radius: 8px;
    padding: 16px 24px;
    color: #fff;
  {"}"}
&lt;/style&gt;</code></pre>
					</div>
				</section>

			{:else if currentSection === 'multi'}
				<section>
					<h2>Multiple Handles</h2>
					<p>Use <code>HandleGroup</code> to organize multiple handles on the same side of a node.</p>
					
					<div class="code-block">
						<div class="code-header">MultiHandleNode.svelte</div>
						<pre><code>&lt;script lang="ts"&gt;
  import {"{"} Handle, HandleGroup {"}"} from 'kaykay';
  import type {"{"} NodeProps {"}"} from 'kaykay';

  let {"{"} data {"}"}: NodeProps&lt;{"{"} label: string {"}"}&gt; = $props();
&lt;/script&gt;

&lt;div class="multi-node"&gt;
  &lt;span&gt;{"{"}data.label{"}"}&lt;/span&gt;
  
  &lt;!-- Group multiple inputs on the left --&gt;
  &lt;HandleGroup position="left"&gt;
    &lt;Handle id="in-1" type="input" port="data" /&gt;
    &lt;Handle id="in-2" type="input" port="data" /&gt;
    &lt;Handle id="in-3" type="input" port="data" /&gt;
  &lt;/HandleGroup&gt;
  
  &lt;!-- Single output on the right --&gt;
  &lt;Handle 
    id="out" 
    type="output" 
    port="data" 
    position="right" 
  /&gt;
&lt;/div&gt;

&lt;style&gt;
  .multi-node {"{"}
    background: #1f1f1f;
    border: 2px solid #f59e0b;
    border-radius: 8px;
    padding: 16px 24px;
    min-height: 80px;
    color: #fff;
  {"}"}
&lt;/style&gt;</code></pre>
					</div>

					<div class="info-box">
						<strong>Note:</strong> When using HandleGroup, you don't need to specify <code>position</code> on individual handles - they inherit it from the group.
					</div>
				</section>

			{:else if currentSection === 'labeled'}
				<section>
					<h2>Labeled Handles with Port Types</h2>
					<p>Add labels to handles and use different port types. Handles only connect to compatible ports.</p>
					
					<div class="code-block">
						<div class="code-header">DataSourceNode.svelte (outputs)</div>
						<pre><code>&lt;script lang="ts"&gt;
  import {"{"} Handle, HandleGroup {"}"} from 'kaykay';
  import type {"{"} NodeProps {"}"} from 'kaykay';

  let {"{"} data {"}"}: NodeProps&lt;{"{"} label: string {"}"}&gt; = $props();
&lt;/script&gt;

&lt;div class="source-node"&gt;
  &lt;span&gt;{"{"}data.label{"}"}&lt;/span&gt;
  
  &lt;!-- Multiple outputs with different port types --&gt;
  &lt;HandleGroup position="right"&gt;
    &lt;Handle id="text-out" type="output" port="text" label="Text" /&gt;
    &lt;Handle id="number-out" type="output" port="number" label="Number" /&gt;
    &lt;Handle id="bool-out" type="output" port="boolean" label="Boolean" /&gt;
  &lt;/HandleGroup&gt;
&lt;/div&gt;</code></pre>
					</div>

					<div class="code-block">
						<div class="code-header">ProcessorNode.svelte (inputs)</div>
						<pre><code>&lt;div class="processor-node"&gt;
  &lt;span&gt;{"{"}data.label{"}"}&lt;/span&gt;
  
  &lt;!-- Multiple inputs with matching port types --&gt;
  &lt;HandleGroup position="left"&gt;
    &lt;Handle id="text" type="input" port="text" label="Text" /&gt;
    &lt;Handle id="number" type="input" port="number" label="Number" /&gt;
    &lt;Handle id="bool" type="input" port="boolean" label="Boolean" /&gt;
  &lt;/HandleGroup&gt;
  
  &lt;Handle id="out" type="output" port="data" position="right" label="Result" /&gt;
&lt;/div&gt;</code></pre>
					</div>

					<div class="info-box">
						<strong>Port Types:</strong> The <code>port</code> prop enables type-safe connections:
						<ul>
							<li><code>port="text"</code> only connects to other <code>text</code> ports</li>
							<li><code>port="number"</code> only connects to other <code>number</code> ports</li>
							<li>Use <code>accept={"{"}["text", "number"]{"}"}</code> to accept multiple types</li>
						</ul>
					</div>
				</section>

			{:else if currentSection === 'styled'}
				<section>
					<h2>Styled Handles</h2>
					<p>Customize handle appearance with inline styles or the <code>letter</code> prop.</p>
					
					<div class="code-block">
						<div class="code-header">StyledNode.svelte</div>
						<pre><code>&lt;script lang="ts"&gt;
  import {"{"} Handle {"}"} from 'kaykay';
  import type {"{"} NodeProps {"}"} from 'kaykay';

  let {"{"} data {"}"}: NodeProps&lt;{"{"} label: string {"}"}&gt; = $props();
&lt;/script&gt;

&lt;div class="styled-node"&gt;
  &lt;span&gt;{"{"}data.label{"}"}&lt;/span&gt;
  
  &lt;!-- Green input handle --&gt;
  &lt;Handle 
    id="in" 
    type="input" 
    port="data" 
    position="left"
    style="background: #22c55e; border-color: #16a34a;" 
  /&gt;
  
  &lt;!-- Orange output handle with letter --&gt;
  &lt;Handle 
    id="out" 
    type="output" 
    port="data" 
    position="right"
    style="background: #f59e0b; border-color: #d97706;"
    letter="O" 
  /&gt;
&lt;/div&gt;</code></pre>
					</div>

					<div class="info-box">
						<strong>Styling Options:</strong>
						<ul>
							<li><code>style</code> - Inline CSS for the handle</li>
							<li><code>letter</code> - Single character displayed inside the handle</li>
							<li><code>class</code> - Custom CSS class name</li>
						</ul>
					</div>
				</section>
			{/if}
		</div>

		<div class="tips">
			<h3>Handle Positions</h3>
			<ul>
				<li><code>left</code> - Left side of node (default for inputs)</li>
				<li><code>right</code> - Right side of node (default for outputs)</li>
				<li><code>top</code> - Top of node</li>
				<li><code>bottom</code> - Bottom of node</li>
			</ul>
		</div>
	</div>

	<div class="docs-preview">
		<div class="preview-label">Live Preview</div>
		{#key currentSection}
			<Canvas nodes={currentNodes} edges={currentEdges} {nodeTypes} />
		{/key}
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
		border-radius: 8px;
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
		color: #eb5425;
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

	.docs-content code {
		background: #252422;
		padding: 2px 6px;
		border-radius: 4px;
		font-size: 0.85rem;
		color: #f59e0b;
	}

	:global(.kaykay-light) .docs-content code {
		background: #f0f0f0;
		color: #d97706;
	}

	.code-block {
		background: #0d0d1a;
		border: 1px solid #1f1f1f;
		border-radius: 8px;
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
		font-size: 0.78rem;
		line-height: 1.6;
		color: #a5d6ff;
		background: transparent;
		padding: 0;
	}

	:global(.kaykay-light) .code-block code {
		color: #0969da;
	}

	.info-box {
		background: rgba(74, 158, 255, 0.1);
		border: 1px solid rgba(74, 158, 255, 0.3);
		border-radius: 8px;
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
		border-radius: 8px;
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

	.tips code {
		background: #252422;
		padding: 2px 6px;
		border-radius: 4px;
		font-size: 0.75rem;
		color: #f59e0b;
	}

	:global(.kaykay-light) .tips code {
		background: #e8e8e8;
		color: #d97706;
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

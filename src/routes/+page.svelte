<script lang="ts">
	// About/Landing page - Hacker Theme
	let activeTab: "npm" | "pnpm" | "yarn" = $state("npm");

	const installCommands = {
		npm: "npm install kaykay",
		pnpm: "pnpm add kaykay",
		yarn: "yarn add kaykay",
	};
</script>

<div class="about-page">
	<header class="hero">
		<span class="hero-logo-wrapper">
			<img src="/kaykay.png" alt="kaykay logo" class="hero-logo" />
			<h1>kaykay</h1>
		</span>

		<p class="tagline">A modern, lightweight flow editor for Svelte 5</p>
		<div class="hero-actions">
			<a href="/playground" class="btn btn-primary">[ENTER] Playground</a>
			<a href="/examples/getting-started" class="btn btn-secondary"
				>[DOCS] Get Started</a
			>
		</div>
	</header>

	<section class="install-section">
		<h2><span class="section-prefix">#</span> Installation</h2>
		<div class="code-block terminal">
			<div class="code-tabs">
				<button
					class="tab"
					class:active={activeTab === "npm"}
					onclick={() => (activeTab = "npm")}>npm</button
				>
				<button
					class="tab"
					class:active={activeTab === "pnpm"}
					onclick={() => (activeTab = "pnpm")}>pnpm</button
				>
				<button
					class="tab"
					class:active={activeTab === "yarn"}
					onclick={() => (activeTab = "yarn")}>yarn</button
				>
			</div>
			<pre><span style="user-select: none;">{'$ '}</span><span class="output">{installCommands[activeTab]}</span></pre>
		</div>
	</section>

	<section class="features-section">
		<h2><span class="section-prefix">#</span> Features</h2>
		<div class="features-grid">
			<div class="feature">
				<div class="feature-header">
					<span class="feature-icon">[5]</span>
					<h3>Svelte_5_Native</h3>
				</div>
				<p class="feature-desc">
					// Built with Svelte 5 runes and modern reactivity
				</p>
			</div>
			<div class="feature">
				<div class="feature-header">
					<span class="feature-icon">[0]</span>
					<h3>Zero_Dependencies</h3>
				</div>
				<p class="feature-desc">
					// Lightweight with no external runtime deps
				</p>
			</div>
			<div class="feature">
				<div class="feature-header">
					<span class="feature-icon">[T]</span>
					<h3>TypeScript_First</h3>
				</div>
				<p class="feature-desc">
					// Full type safety with comprehensive definitions
				</p>
			</div>
			<div class="feature">
				<div class="feature-header">
					<span class="feature-icon">[C]</span>
					<h3>Custom_Nodes</h3>
				</div>
				<p class="feature-desc">
					// Create components with your own design
				</p>
			</div>
			<div class="feature">
				<div class="feature-header">
					<span class="feature-icon">[G]</span>
					<h3>Node_Grouping</h3>
				</div>
				<p class="feature-desc">
					// Organize nodes with drag-and-drop support
				</p>
			</div>
			<div class="feature">
				<div class="feature-header">
					<span class="feature-icon">[E]</span>
					<h3>Flexible_Edges</h3>
				</div>
				<p class="feature-desc">
					// Bezier, straight, step with waypoints
				</p>
			</div>
		</div>
	</section>

	<section class="quick-start-section">
		<h2><span class="section-prefix">#</span> Quick_Start</h2>
		<div class="code-block terminal large">
			<div class="code-header">
				<span class="file-path">~/project/src/App.svelte</span>
			</div>
			<pre><span class="comment">&lt;!-- App.svelte --&gt;</span>
<span class="tag">&lt;script&gt;</span>
  <span class="keyword">import</span> {"{"} Canvas, Handle {"}"} <span
					class="keyword">from</span
				> <span class="string">'kaykay'</span>;

  <span class="keyword">const</span> nodes = [
    {"{"} id: <span class="string">'1'</span>, type: <span class="string"
					>'custom'</span
				>, position: {"{"} x: <span class="number">100</span>, y: <span
					class="number">100</span
				> {"}"}, data: {"{"} label: <span class="string">'Node 1'</span
				> {"}"} {"}"},
    {"{"} id: <span class="string">'2'</span>, type: <span class="string"
					>'custom'</span
				>, position: {"{"} x: <span class="number">300</span>, y: <span
					class="number">200</span
				> {"}"}, data: {"{"} label: <span class="string">'Node 2'</span
				> {"}"} {"}"}
  ];

  <span class="keyword">const</span> edges = [
    {"{"} id: <span class="string">'e1'</span>, source: <span class="string"
					>'1'</span
				>, source_handle: <span class="string">'out'</span
				>, target: <span class="string">'2'</span>, target_handle: <span
					class="string">'in'</span
				> {"}"}
  ];

  <span class="keyword">const</span> nodeTypes = {"{"} custom: CustomNode {"}"};
<span class="tag">&lt;/script&gt;</span>

<span class="tag">&lt;div</span><span class="tag">&gt;</span>
  <span class="tag">&lt;Canvas</span
				> {"{"}nodes{"}"} {"{"}edges{"}"} {"{"}nodeTypes{"}"} <span
					class="tag">/&gt;</span
				>
<span class="tag">&lt;/div&gt;</span></pre>
		</div>
	</section>

	<section class="links-section">
		<h2><span class="section-prefix">#</span> Resources</h2>
		<div class="links-grid">
			<a href="/examples/getting-started" class="link-card">
				<span class="link-prefix">[01]</span>
				<h3>getting_started</h3>
				<p>// Learn the basics</p>
			</a>
			<a href="/examples/api" class="link-card">
				<span class="link-prefix">[02]</span>
				<h3>api_reference</h3>
				<p>// Complete documentation</p>
			</a>
			<a
				href="https://github.com/rakunlabs/kaykay"
				target="_blank"
				class="link-card"
			>
				<span class="link-prefix">[03]</span>
				<h3>github_repo</h3>
				<p>// Source code & issues</p>
			</a>
			<a
				href="https://www.npmjs.com/package/kaykay"
				target="_blank"
				class="link-card"
			>
				<span class="link-prefix">[04]</span>
				<h3>npm_package</h3>
				<p>// Package registry</p>
			</a>
		</div>
	</section>

	<footer class="footer">
		<p><span class="comment">/* MIT License */</span></p>
	</footer>
</div>

<style>
	.about-page {
		max-width: 900px;
		margin: 0 auto;
		padding: 48px 32px;
		color: #eb5425;
		font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
	}

	/* Hero */
	.hero {
		text-align: center;
		padding: 32px 0 48px;
	}

	.hero-logo {
		width: 120px;
		height: 120px;
		margin-bottom: 16px;
	}

	.hero-logo-wrapper {
		display: flex;
		flex-direction: row;
		gap: 24px;
		align-items: center;
		justify-content: center;
	}

	.hero h1 {
		font-size: 4rem;
		margin: 0 0 16px;
		color: #eb5425;
		letter-spacing: 4px;
	}

	.tagline {
		font-size: 1.1rem;
		color: #888;
		margin: 0 0 32px;
	}

	.hero-actions {
		display: flex;
		gap: 16px;
		justify-content: center;
		flex-wrap: wrap;
	}

	.btn {
		padding: 14px 28px;
		border: 1px solid #eb5425;
		border-radius: 4px;
		font-size: 0.9rem;
		font-weight: 500;
		font-family: inherit;
		text-decoration: none;
		transition: all 0.2s ease;
		text-transform: uppercase;
		letter-spacing: 1px;
	}

	.btn-primary {
		background: #eb5425;
		color: #121217;
	}

	.btn-primary:hover {
		background: #121217;
		color: #eb5425;
	}

	.btn-secondary {
		background: transparent;
		color: #eb5425;
	}

	.btn-secondary:hover {
		background: rgba(74, 158, 255, 0.1);
	}

	/* Sections */
	section {
		margin-bottom: 64px;
	}

	section h2 {
		font-size: 1.5rem;
		margin: 0 0 24px;
		color: #eb5425;
		font-weight: 400;
		border-bottom: 1px dashed #333;
		padding-bottom: 12px;
	}

	.section-prefix {
		color: #666;
		margin-right: 8px;
	}

	/* Code blocks */
	.code-block {
		background: #121217;
		border: 1px solid #333;
		border-radius: 0;
		margin-bottom: 12px;
		overflow: hidden;
	}

	.code-block.terminal {
		border-color: #333;
	}

	.code-block.large {
		margin-bottom: 24px;
	}

	.code-header {
		padding: 8px 16px;
		background: #1a1a1a;
		border-bottom: 1px solid #333;
		font-size: 0.85rem;
		color: #666;
	}

	.file-path {
		color: #eb5425;
	}

	.code-tabs {
		display: flex;
		background: #1a1a1a;
		border-bottom: 1px solid #333;
	}

	.tab {
		padding: 10px 20px;
		background: transparent;
		border: none;
		color: #666;
		font-size: 0.85rem;
		font-family: inherit;
		cursor: pointer;
		transition: all 0.15s ease;
		border-bottom: 2px solid transparent;
	}

	.tab:hover {
		color: #eb5425;
	}

	.tab.active {
		color: #eb5425;
		border-bottom-color: #eb5425;
		background: rgba(74, 158, 255, 0.05);
	}

	.code-block pre {
		margin: 0;
		padding: 16px;
		font-family: inherit;
		font-size: 0.9rem;
		color: #fff;
		overflow-x: auto;
	}

	.code-block .output {
		color: #fff;
	}

	/* Syntax highlighting */
	.comment {
		color: #666;
	}
	.keyword {
		color: #ff79c6;
	}
	.string {
		color: #f1fa8c;
	}
	.number {
		color: #bd93f9;
	}
	.tag {
		color: #ff79c6;
	}
	.attr {
		color: #50fa7b;
	}

	/* Features */
	.features-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 16px;
	}

	.feature {
		background: #121217;
		border: 1px solid #333;
		border-radius: 4px;
		padding: 20px;
		transition: all 0.2s ease;
	}

	.feature:hover {
		border-color: #eb5425;
	}

	.feature-header {
		display: flex;
		align-items: center;
		gap: 12px;
		margin-bottom: 8px;
	}

	.feature-icon {
		color: #eb5425;
		font-size: 0.9rem;
	}

	.feature h3 {
		margin: 0;
		font-size: 1rem;
		color: #fff;
		font-weight: 400;
	}

	.feature-desc {
		margin: 0;
		font-size: 0.85rem;
		color: #666;
	}

	/* Links */
	.links-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 16px;
	}

	.link-card {
		display: block;
		background: #121217;
		border: 1px solid #333;
		border-radius: 4px;
		padding: 20px;
		text-decoration: none;
		color: inherit;
		transition: all 0.2s ease;
	}

	.link-card:hover {
		border-color: #eb5425;
	}

	.link-prefix {
		color: #666;
		font-size: 0.85rem;
		display: block;
		margin-bottom: 8px;
	}

	.link-card h3 {
		margin: 0 0 4px;
		font-size: 1rem;
		color: #eb5425;
		font-weight: 400;
	}

	.link-card p {
		margin: 0;
		font-size: 0.85rem;
		color: #666;
	}

	/* Footer */
	.footer {
		text-align: center;
		padding-top: 32px;
		border-top: 1px dashed #333;
	}

	.footer p {
		margin: 0;
		color: #666;
		font-size: 0.9rem;
	}

	/* Light mode */
	:global(.kaykay-light) .about-page {
		color: #eb5425;
	}

	:global(.kaykay-light) .hero h1 {
		color: #eb5425;
	}

	:global(.kaykay-light) .tagline {
		color: #666;
	}

	:global(.kaykay-light) .btn {
		border-color: #eb5425;
	}

	:global(.kaykay-light) .btn-primary {
		background: #eb5425;
		color: #fff;
	}

	:global(.kaykay-light) .btn-primary:hover {
		background: #fff;
		color: #eb5425;
	}

	:global(.kaykay-light) .btn-secondary {
		color: #eb5425;
	}

	:global(.kaykay-light) .btn-secondary:hover {
		background: rgba(37, 99, 235, 0.1);
	}

	:global(.kaykay-light) section h2 {
		color: #eb5425;
		border-color: #ddd;
	}

	:global(.kaykay-light) .code-block {
		border-color: #ddd;
	}

	:global(.kaykay-light) .code-block.terminal {
		border-color: #ddd;
	}

	:global(.kaykay-light) .code-header {
		background: #e8e8e8;
		border-color: #ddd;
	}

	:global(.kaykay-light) .code-tabs {
		background: #e8e8e8;
		border-color: #ddd;
	}

	:global(.kaykay-light) .tab:hover {
		color: #eb5425;
	}

	:global(.kaykay-light) .tab.active {
		color: #eb5425;
		border-bottom-color: #eb5425;
		background: rgba(37, 99, 235, 0.05);
	}

	:global(.kaykay-light) .code-block pre,
	:global(.kaykay-light) .code-block .output {
		color: #fff;
	}

	:global(.kaykay-light) .file-path {
		color: #000;
	}

	/* Syntax highlighting for light mode */
	:global(.kaykay-light) .comment {
		color: #6b7280;
	}
	:global(.kaykay-light) .keyword {
		color: #db2777;
	}
	:global(.kaykay-light) .string {
		color: #ca8a04;
	}
	:global(.kaykay-light) .number {
		color: #7c3aed;
	}
	:global(.kaykay-light) .tag {
		color: #db2777;
	}
	:global(.kaykay-light) .attr {
		color: #16a34a;
	}

	:global(.kaykay-light) .feature {
		background: #fff;
		border-color: #ddd;
	}

	:global(.kaykay-light) .feature:hover {
		border-color: #eb5425;
	}

	:global(.kaykay-light) .feature-icon {
		color: #eb5425;
	}

	:global(.kaykay-light) .feature h3 {
		color: #333;
	}

	:global(.kaykay-light) .link-card {
		background: #fff;
		border-color: #ddd;
	}

	:global(.kaykay-light) .link-card:hover {
		border-color: #eb5425;
	}

	:global(.kaykay-light) .link-card h3 {
		color: #eb5425;
	}

	:global(.kaykay-light) .footer {
		border-color: #ddd;
	}
</style>

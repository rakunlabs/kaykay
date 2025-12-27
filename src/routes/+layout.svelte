<script lang="ts">
	import type { Snippet } from 'svelte';
	import { resolve, asset } from '$app/paths';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();

	// Sidebar state
	let sidebarOpen = $state(true);
	let theme: 'light' | 'dark' = $state('light');

	function toggleTheme() {
		theme = theme === 'dark' ? 'light' : 'dark';
	}

	function toggleSidebar() {
		sidebarOpen = !sidebarOpen;
	}

	// Navigation items
	const navItems: { href: `/${string}`, label: string, icon: string }[] = [
		{ href: '/playground', label: 'Playground', icon: '⚡' },
		{ href: '/examples/getting-started', label: 'Getting Started', icon: '🚀' },
		{ href: '/examples/basic-nodes', label: 'Basic Nodes', icon: '📦' },
		{ href: '/examples/connections', label: 'Connections & Edges', icon: '🔗' },
		{ href: '/examples/groups', label: 'Groups', icon: '📁' },
		{ href: '/examples/styling', label: 'Styling & Theming', icon: '🎨' },
		{ href: '/examples/touch', label: 'Touch Support', icon: '👆' },
		{ href: '/examples/api', label: 'API Reference', icon: '📖' },
	];
</script>

<div class="app-container" class:kaykay-light={theme === 'light'} class:kaykay-dark={theme === 'dark'}>
	<!-- Sidebar -->
	<aside class="sidebar" class:collapsed={!sidebarOpen}>
		<a href={resolve('/')} class="sidebar-header">
			<img src={asset('/kaykay.svg')} alt="kaykay logo" class="logo" />
			{#if sidebarOpen}
				<div class="brand">
					<h1>kaykay</h1>
					<span class="tagline">Flow Editor</span>
				</div>
			{/if}
		</a>

		<nav class="sidebar-nav">
			{#each navItems as item}
				<a href={resolve(item.href as any)} class="nav-item">
					<span class="nav-icon">{item.icon}</span>
					{#if sidebarOpen}
						<span class="nav-label">{item.label}</span>
					{/if}
				</a>
			{/each}
		</nav>

		<div class="sidebar-footer">
			<button class="theme-btn" onclick={toggleTheme} title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}>
				{theme === 'dark' ? '☀️' : '🌙'}
				{#if sidebarOpen}
					<span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
				{/if}
			</button>
			<a href="https://github.com/rakunlabs/kaykay" target="_blank" class="repo-link" title="GitHub">
				<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
					<path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
				</svg>
				{#if sidebarOpen}
					<span>Github Repo</span>
				{/if}
			</a>
		</div>
	</aside>

	<!-- Toggle button -->
	<button class="sidebar-toggle" onclick={toggleSidebar} title={sidebarOpen ? 'Collapse' : 'Expand'}>
		{sidebarOpen ? '◀' : '▶'}
	</button>

	<!-- Main content -->
	<main class="main-content">
		{@render children()}
	</main>
</div>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
	}

	.app-container {
		display: grid;
		grid-template-columns: auto 1fr;
		width: 100%;
		height: 100vh;
		overflow: hidden;
		background: #252422;
		color: #fff;
	}

	.app-container.kaykay-light {
		background: #f5f5f5;
		color: #000;
	}

	/* Sidebar */
	.sidebar {
		width: 240px;
		height: 100vh;
		background: #161618;
		border-right: 1px solid #1f1f1f;
		display: flex;
		flex-direction: column;
		transition: width 0.2s ease;
		overflow: hidden;
		flex-shrink: 0;
	}

	.app-container.kaykay-light .sidebar {
		background: #fff;
		border-right: 1px solid #e0e0e0;
	}

	.sidebar.collapsed {
		width: 60px;
	}

	.sidebar-header {
		height: 58px;
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 16px;
		border-bottom: 1px solid #1f1f1f;
		text-decoration: none;
		color: inherit;
		transition: background 0.15s ease;
	}

	.sidebar-header:hover {
		background: #252422;
	}

	.app-container.kaykay-light .sidebar-header {
		border-bottom: 1px solid #e0e0e0;
	}

	.app-container.kaykay-light .sidebar-header:hover {
		background: #f5f5f5;
	}

	.logo {
		width: 64px;
		flex-shrink: 0;
	}

	:global(.kaykay-dark) .logo {
		filter: invert(1);
	}

	.collapsed .logo {
		width: 32px;
	}

	.brand h1 {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 700;
	}

	.tagline {
		font-size: 0.75rem;
		color: #888;
	}

	/* Navigation */
	.sidebar-nav {
		flex: 1;
		padding: 12px 8px;
		overflow-y: auto;
		overflow-x: hidden;
	}

	.nav-item {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 10px 12px;
		text-decoration: none;
		color: inherit;
		margin-bottom: 4px;
		transition: all 0.15s ease;
	}

	.nav-item:hover {
		background: #1f1f1f;
		color: #fff;
	}

	.app-container.kaykay-light .nav-item:hover {
		background: #f0f0f0;
		color: #333;
	}

	.nav-icon {
		font-size: 1.1rem;
		flex-shrink: 0;
	}

	.nav-label {
		font-size: 0.9rem;
		white-space: nowrap;
	}

	/* Sidebar Footer */
	.sidebar-footer {
		padding: 10px;
		border-top: 1px solid #1f1f1f;
		display: flex;
		flex-direction: column;
		gap: 8px;
		justify-content: center;
	}

	.app-container.kaykay-light .sidebar-footer {
		border-top: 1px solid #e0e0e0;
	}

	.theme-btn {
		height: 34px;
		box-sizing: border-box;
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 0 10px;
		background: #1f1f1f;
		border: none;
		color: #fff;
		cursor: pointer;
		transition: background 0.15s ease;
		font-family: inherit;
		font-size: inherit;
	}

	.theme-btn:hover {
		background: #252422;
	}

	.app-container.kaykay-light .theme-btn {
		background: #e0e0e0;
		color: #000;
	}

	.app-container.kaykay-light .theme-btn:hover {
		background: #d0d0d0;
	}

	.repo-link {
		height: 34px;
		box-sizing: border-box;
		display: flex;
		align-items: center;
		justify-content: left;
		gap: 8px;
		background: #1f1f1f;
		padding: 0 10px;
		color: inherit;
		transition: all 0.15s ease;
		text-decoration: none;
		overflow-x: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;

		svg {
			flex: none;
		}
	}

	.repo-link:hover {
		background: #252422;
	}

	.app-container.kaykay-light .repo-link {
		background: #e0e0e0;
	}

	.app-container.kaykay-light .repo-link:hover {
		background: #d0d0d0;
	}

	/* Sidebar Toggle */
	.sidebar-toggle {
		position: absolute;
		left: 240px;
		top: 50%;
		transform: translateY(-50%);
		z-index: 100;
		width: 20px;
		height: 40px;
		background: #1f1f1f;
		border: 1px solid #252422;
		border-left: none;
		border-radius: 0 6px 6px 0;
		color: #888;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s ease;
	}

	.sidebar.collapsed ~ .sidebar-toggle {
		left: 60px;
	}

	.sidebar-toggle:hover {
		background: #161618;
		color: #fff;
	}

	.app-container.kaykay-light .sidebar-toggle {
		background: #e0e0e0;
		border-color: #ccc;
		color: #666;
	}

	.app-container.kaykay-light .sidebar-toggle:hover {
		background: #d0d0d0;
	}

	/* Main Content */
	.main-content {
		flex: 1;
		height: 100vh;
		overflow-y: auto;
		position: relative;
	}
</style>

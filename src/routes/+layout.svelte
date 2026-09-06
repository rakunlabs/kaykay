<script lang="ts">
	import { onMount, tick, type Snippet } from 'svelte';
	import { resolve, asset, base } from '$app/paths';
	import { browser } from '$app/environment';
	import { page } from '$app/state';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();

	// Sidebar state
	let sidebarOpen = $state(true);
	let sidebarNav = $state<HTMLElement | null>(null);
	let sidebarEl = $state<HTMLElement | null>(null);
	let toggleEl = $state<HTMLButtonElement | null>(null);
	let isMobile = $state(false);
	let theme: 'light' | 'dark' = $state('light');

	onMount(() => {
		const media = window.matchMedia('(max-width: 768px)');
		function syncMobile(): void {
			if (media.matches !== isMobile) sidebarOpen = !media.matches;
			isMobile = media.matches;
		}
		syncMobile();
		media.addEventListener('change', syncMobile);
		return () => media.removeEventListener('change', syncMobile);
	});

	// Load theme from localStorage on mount
	$effect(() => {
		if (browser) {
			const savedTheme = localStorage.getItem('kaykay-theme');
			if (savedTheme === 'light' || savedTheme === 'dark') {
				theme = savedTheme;
			}
		}
	});

	function toggleTheme() {
		theme = theme === 'dark' ? 'light' : 'dark';
		if (browser) {
			localStorage.setItem('kaykay-theme', theme);
		}
	}

	async function toggleSidebar(): Promise<void> {
		sidebarOpen = !sidebarOpen;
		await tick();
		if (isMobile && sidebarOpen) sidebarNav?.querySelector<HTMLAnchorElement>('.nav-item.active, .nav-item')?.focus();
		else toggleEl?.focus();
	}

	function handleNavigationKey(event: KeyboardEvent): void {
		if (!isMobile || !sidebarOpen) return;
		if (event.key === 'Escape') {
			event.preventDefault();
			sidebarOpen = false;
			toggleEl?.focus();
		} else if (event.key === 'Tab') {
			const first = sidebarEl?.querySelector<HTMLElement>('a[href], button');
			if (event.shiftKey && document.activeElement === first) {
				event.preventDefault();
				toggleEl?.focus();
			} else if (!event.shiftKey && document.activeElement === toggleEl) {
				event.preventDefault();
				first?.focus();
			}
		}
	}

	function closeSidebarOnMobile() {
		if (browser && window.matchMedia('(max-width: 768px)').matches) {
			sidebarOpen = false;
		}
	}

	// Navigation items
	const navItems: { href: `/${string}`, label: string, icon: string }[] = [
		{ href: '/playground', label: 'Playground', icon: 'M8 4l12 8-12 8z' },
		{ href: '/examples/getting-started', label: 'Getting Started', icon: 'M5 12h14m-6-6 6 6-6 6' },
		{ href: '/examples/basic-nodes', label: 'Basic Nodes', icon: 'M4 4h6v6H4zM14 14h6v6h-6zM7 10v7h7' },
		{ href: '/examples/drag-drop', label: 'Drag & Drop', icon: 'M12 3v12m-4-4 4 4 4-4M5 16v5h14v-5' },
		{ href: '/examples/connections', label: 'Connections & Edges', icon: 'M3 5h5v5H3zM16 14h5v5h-5zM8 7h4v10h4' },
		{ href: '/examples/groups', label: 'Groups', icon: 'M3 5h7l2 3h9v12H3z' },
		{ href: '/examples/styling', label: 'Styling & Theming', icon: 'M4 7h16M4 17h16M8 4v6M16 14v6' },
		{ href: '/examples/state-history', label: 'State & History', icon: 'M4 4v6h6M4 10a8 8 0 1 1 1 8M12 7v5l3 2' },
		{ href: '/examples/live-system', label: 'Live System', icon: 'M2 12h4l3-8 6 16 3-8h4' },
		{ href: '/examples/blender-style', label: 'Blender Style', icon: 'M3 5h7v6H3zM14 13h7v6h-7zM10 8h7v5M3 16h6' },
		{ href: '/examples/touch', label: 'Touch Support', icon: 'M8 13V5a2 2 0 0 1 4 0v7l2-2 6 3-2 8H9l-5-6a2 2 0 0 1 3-2l1 1' },
		{ href: '/examples/api', label: 'API Reference', icon: 'M8 5 2 12l6 7M16 5l6 7-6 7M14 3l-4 18' },
	];

	const currentPath = $derived.by(() => {
		const pathname = base && page.url.pathname.startsWith(base)
			? page.url.pathname.slice(base.length)
			: page.url.pathname;

		return pathname.replace(/\/$/, '') || '/';
	});

	$effect(() => {
		const activePath = currentPath;
		if (!browser || !sidebarNav) return;

		tick().then(() => {
			if (activePath !== currentPath) return;
			sidebarNav?.querySelector('.nav-item.active')?.scrollIntoView({ block: 'nearest' });
		});
	});
</script>

<svelte:window onkeydown={handleNavigationKey} />

<div class="app-container" class:kaykay-light={theme === 'light'} class:kaykay-dark={theme === 'dark'}>
	<!-- Sidebar -->
	<aside id="docs-navigation" bind:this={sidebarEl} class="sidebar" class:collapsed={!sidebarOpen} inert={isMobile && !sidebarOpen}>
		<a href={resolve('/')} class="sidebar-header" onclick={closeSidebarOnMobile}>
			<img src={asset('/kaykay.svg')} alt="kaykay logo" class="logo" />
			{#if sidebarOpen}
				<div class="brand">
					<span class="brand-name">kaykay</span>
					<span class="tagline">Flow Editor</span>
				</div>
			{/if}
		</a>

		<nav class="sidebar-nav" aria-label="Documentation" bind:this={sidebarNav}>
			{#each navItems as item}
				<a
					href={resolve(item.href as any)}
					class="nav-item"
					class:active={currentPath === item.href}
					aria-current={currentPath === item.href ? 'page' : undefined}
					aria-label={item.label}
					title={!sidebarOpen ? item.label : undefined}
					onclick={closeSidebarOnMobile}
				>
					<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d={item.icon} /></svg>
					{#if sidebarOpen}
						<span class="nav-label">{item.label}</span>
					{/if}
				</a>
			{/each}
		</nav>

		<div class="sidebar-footer">
			<button class="theme-btn" onclick={toggleTheme} aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'} title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}>
				<svg class="footer-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true">
					{#if theme === 'dark'}<circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1 1M18 18l1 1M5 19l1-1M18 6l1-1" />{:else}<path d="M20 14A8 8 0 0 1 10 4a8 8 0 1 0 10 10z" />{/if}
				</svg>
				{#if sidebarOpen}
					<span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
				{/if}
			</button>
			<a href="https://github.com/rakunlabs/kaykay" target="_blank" rel="noreferrer" class="repo-link" title="GitHub" aria-label="kaykay on GitHub">
				<svg class="footer-icon" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
					<path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
				</svg>
				{#if sidebarOpen}
					<span>GitHub</span>
				{/if}
			</a>
		</div>
	</aside>

	{#if sidebarOpen && isMobile}
		<button class="sidebar-backdrop" type="button" tabindex="-1" onclick={toggleSidebar} aria-label="Close navigation"></button>
	{/if}

	<!-- Toggle button -->
	<button bind:this={toggleEl} class="sidebar-toggle" onclick={toggleSidebar} aria-label={sidebarOpen ? 'Collapse navigation' : 'Expand navigation'} aria-expanded={sidebarOpen} aria-controls="docs-navigation" title={sidebarOpen ? 'Collapse' : 'Expand'}>
		<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d={sidebarOpen ? 'M15 6l-6 6 6 6' : 'M9 6l6 6-6 6'} /></svg>
	</button>

	<!-- Main content -->
	<main class="main-content" inert={isMobile && sidebarOpen}>
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
		--site-accent: #FFDC58;
		--site-accent-fill: #FFDC58;
		--site-accent-ink: #242321;
		--site-accent-hover: #F2CA38;
		--site-accent-soft: rgba(255, 220, 88, 0.12);
		display: grid;
		grid-template-columns: auto minmax(0, 1fr);
		width: 100%;
		height: 100vh;
		height: 100dvh;
		overflow: hidden;
		background: #252422;
		color: #fff;
		--kaykay-scrollbar-track: rgba(255, 255, 255, 0.03);
		--kaykay-scrollbar-thumb: rgba(120, 120, 120, 0.46);
		--kaykay-scrollbar-thumb-hover: rgba(150, 150, 150, 0.68);
	}

	.app-container.kaykay-light {
		--site-accent: #806000;
		--site-accent-soft: rgba(255, 220, 88, 0.18);
		background: #f5f5f5;
		color: #000;
		--kaykay-scrollbar-track: rgba(0, 0, 0, 0.04);
		--kaykay-scrollbar-thumb: rgba(82, 82, 82, 0.38);
		--kaykay-scrollbar-thumb-hover: rgba(82, 82, 82, 0.62);
	}

	.sidebar-nav,
	.main-content {
		scrollbar-width: thin;
		scrollbar-color: var(--kaykay-scrollbar-thumb) var(--kaykay-scrollbar-track);
	}

	.sidebar-nav::-webkit-scrollbar,
	.main-content::-webkit-scrollbar {
		width: 6px;
		height: 6px;
	}

	.sidebar-nav::-webkit-scrollbar-track,
	.main-content::-webkit-scrollbar-track {
		background: var(--kaykay-scrollbar-track);
	}

	.sidebar-nav::-webkit-scrollbar-thumb,
	.main-content::-webkit-scrollbar-thumb {
		background: var(--kaykay-scrollbar-thumb);
		border: 1px solid transparent;
		border-radius: 999px;
		background-clip: padding-box;
	}

	.sidebar-nav::-webkit-scrollbar-thumb:hover,
	.main-content::-webkit-scrollbar-thumb:hover {
		background: var(--kaykay-scrollbar-thumb-hover);
		background-clip: padding-box;
	}

	/* Sidebar */
	.sidebar {
		width: 240px;
		height: 100vh;
		height: 100dvh;
		color: #e5e2dd;
		font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
		font-size: 13px;
		background: #161618;
		border-right: 1px solid #1f1f1f;
		display: flex;
		flex-direction: column;
		transition: width 0.2s ease;
		overflow: hidden;
		flex-shrink: 0;
	}

	.app-container.kaykay-light .sidebar {
		color: #34312d;
		background: #fff;
		border-right: 1px solid #e0e0e0;
	}

	.sidebar.collapsed {
		width: 60px;
	}

	.sidebar-header {
		box-sizing: border-box;
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

	.sidebar.collapsed .sidebar-header {
		justify-content: center;
		padding: 16px 0;
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
		width: 48px;
		flex-shrink: 0;
	}

	:global(.kaykay-dark) .logo {
		filter: invert(1);
	}

	.collapsed .logo {
		width: 32px;
	}

	.brand-name {
		display: block;
		margin: 0;
		font-size: 1.25rem;
		font-weight: 700;
	}

	.tagline {
		font-size: 0.75rem;
		color: #aaa39a;
	}
	.app-container.kaykay-light .tagline { color: #706a63; }

	/* Navigation */
	.sidebar-nav {
		flex: 1;
		padding: 12px 8px;
		overflow-y: auto;
		overflow-x: hidden;
	}

	.nav-item {
		box-sizing: border-box;
		display: flex;
		align-items: center;
		gap: 12px;
		min-height: 40px;
		padding: 10px 12px;
		text-decoration: none;
		color: inherit;
		margin-bottom: 4px;
		transition: background-color 0.15s ease;
		border-radius: 4px;
	}

	.sidebar.collapsed .nav-item {
		justify-content: center;
		gap: 0;
		padding: 10px 0;
	}

	.nav-item:hover {
		background: #1f1f1f;
		color: #fff;
	}

	.nav-item.active {
		background: var(--site-accent-soft);
		box-shadow: inset 3px 0 0 var(--site-accent-fill);
		color: var(--site-accent);
	}

	.app-container.kaykay-light .nav-item:hover {
		background: #f0f0f0;
		color: #333;
	}

	.app-container.kaykay-light .nav-item.active {
		background: var(--site-accent-fill);
		box-shadow: none;
		color: var(--site-accent-ink);
	}

	.nav-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 22px;
		height: 22px;
		font-size: 1.1rem;
		line-height: 1;
		text-align: center;
		flex-shrink: 0;
	}

	.nav-label {
		min-width: 0;
		font-size: 0.9rem;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
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
		height: 40px;
		box-sizing: border-box;
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 0 10px;
		background: transparent;
		border: none;
		color: #fff;
		cursor: pointer;
		transition: background 0.15s ease;
		font-family: inherit;
		font-size: inherit;
	}

	.footer-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 20px;
		height: 20px;
		line-height: 1;
		text-align: center;
		flex: 0 0 20px;
	}

	.sidebar.collapsed .theme-btn,
	.sidebar.collapsed .repo-link {
		justify-content: center;
		padding: 0;
	}

	.theme-btn:hover {
		background: #252422;
	}

	.app-container.kaykay-light .theme-btn {
		background: transparent;
		color: #000;
	}

	.app-container.kaykay-light .theme-btn:hover {
		background: #d0d0d0;
	}

	.repo-link {
		height: 40px;
		box-sizing: border-box;
		display: flex;
		align-items: center;
		justify-content: left;
		gap: 8px;
		background: transparent;
		padding: 0 10px;
		color: inherit;
		transition: background-color 0.15s ease;
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
		background: transparent;
	}

	.app-container.kaykay-light .repo-link:hover {
		background: #d0d0d0;
	}

	.sidebar-backdrop {
		display: none;
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
		padding: 0;
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
		min-width: 0;
		height: 100vh;
		height: 100dvh;
		overflow-y: auto;
		position: relative;
	}

	.sidebar :is(a, button):focus-visible, .sidebar-toggle:focus-visible { outline: 2px solid var(--site-accent); outline-offset: -2px; }
	@media (prefers-reduced-motion: reduce) { .sidebar, .sidebar-toggle, .nav-item, .theme-btn, .repo-link { transition: none; } }

	@media (max-width: 768px) {
		.app-container {
			display: block;
		}

		.sidebar {
			position: fixed;
			top: 0;
			left: 0;
			z-index: 220;
			width: min(82vw, 280px);
			max-width: 100vw;
			box-shadow: 16px 0 34px rgba(0, 0, 0, 0.32);
			transform: translateX(0);
			transition: transform 0.2s ease;
		}

		.sidebar.collapsed {
			width: min(82vw, 280px);
			transform: translateX(-100%);
			box-shadow: none;
			visibility: hidden;
		}

		.sidebar.collapsed .logo {
			width: 48px;
		}

		.sidebar-backdrop {
			display: block;
			position: fixed;
			inset: 0;
			z-index: 210;
			background: rgba(0, 0, 0, 0.45);
			border: 0;
			cursor: pointer;
		}

		.sidebar-toggle {
			position: fixed;
			left: 12px;
			top: 12px;
			z-index: 230;
			width: 40px;
			height: 40px;
			transform: none;
			border: 1px solid #252422;
			border-radius: 8px;
		}

		.sidebar:not(.collapsed) ~ .sidebar-toggle {
			left: min(calc(82vw + 8px), 288px);
		}

		.sidebar.collapsed ~ .sidebar-toggle {
			left: 12px;
		}

		.main-content {
			height: 100vh;
			height: 100dvh;
		}
	}
</style>

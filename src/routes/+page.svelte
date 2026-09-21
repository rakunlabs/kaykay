<script lang="ts">
	import { onDestroy } from 'svelte';
	import { resolve } from '$app/paths';
	import WelcomeFlow from './home/WelcomeFlow.svelte';
	import { quick_start_files } from './home/quick-start.js';

	let manager = $state<'pnpm' | 'npm'>('pnpm');
	let file = $state<keyof typeof quick_start_files>('App.svelte');
	let copy_status = $state('');
	let copied = $state<'install' | 'code' | null>(null);
	let copy_timer: ReturnType<typeof setTimeout> | undefined;
	const install_command = $derived(manager === 'pnpm' ? 'pnpm add kaykay' : 'npm install kaykay');

	onDestroy(() => clearTimeout(copy_timer));

	async function copy(value: string, target: 'install' | 'code'): Promise<void> {
		clearTimeout(copy_timer);
		try {
			await navigator.clipboard.writeText(value);
			copied = target;
			copy_status = target === 'install' ? 'Install command copied.' : `${file} copied.`;
		} catch {
			copied = null;
			copy_status = 'Clipboard unavailable. Select the command or code to copy it.';
		}
		copy_timer = setTimeout(() => { copied = null; copy_status = ''; }, 3000);
	}
</script>

<svelte:head>
	<title>kaykay | A Flow Editor for Svelte 5</title>
	<meta name="description" content="Turn Svelte components into interactive flows. Explore typed connections, custom nodes, animated edges, and a complete two-file quick start with kaykay." />
</svelte:head>

<div class="kaykay-home">
	<section class="kaykay-intro" aria-labelledby="intro-title">
		<div class="kaykay-intro-copy">
			<h1 id="intro-title">Svelte components,<br /><span>connected.</span></h1>
			<p class="kaykay-lead">Build interactive flows with your own components. Typed connections, animated edges, and an editor that feels like part of your app.</p>
			<div class="kaykay-actions">
				<a class="kaykay-primary" href={resolve('/examples/getting-started')}>Get started <span aria-hidden="true">&rarr;</span></a>
				<a class="kaykay-secondary" href={resolve('/playground')}>Open playground <span aria-hidden="true">&nearr;</span></a>
			</div>
			<div class="kaykay-links">
				<a href="https://github.com/rakunlabs/kaykay" target="_blank" rel="noreferrer">
					<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56v-2c-3.2.7-3.88-1.54-3.88-1.54-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.23-1.28-5.23-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.12 3.05.74.81 1.18 1.84 1.18 3.1 0 4.43-2.69 5.41-5.25 5.69.41.36.78 1.06.78 2.14v3.17c0 .31.21.68.8.56A11.51 11.51 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5Z" /></svg>
					GitHub
				</a>
				<a href="https://www.npmjs.com/package/kaykay" target="_blank" rel="noreferrer">
					<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M0 7.334v8h6.666v1.332H12v-1.332h12v-8H0zm6.666 6.668H5.334v-4H4v4H1.334V8.667h5.332v5.335zm4 0v1.333H8.001V8.667h5.334v5.335h-2.669zm12.001 0h-1.33v-4h-1.336v4h-1.335v-4h-1.33v4h-2.671V8.667h8.002v5.335zM10.665 10H12v2.667h-1.335V10z" /></svg>
					npm
				</a>
			</div>
			<div class="kaykay-install">
				<div class="kaykay-install-heading">
					<span>Install in your Svelte 5 app</span>
					<div class="kaykay-package-options" aria-label="Package manager">
						<button class:active={manager === 'pnpm'} aria-pressed={manager === 'pnpm'} onclick={() => manager = 'pnpm'}>pnpm</button>
						<button class:active={manager === 'npm'} aria-pressed={manager === 'npm'} onclick={() => manager = 'npm'}>npm</button>
					</div>
				</div>
				<div class="kaykay-command"><code>{install_command}</code><button aria-label="Copy install command" onclick={() => copy(install_command, 'install')}>{copied === 'install' ? 'Copied' : 'Copy'}</button></div>
			</div>
		</div>
		<div class="kaykay-demo">
			<div class="kaykay-demo-header"><strong>A little flow. A real editor.</strong><span>Svelte 5 + kaykay</span></div>
			<WelcomeFlow />
		</div>
	</section>

	<div class="kaykay-foundations" aria-label="Library foundations">
		<span><strong>Svelte 5</strong> native reactivity</span>
		<span><strong>Typed ports</strong> compatible connections</span>
		<span><strong>Zero</strong> external runtime dependencies</span>
	</div>

	<section class="kaykay-section" aria-labelledby="examples-title">
		<div class="kaykay-section-heading"><div><h2 id="examples-title">See what connects.</h2><p>Different interfaces. The same canvas underneath.</p></div><a href={resolve('/playground')}>Explore the playground <span aria-hidden="true">&rarr;</span></a></div>
		<div class="kaykay-examples">
			<a class="kaykay-example" href={resolve('/examples/live-system')}>
				<div class="kaykay-preview">
					<svg viewBox="0 0 320 150" aria-hidden="true">
						<path class="kaykay-preview-wire" d="M66 76H94C107 76 104 42 120 42H140M94 76C107 76 104 112 120 112H140M182 42H196C212 42 205 76 222 76H248M182 112H196C212 112 205 76 222 76" />
						<rect x="20" y="58" width="46" height="36" rx="4" /><rect x="140" y="24" width="42" height="36" rx="4" /><rect x="140" y="94" width="42" height="36" rx="4" /><rect x="248" y="58" width="50" height="36" rx="4" />
						<text x="43" y="79">IN</text><text x="161" y="45">API</text><text x="161" y="115">API</text><text x="273" y="79">DB</text>
						<circle class="kaykay-signal" cx="89" cy="76" r="3" /><circle class="kaykay-signal" cx="209" cy="57" r="3" /><circle class="kaykay-signal" cx="232" cy="76" r="3" />
					</svg>
				</div>
				<h3>Live System <span aria-hidden="true">&nearr;</span></h3><p>Raise the traffic. Watch queues fill. Recover a service.</p><span class="kaykay-example-detail">Animation / live state</span>
			</a>
			<a class="kaykay-example" href={resolve('/examples/blender-style')}>
				<div class="kaykay-preview">
					<svg viewBox="0 0 320 150" aria-hidden="true">
						<path class="kaykay-preview-wire" d="M112 56C154 56 146 72 190 72M112 109C160 109 151 91 190 91" />
						<rect x="30" y="22" width="82" height="52" rx="4" /><rect x="30" y="90" width="82" height="38" rx="4" /><rect x="190" y="38" width="100" height="80" rx="4" />
						<path class="kaykay-preview-rule" d="M30 41H112M190 57H290M42 56H75M204 104H274" />
						<text x="70" y="35">Texture</text><text x="70" y="112">Value</text><text x="240" y="51">Material</text>
						<circle class="kaykay-signal" cx="112" cy="56" r="3" /><circle class="kaykay-signal" cx="112" cy="109" r="3" /><circle class="kaykay-signal" cx="190" cy="72" r="3" /><circle class="kaykay-signal" cx="190" cy="91" r="3" />
					</svg>
				</div>
				<h3>Blender Style <span aria-hidden="true">&nearr;</span></h3><p>Build a node editor with compact controls and custom sockets.</p><span class="kaykay-example-detail">Custom nodes / typed handles</span>
			</a>
			<a class="kaykay-example" href={resolve('/examples/groups')}>
				<div class="kaykay-preview">
					<svg viewBox="0 0 320 150" aria-hidden="true">
						<rect class="kaykay-preview-region" x="28" y="20" width="198" height="112" rx="5" /><text x="82" y="39">Processing group</text>
						<path class="kaykay-preview-wire" d="M112 83H146M202 83H260" />
						<rect x="48" y="63" width="64" height="40" rx="4" /><rect x="146" y="63" width="56" height="40" rx="4" /><rect x="260" y="63" width="40" height="40" rx="4" />
						<text x="80" y="86">Parse</text><text x="174" y="86">Map</text><text x="280" y="86">Out</text>
					</svg>
				</div>
				<h3>Groups <span aria-hidden="true">&nearr;</span></h3><p>Give complex flows structure with nested, movable groups.</p><span class="kaykay-example-detail">Nesting / organization</span>
			</a>
		</div>
	</section>

	<section class="kaykay-section kaykay-quick-start" aria-labelledby="start-title">
		<div class="kaykay-start-copy">
			<h2 id="start-title">Your first connection.</h2>
			<p>Two files. Your Svelte component becomes a node; handles tell the canvas where connections belong.</p>
			<ol><li>Install kaykay in a Svelte 5 app.</li><li>Add both files in the same folder.</li><li>Render <code>App.svelte</code> to see the flow.</li></ol>
			<a href={resolve('/examples/getting-started')}>Follow the full guide <span aria-hidden="true">&rarr;</span></a>
			<div class="kaykay-result" aria-label="The quick start creates two connected nodes, Hello and Svelte"><span>Hello</span><svg viewBox="0 0 90 20" aria-hidden="true"><path d="M0 10H88M81 5L88 10L81 15" /></svg><span>Svelte</span></div>
		</div>
		<div class="kaykay-source">
			<div class="kaykay-source-header">
				<div class="kaykay-file-options" aria-label="Example source file">
					{#each Object.keys(quick_start_files) as name}
						<button class:active={file === name} aria-pressed={file === name} onclick={() => { file = name as keyof typeof quick_start_files; copied = null; }}>{name}</button>
					{/each}
				</div>
				<button class="kaykay-copy-code" aria-label={`Copy ${file}`} onclick={() => copy(quick_start_files[file], 'code')}>{copied === 'code' ? 'Copied' : 'Copy'}</button>
			</div>
			<!-- svelte-ignore a11y_no_noninteractive_tabindex -- keyboard users need to scroll the code region -->
			<pre role="region" tabindex="0" aria-label={`${file} source code`}><code>{quick_start_files[file]}</code></pre>
			<div class="kaykay-source-footer">Complete source / no hidden setup</div>
		</div>
	</section>

	<section class="kaykay-section" aria-labelledby="docs-title">
		<div class="kaykay-section-heading"><div><h2 id="docs-title">Make it your own.</h2><p>Pick the part you want to build next.</p></div></div>
		<div class="kaykay-doc-links">
			<a href={resolve('/examples/basic-nodes')}><strong>Create a node <span aria-hidden="true">&rarr;</span></strong><span>Components, data, and handles</span></a>
			<a href={resolve('/examples/connections')}><strong>Connect your data <span aria-hidden="true">&rarr;</span></strong><span>Paths, edge styles, and interactions</span></a>
			<a href={resolve('/examples/styling')}><strong>Style your editor <span aria-hidden="true">&rarr;</span></strong><span>Your theme, your visual language</span></a>
			<a href={resolve('/examples/state-history')}><strong>Keep your state <span aria-hidden="true">&rarr;</span></strong><span>JSON, history, undo, and redo</span></a>
		</div>
	</section>

	<footer class="kaykay-home-footer"><span>kaykay / Built for Svelte 5. MIT licensed.</span><div><a href={resolve('/examples/api')}>API reference</a><a href="https://github.com/rakunlabs/kaykay" target="_blank" rel="noreferrer">GitHub</a><a href="https://www.npmjs.com/package/kaykay" target="_blank" rel="noreferrer">npm</a></div></footer>
	<p class="kaykay-copy-status" role="status">{copy_status}</p>
</div>

<style>
	.kaykay-home { --home-text: #242321; --home-muted: #65635f; --home-border: #dcdad5; --home-panel: #fff; --home-soft: #efeee9; --home-accent: var(--site-accent); color: var(--home-text); max-width: 1240px; margin: 0 auto; padding: 64px 40px 24px; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
	:global(.kaykay-dark) .kaykay-home { --home-text: #f0eeea; --home-muted: #b4b0a9; --home-border: #45423d; --home-panel: #20201f; --home-soft: #2d2c29; }
	.kaykay-home ::selection { background: var(--site-accent-fill); color: var(--site-accent-ink); }
	h1, h2, h3, p { margin: 0; }
	h1 { font-size: clamp(36px, 3.5vw, 54px); line-height: 1.08; letter-spacing: -0.035em; font-weight: 650; text-wrap: balance; }
	h1 span { color: var(--home-accent); }
	h2 { font-size: 27px; line-height: 1.2; letter-spacing: -0.025em; font-weight: 650; text-wrap: balance; }
	a { color: inherit; text-decoration: none; text-underline-offset: 4px; }
	button { font: inherit; color: inherit; cursor: pointer; }
	a:focus-visible, button:focus-visible, pre:focus-visible { outline: 2px solid var(--home-accent); outline-offset: 4px; }
	.kaykay-intro { display: grid; grid-template-columns: minmax(290px, 0.9fr) minmax(0, 1.2fr); gap: 40px; align-items: center; }
	.kaykay-lead { color: var(--home-muted); font-size: 16px; line-height: 1.7; max-width: 44ch; margin-top: 22px; }
	.kaykay-actions { display: flex; flex-wrap: wrap; gap: 12px 20px; align-items: center; margin: 26px 0 16px; font-size: 14px; font-weight: 600; }
	.kaykay-primary { display: flex; gap: 20px; justify-content: space-between; padding: 12px 17px; color: var(--site-accent-ink); background: var(--site-accent-fill); border: 1px solid var(--site-accent-fill); border-radius: 5px; }
	.kaykay-primary:hover { background: var(--site-accent-hover); border-color: var(--site-accent-hover); }
	.kaykay-secondary { padding: 10px 0; }
	.kaykay-secondary:hover { text-decoration: underline; }
	.kaykay-links { display: flex; flex-wrap: wrap; gap: 8px 18px; align-items: center; margin-bottom: 30px; font-size: 12px; }
	.kaykay-links a { display: inline-flex; align-items: center; gap: 7px; color: var(--home-muted); }
	.kaykay-links a:hover { color: var(--home-accent); text-decoration: underline; }
	.kaykay-links svg { width: 14px; height: 14px; fill: currentColor; }
	.kaykay-install-heading { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 8px; margin-bottom: 8px; color: var(--home-muted); font-size: 11px; }
	.kaykay-package-options { display: flex; gap: 4px; }
	.kaykay-package-options button { border: 0; background: none; padding: 4px 6px; border-radius: 3px; }
	.kaykay-package-options button.active { background: var(--home-soft); color: var(--home-text); }
	.kaykay-command { display: flex; justify-content: space-between; align-items: center; gap: 12px; background: var(--home-panel); border: 1px solid var(--home-border); border-radius: 5px; padding: 12px 14px; font-size: 13px; }
	code, pre, .kaykay-demo-header span, .kaykay-example-detail, .kaykay-source-footer { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
	.kaykay-command button { border: 0; padding: 4px; background: none; color: var(--home-accent); font-size: 12px; }
	.kaykay-demo { min-width: 0; border: 1px solid var(--home-border); background: var(--home-panel); border-radius: 8px; overflow: hidden; }
	.kaykay-demo-header { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 8px; padding: 16px 18px; border-bottom: 1px solid var(--home-border); font-size: 12px; }
	.kaykay-demo-header strong { font-weight: 550; }.kaykay-demo-header span { font-size: 10px; color: var(--home-muted); }
	.kaykay-foundations { display: flex; flex-wrap: wrap; gap: 16px 36px; justify-content: space-between; margin-top: 44px; padding: 20px 0; border-top: 1px solid var(--home-border); border-bottom: 1px solid var(--home-border); font-size: 12px; color: var(--home-muted); }
	.kaykay-foundations strong { color: var(--home-text); font-weight: 600; margin-right: 5px; }
	.kaykay-section { margin-top: 64px; }
	.kaykay-section-heading { display: flex; justify-content: space-between; align-items: end; flex-wrap: wrap; gap: 16px; margin-bottom: 26px; }
	.kaykay-section-heading p { margin-top: 10px; color: var(--home-muted); font-size: 14px; line-height: 1.6; }
	.kaykay-section-heading > a, .kaykay-start-copy > a { font-size: 13px; color: var(--home-accent); font-weight: 600; }
	.kaykay-section-heading > a:hover, .kaykay-start-copy > a:hover { text-decoration: underline; }
	.kaykay-examples { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 24px; }
	.kaykay-preview { border: 1px solid var(--home-border); background: var(--home-panel); border-radius: 5px; overflow: hidden; transition: border-color 150ms ease; }
	.kaykay-example:hover .kaykay-preview { border-color: var(--home-accent); }
	.kaykay-preview svg { display: block; width: 100%; }
	.kaykay-preview rect { fill: var(--home-panel); stroke: var(--home-border); }
	.kaykay-preview text { fill: var(--home-muted); font: 9px ui-monospace, monospace; text-anchor: middle; }
	.kaykay-preview-wire { stroke: var(--home-accent); stroke-width: 1.5; fill: none; }
	.kaykay-preview-rule { stroke: var(--home-border); fill: none; }
	.kaykay-preview .kaykay-preview-region { fill: var(--home-soft); stroke-dasharray: 4 3; }
	.kaykay-signal { fill: var(--home-accent); }
	.kaykay-example h3 { display: flex; justify-content: space-between; gap: 12px; font-size: 16px; margin: 17px 0 8px; font-weight: 600; }
	.kaykay-example h3 span { color: var(--home-accent); }
	.kaykay-example p { color: var(--home-muted); font-size: 13px; line-height: 1.6; max-width: 36ch; }
	.kaykay-example-detail { display: block; margin-top: 12px; color: var(--home-muted); font-size: 10px; }
	.kaykay-quick-start { display: grid; grid-template-columns: minmax(0, 0.75fr) minmax(0, 1.25fr); gap: 44px; padding: 40px 0; border-top: 1px solid var(--home-border); border-bottom: 1px solid var(--home-border); }
	.kaykay-start-copy p { color: var(--home-muted); font-size: 15px; line-height: 1.7; margin-top: 16px; max-width: 40ch; }
	.kaykay-start-copy ol { padding-left: 20px; margin: 24px 0; color: var(--home-muted); font-size: 13px; line-height: 1.8; }
	.kaykay-start-copy li { margin: 8px 0; padding-left: 3px; }
	.kaykay-source { min-width: 0; background: var(--home-panel); border: 1px solid var(--home-border); border-radius: 6px; overflow: hidden; }
	.kaykay-source-header { display: flex; justify-content: space-between; gap: 8px; border-bottom: 1px solid var(--home-border); font-size: 11px; padding: 0 12px; }
	.kaykay-file-options { display: flex; min-width: 0; }
	.kaykay-file-options button { background: none; border: 0; border-bottom: 2px solid transparent; padding: 14px 10px; color: var(--home-muted); font-size: 11px; }
	.kaykay-file-options button.active { color: var(--home-text); border-bottom-color: var(--home-accent); }
	.kaykay-copy-code { border: 0; background: none; color: var(--home-accent); font-size: 11px; }
	pre { margin: 0; padding: 20px; max-height: 380px; overflow: auto; font-size: 11px; line-height: 1.8; tab-size: 2; scrollbar-width: thin; scrollbar-color: var(--home-border) transparent; }
	.kaykay-source-footer { padding: 10px 20px; border-top: 1px solid var(--home-border); color: var(--home-muted); font-size: 10px; }
	.kaykay-result { display: flex; align-items: center; margin-top: 34px; font: 12px ui-monospace, monospace; }
	.kaykay-result span { padding: 13px 18px; border: 1px solid var(--home-border); border-radius: 5px; background: var(--home-panel); }
	.kaykay-result svg { width: 64px; height: 20px; stroke: var(--home-accent); fill: none; stroke-width: 1.5; }
	.kaykay-doc-links { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); column-gap: 40px; }
	.kaykay-doc-links a { padding: 18px 0; border-top: 1px solid var(--home-border); }
	.kaykay-doc-links strong { display: flex; justify-content: space-between; font-size: 14px; font-weight: 600; }
	.kaykay-doc-links a:hover strong { color: var(--home-accent); }
	.kaykay-doc-links a > span { display: block; margin-top: 7px; color: var(--home-muted); font-size: 12px; }
	.kaykay-home-footer { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 18px; margin-top: 60px; padding-top: 22px; border-top: 1px solid var(--home-border); color: var(--home-muted); font-size: 11px; }
	.kaykay-home-footer div { display: flex; gap: 20px; }.kaykay-home-footer a:hover { color: var(--home-accent); }
	.kaykay-copy-status { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); width: max-content; max-width: calc(100vw - 48px); background: var(--home-text); color: var(--home-panel); padding: 12px 18px; border-radius: 5px; font-size: 13px; z-index: 100; }.kaykay-copy-status:empty { display: none; }
	@media (max-width: 1180px) { .kaykay-home { padding: 44px 28px 24px; }.kaykay-intro { grid-template-columns: 1fr; gap: 30px; }.kaykay-intro-copy { max-width: 580px; }h1 { font-size: 48px; }.kaykay-lead { max-width: 55ch; }.kaykay-install { max-width: 420px; }.kaykay-quick-start { gap: 28px; grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr); } }
	@media (max-width: 768px) { .kaykay-home { padding: 76px 22px 24px; }h1 { font-size: 42px; }h2 { font-size: 25px; }.kaykay-foundations { margin-top: 28px; gap: 12px; flex-direction: column; }.kaykay-section { margin-top: 44px; }.kaykay-examples { grid-template-columns: 1fr; gap: 30px; }.kaykay-preview svg { max-height: 170px; }.kaykay-example p { max-width: none; }.kaykay-quick-start { grid-template-columns: 1fr; gap: 28px; padding: 30px 0; }.kaykay-doc-links { grid-template-columns: 1fr; }.kaykay-demo-header { padding: 12px; }.kaykay-demo-header span { display: none; }.kaykay-source-header { padding: 0 8px; }.kaykay-file-options button { padding: 12px 7px; }.kaykay-home-footer { margin-top: 40px; }.kaykay-result { margin-top: 24px; } }
</style>

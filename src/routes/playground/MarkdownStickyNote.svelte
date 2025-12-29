<script lang="ts">
	import StickyNoteNode from '../../lib/components/StickyNoteNode.svelte';
	import type { NodeProps } from '../../lib/types/index.js';

	interface StickyNoteData {
		text: string;
		color?: string;
	}

	let { id, data, selected }: NodeProps<StickyNoteData> = $props();

	// Simple markdown-like renderer
	function renderMarkdown(text: string): string {
		return text
			// Links: [text](url)
			.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" style="color: #2563eb; text-decoration: underline;">$1</a>')
			// Bold: **text** or __text__
			.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
			.replace(/__(.+?)__/g, '<strong>$1</strong>')
			// Italic: *text* or _text_
			.replace(/\*(.+?)\*/g, '<em>$1</em>')
			.replace(/_(.+?)_/g, '<em>$1</em>')
			// Strikethrough: ~~text~~
			.replace(/~~(.+?)~~/g, '<del>$1</del>')
			// Code: `text`
			.replace(/`(.+?)`/g, '<code style="background: rgba(0,0,0,0.1); padding: 1px 4px; border-radius: 3px; font-family: monospace;">$1</code>')
			// Line breaks
			.replace(/\n/g, '<br>');
	}
</script>

<StickyNoteNode {id} {data} {selected}>
	{#snippet children(text)}
		{@html renderMarkdown(text)}
	{/snippet}
</StickyNoteNode>

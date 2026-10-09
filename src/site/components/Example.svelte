<script lang="ts">
	import type { Snippet } from 'svelte';
	import CodeBlock from './CodeBlock.svelte';

	import type { HighlightedSource as Source } from '#site/highlight-types.ts';

	interface Props {
		/** The demo's own source (`import source from './Demo.svelte?highlight'`). */
		source?: Source;
		/** Extra files to show beside the demo source, keyed by file name. */
		files?: Record<string, Source>;
		title?: string;
		children?: Snippet;
	}

	let { source, files = {}, title = 'Example', children }: Props = $props();

	let open = $state(false);
	// The demo's own source first, then any extra files.
	const allFiles: Record<string, Source> = $derived(
		source ? { [`${title}.svelte`]: source, ...files } : files
	);
	const entries = $derived(Object.entries(allFiles));
</script>

<figure class="example">
	<div class="example__demo">{@render children?.()}</div>
	{#if entries.length}
		<button type="button" class="example__toggle" onclick={() => (open = !open)}>
			{open ? 'Hide code' : 'Show code'}
		</button>
		{#if open}
			<div class="example__source">
				{#each entries as [name, file] (name)}
					<CodeBlock
						title={entries.length > 1 ? name : undefined}
						code={file.code}
						highlighted={file.highlighted}
					/>
				{/each}
			</div>
		{/if}
	{/if}
</figure>

<style>
	.example {
		margin: 1.5rem 0;
		border: 1px solid var(--color-border);
		border-radius: 8px;
		overflow: hidden;
	}
	.example__demo {
		padding: 1rem;
		background: var(--color-surface-subtle);
	}
	.example__toggle {
		display: block;
		width: 100%;
		padding: 0.5rem;
		font: inherit;
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--color-primary);
		background: var(--color-surface-raised);
		border: none;
		border-top: 1px solid var(--color-border);
		cursor: pointer;
	}
	.example__source {
		padding: 0 1rem;
		border-top: 1px solid var(--color-border);
	}
</style>

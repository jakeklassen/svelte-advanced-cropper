<script lang="ts">
	import { onDestroy } from 'svelte';
	import type { HighlightedCode } from '#site/highlight-types.ts';

	interface Props {
		/** Build-generated tokens from a `?highlight` import. */
		highlighted: HighlightedCode;
		code: string;
		title?: string;
	}

	let { highlighted, code, title }: Props = $props();

	let label: 'Copy' | 'Copied' | 'Copy failed' = $state('Copy');
	let resetTimer: ReturnType<typeof setTimeout> | undefined;
	let active = true;

	onDestroy(() => {
		active = false;
		clearTimeout(resetTimer);
	});

	async function copy() {
		try {
			await navigator.clipboard.writeText(code);
			if (!active) {
				return;
			}

			label = 'Copied';
		} catch {
			if (!active) {
				return;
			}

			// No clipboard access (insecure context, denied permission).
			label = 'Copy failed';
		}

		// Restart the countdown, so repeated clicks keep the label for the full time.
		clearTimeout(resetTimer);
		resetTimer = setTimeout(() => (label = 'Copy'), 1500);
	}
</script>

<div class="code-block">
	{#if title}<div class="code-block__title">{title}</div>{/if}
	<button type="button" class="code-block__copy" onclick={copy}>{label}</button>
	<!-- Keyboard users need to focus and scroll the code region. -->
	<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
	<pre
		class="shiki shiki-themes github-light github-dark"
		style={highlighted.style}
		role="region"
		aria-label={title ?? 'Source code'}
		tabindex="0"><code
			>{#each highlighted.lines as line (line)}<span class="line"
					>{#each line as token (token.offset)}<span style={token.style}>{token.content}</span
						>{/each}</span
				>{/each}</code
		></pre>
</div>

<style>
	.code-block {
		position: relative;
		margin: 1rem 0;
	}
	.code-block__title {
		font-family: var(--font-mono);
		font-size: 0.8rem;
		padding: 0.4rem 1rem;
		background: var(--color-code);
		border: 1px solid var(--color-border);
		border-bottom: none;
		border-radius: 6px 6px 0 0;
	}
	.code-block__title + :global(pre) {
		border-top-left-radius: 0;
		border-top-right-radius: 0;
		margin-top: 0;
	}
	.code-block__copy {
		position: absolute;
		top: 0.4rem;
		right: 0.4rem;
		font: inherit;
		font-size: 0.75rem;
		padding: 0.2rem 0.5rem;
		border: 1px solid var(--color-border);
		border-radius: 4px;
		background: var(--color-surface-raised);
		color: var(--color-muted);
		cursor: pointer;
		opacity: 0;
		transition: opacity 0.15s;
	}
	.code-block__title ~ .code-block__copy {
		top: 2.3rem;
	}
	.code-block:hover .code-block__copy,
	.code-block__copy:focus-visible {
		opacity: 1;
	}
</style>

<script lang="ts">
	interface Props {
		/** Pre-highlighted HTML from a `?highlight` import. */
		html: string;
		code: string;
		title?: string;
	}

	let { html, code, title }: Props = $props();

	let label: 'Copy' | 'Copied' | 'Copy failed' = $state('Copy');
	let resetTimer: ReturnType<typeof setTimeout> | undefined;

	async function copy() {
		try {
			await navigator.clipboard.writeText(code);
			label = 'Copied';
		} catch {
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
	{@html html}
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
		background: #eef0f3;
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
		background: white;
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

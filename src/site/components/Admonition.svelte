<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		type?: 'note' | 'tip' | 'info' | 'warning' | 'danger';
		title?: string;
		children?: Snippet;
	}

	let { type = 'note', title, children }: Props = $props();
</script>

<aside class="admonition admonition--{type}">
	<div class="admonition__title">{title ?? type}</div>
	<div class="admonition__content">{@render children?.()}</div>
</aside>

<style>
	.admonition {
		--accent: #6b7280;
		margin: 1.25rem 0;
		padding: 0.75rem 1rem;
		border-left: 4px solid var(--accent);
		border-radius: 6px;
		background: color-mix(in srgb, var(--accent) 9%, var(--color-surface));
	}
	.admonition--tip {
		--accent: #16a34a;
	}
	.admonition--info {
		--accent: var(--color-primary);
	}
	.admonition--warning {
		--accent: #d97706;
	}
	.admonition--danger {
		--accent: #dc2626;
	}
	.admonition__title {
		font-weight: 700;
		font-size: 0.8rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--accent);
		margin-bottom: 0.25rem;
	}
	.admonition__content :global(> :first-child) {
		margin-top: 0;
	}
	.admonition__content :global(> :last-child) {
		margin-bottom: 0;
	}
</style>

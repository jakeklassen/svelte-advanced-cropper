<script lang="ts">
	import { page } from '$app/state';
	import { isCurrentPage, pages } from '#site/nav.ts';
	import { href } from '#site/paths.ts';

	const index = $derived(pages.findIndex((entry) => isCurrentPage(page.url.pathname, entry.href)));
	const previous = $derived(index > 0 ? pages[index - 1] : undefined);
	const next = $derived(index >= 0 && index < pages.length - 1 ? pages[index + 1] : undefined);
</script>

<nav class="pager" aria-label="Docs pages">
	{#if previous}
		<a class="pager__link" href={href(previous.href)}>
			<span class="pager__label">Previous</span>
			<span class="pager__title">« {previous.title}</span>
		</a>
	{:else}
		<span></span>
	{/if}
	{#if next}
		<a class="pager__link pager__link--next" href={href(next.href)}>
			<span class="pager__label">Next</span>
			<span class="pager__title">{next.title} »</span>
		</a>
	{/if}
</nav>

<style>
	.pager {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
		margin-top: 3rem;
	}
	.pager__link {
		display: flex;
		flex-direction: column;
		padding: 0.75rem 1rem;
		border: 1px solid var(--color-border);
		border-radius: 8px;
	}
	.pager__link:hover {
		border-color: var(--color-primary);
		text-decoration: none;
	}
	.pager__link--next {
		text-align: right;
		grid-column: 2;
	}
	.pager__label {
		font-size: 0.8rem;
		color: var(--color-muted);
	}
	.pager__title {
		font-weight: 600;
	}
</style>

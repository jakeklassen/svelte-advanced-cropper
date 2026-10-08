<script lang="ts">
	import { afterNavigate } from '$app/navigation';

	interface Heading {
		id: string;
		text: string;
		level: number;
	}

	interface Props {
		/** The element holding the page content. */
		content: HTMLElement | undefined;
	}

	let { content }: Props = $props();

	let headings: Heading[] = $state([]);

	// Collect the headings on first load and after each navigation (the content element stays the
	// same, only its children change).
	afterNavigate(() => {
		if (!content) {
			return;
		}

		headings = Array.from(content.querySelectorAll<HTMLElement>('h2[id], h3[id]')).map(
			(element) => ({
				id: element.id,
				text: element.textContent ?? '',
				level: element.tagName === 'H2' ? 2 : 3
			})
		);
	});
</script>

{#if headings.length > 1}
	<nav class="toc" aria-label="On this page">
		<div class="toc__title">On this page</div>
		<ul>
			<!-- Keyed by position, not id: a page with a repeated id would crash a keyed each. -->
			{#each headings as heading, index (index)}
				<li class="toc__level-{heading.level}"><a href="#{heading.id}">{heading.text}</a></li>
			{/each}
		</ul>
	</nav>
{/if}

<style>
	.toc {
		font-size: 0.85rem;
		border-left: 1px solid var(--color-border);
		padding-left: 1rem;
	}
	.toc__title {
		font-weight: 700;
		margin-bottom: 0.5rem;
	}
	ul {
		list-style: none;
		margin: 0;
		padding: 0;
	}
	li {
		margin: 0.3rem 0;
	}
	.toc__level-3 {
		padding-left: 0.85rem;
	}
	a {
		color: var(--color-muted);
	}
	a:hover {
		color: var(--color-primary);
	}
</style>

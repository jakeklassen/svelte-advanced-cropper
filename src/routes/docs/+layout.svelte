<script lang="ts">
	import { page } from '$app/state';
	import { afterNavigate } from '$app/navigation';
	import Navbar from '#site/components/Navbar.svelte';
	import Sidebar from '#site/components/Sidebar.svelte';
	import Footer from '#site/components/Footer.svelte';
	import Toc from '#site/components/Toc.svelte';
	import DocPager from '#site/components/DocPager.svelte';
	import { pages } from '#site/nav.ts';

	let { children } = $props();

	let menuOpen = $state(false);
	let content: HTMLElement | undefined = $state();

	const title = $derived(
		pages.find((entry) => page.url.pathname.replace(/\/$/, '').endsWith(entry.href))?.title
	);

	afterNavigate(() => {
		menuOpen = false;
	});
</script>

<svelte:head>
	<title>{title ? `${title} | ` : ''}Svelte Advanced Cropper</title>
</svelte:head>

<Navbar onMenu={() => (menuOpen = true)} />

<div class="docs">
	<aside class={['docs__sidebar', menuOpen && 'docs__sidebar--open']}>
		<Sidebar onNavigate={() => (menuOpen = false)} />
	</aside>
	{#if menuOpen}
		<button
			type="button"
			class="docs__backdrop"
			aria-label="Close navigation"
			onclick={() => (menuOpen = false)}
		></button>
	{/if}
	<main class="docs__main">
		<article class="prose" bind:this={content}>
			{@render children()}
		</article>
		<DocPager />
	</main>
	<aside class="docs__toc">
		<Toc {content} />
	</aside>
</div>

<Footer />

<style>
	.docs {
		display: grid;
		grid-template-columns: 280px minmax(0, 1fr) 240px;
		min-height: calc(100vh - var(--navbar-height));
	}
	.docs__sidebar {
		border-right: 1px solid var(--color-border);
		position: sticky;
		top: var(--navbar-height);
		height: calc(100vh - var(--navbar-height));
		overflow-y: auto;
		background: white;
	}
	.docs__main {
		padding: 2rem 2.5rem 3rem;
		min-width: 0;
	}
	.docs__main article {
		max-width: 860px;
		margin: 0 auto;
	}
	.docs__toc {
		position: sticky;
		top: calc(var(--navbar-height) + 2rem);
		align-self: start;
		padding: 2rem 1rem 0 0;
		max-height: calc(100vh - var(--navbar-height) - 2rem);
		overflow-y: auto;
	}
	.docs__backdrop {
		display: none;
	}
	@media (max-width: 1200px) {
		.docs {
			grid-template-columns: 260px minmax(0, 1fr);
		}
		.docs__toc {
			display: none;
		}
	}
	@media (max-width: 996px) {
		.docs {
			grid-template-columns: minmax(0, 1fr);
		}
		.docs__main {
			padding: 1.5rem 16px 2rem;
		}
		.docs__sidebar {
			position: fixed;
			top: 0;
			left: 0;
			z-index: 40;
			width: min(300px, 85vw);
			height: 100vh;
			transform: translateX(-100%);
			transition: transform 0.2s;
		}
		.docs__sidebar--open {
			transform: none;
			box-shadow: 0 0 24px rgba(0, 0, 0, 0.2);
		}
		.docs__backdrop {
			display: block;
			position: fixed;
			inset: 0;
			z-index: 30;
			border: none;
			background: rgba(0, 0, 0, 0.4);
		}
	}
</style>

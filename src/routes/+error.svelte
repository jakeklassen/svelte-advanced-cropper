<script lang="ts">
	import { page } from '$app/state';
	import Navbar from '#site/components/Navbar.svelte';
	import Footer from '#site/components/Footer.svelte';
	import { href } from '#site/paths.ts';

	const notFound = $derived(page.status === 404);
</script>

<svelte:head>
	<title>{notFound ? 'Page not found' : 'Error'} | Svelte Advanced Cropper</title>
</svelte:head>

<Navbar />

<main class="error">
	<h1>{notFound ? 'Page not found' : `Error ${page.status}`}</h1>
	<p>
		{notFound
			? 'There is nothing at this address. It may have moved, or the link may be wrong.'
			: (page.error?.message ?? 'Something went wrong.')}
	</p>
	<p>
		<a href={href('/docs/intro')}>Read the documentation</a> or
		<a href={href('/')}>go to the home page</a>.
	</p>
</main>

<Footer />

<style>
	.error {
		max-width: 640px;
		min-height: 50vh;
		margin: 0 auto;
		padding: 4rem 24px;
	}
	h1 {
		font-size: 2.2rem;
		margin: 0 0 1rem;
	}
</style>

<script lang="ts">
	// The cropper styles, as a consumer would import `svelte-advanced-cropper/style.css`.
	import 'advanced-cropper/styles/index.scss';
	import 'advanced-cropper/themes/default.scss';
	import '#site/styles/site.css';
	import { asset } from '$app/paths';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
</script>

<svelte:head>
	<link rel="icon" href={asset('favicon.svg')} />
	<meta
		name="description"
		content="A Svelte 5 image cropper with child stencils, typed layer snippets, reactive previews and canvas export."
	/>
</svelte:head>

{@render children()}

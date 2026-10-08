<script lang="ts">
	// The cropper styles, as a consumer would import `svelte-advanced-cropper/style.css`.
	import 'advanced-cropper/styles/index.scss';
	import 'advanced-cropper/themes/default.scss';
	import '#site/styles/site.css';
	import { asset } from '$app/paths';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={asset('favicon.svg')} />
	<meta
		name="description"
		content="A flexible Svelte 5 image cropper: build the cropper your design needs. A port of react-advanced-cropper."
	/>
</svelte:head>

{@render children()}

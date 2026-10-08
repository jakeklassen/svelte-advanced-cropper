<script lang="ts">
	import { Cropper } from 'svelte-advanced-cropper';
	import { image } from '#site/paths.ts';

	const src = image('anna1991anna-0WDLQzK7u0E-unsplash.jpg');
</script>

<Cropper class="stencil-grid-example" stencilProps={{ grid: true }} {src} />

<style>
	:global(.stencil-grid-example) {
		max-height: 600px;
	}
</style>

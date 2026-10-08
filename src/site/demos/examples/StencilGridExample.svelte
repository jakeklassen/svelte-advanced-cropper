<script lang="ts">
	import { Cropper } from 'svelte-advanced-cropper';
	import { image } from '#site/paths.ts';

	const src = image('cat-on-green.jpg');
</script>

<Cropper class="stencil-grid-example" stencilProps={{ grid: true }} {src} />

<style>
	:global(.stencil-grid-example) {
		max-height: 600px;
	}
</style>

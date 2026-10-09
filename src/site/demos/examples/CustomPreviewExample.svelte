<script lang="ts">
	import { CircleStencil, Cropper } from 'svelte-advanced-cropper';
	import { image } from '#site/paths.ts';

	const src = image('orange-cat-on-yellow.jpg');
</script>

<Cropper {src} class="custom-preview-example">
	<CircleStencil />
</Cropper>

<style>
	:global(.custom-preview-example .advanced-cropper-circle-stencil__preview) {
		border: dashed 2px rgba(255, 255, 255, 0.45);
	}
</style>

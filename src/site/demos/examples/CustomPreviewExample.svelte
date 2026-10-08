<script lang="ts">
	import { CircleStencil, Cropper } from 'svelte-advanced-cropper';
	import { image } from '#site/paths.ts';

	const src = image('pexels-photo-1642574.jpeg');
</script>

<Cropper
	{src}
	class="custom-preview-example"
	stencilComponent={CircleStencil}
	stencilProps={{
		previewClassName: 'custom-preview-example__stencil-preview'
	}}
/>

<style>
	:global(.custom-preview-example__stencil-preview) {
		border: dashed 2px rgba(255, 255, 255, 0.45);
	}
</style>

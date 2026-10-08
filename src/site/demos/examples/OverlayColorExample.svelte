<script lang="ts">
	import { CircleStencil, Cropper } from 'svelte-advanced-cropper';
	import { image } from '#site/paths.ts';

	const src = image('photo-1583853287541-6e82b3d5ea12.jpg');
</script>

<Cropper
	{src}
	class="overlay-color-example"
	stencilComponent={CircleStencil}
	stencilProps={{
		overlayClassName: 'overlay-color-example__overlay'
	}}
/>

<style>
	:global(.overlay-color-example) {
		height: 500px;
		max-height: 70vh;
	}

	:global(.overlay-color-example__overlay) {
		color: #601f55eb;
	}
</style>

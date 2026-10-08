<script lang="ts">
	import { CircleStencil, Cropper, type CropperRef } from 'svelte-advanced-cropper';
	import { image } from '#site/paths.ts';

	const src = image('tabby-cat-in-shadow.jpg');

	function onChange(cropper: CropperRef) {
		console.log(cropper.getCoordinates(), cropper.getCanvas());
	}
</script>

<Cropper class="changing-stencil-example" stencilComponent={CircleStencil} {src} {onChange} />

<style>
	:global(.changing-stencil-example) {
		max-height: 600px;
		background: #354146;
	}
</style>

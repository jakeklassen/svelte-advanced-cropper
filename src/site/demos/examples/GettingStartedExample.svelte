<script lang="ts">
	import { Cropper, type CropperRef } from 'svelte-advanced-cropper';
	import { image } from '#site/paths.ts';

	const src = image('siamese-cat.jpg');

	function onChange(cropper: CropperRef) {
		console.log(cropper.getCoordinates(), cropper.getCanvas());
	}
</script>

<Cropper {src} {onChange} class="getting-started-example" />

<style>
	:global(.getting-started-example) {
		height: 600px;
		max-height: 70vh;
	}
</style>

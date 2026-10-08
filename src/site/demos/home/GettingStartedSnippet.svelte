<script lang="ts">
	import { Cropper, type CropperRef } from 'svelte-advanced-cropper';
	import 'svelte-advanced-cropper/style.css';

	const src = '/images/photo.jpg';

	function onChange(cropper: CropperRef) {
		console.log(cropper.getCoordinates(), cropper.getCanvas());
	}
</script>

<Cropper {src} {onChange} class="my-cropper" />

<style>
	:global(.my-cropper) {
		height: 500px;
	}
</style>

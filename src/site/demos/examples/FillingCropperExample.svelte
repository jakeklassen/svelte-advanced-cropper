<script lang="ts">
	import { Cropper, type CropperState } from 'svelte-advanced-cropper';
	import { image } from '#site/paths.ts';

	// Make the stencil cover the whole visible area (or the whole image before the
	// visible area is known).
	function defaultSize({ imageSize, visibleArea }: CropperState) {
		return {
			width: (visibleArea ?? imageSize).width,
			height: (visibleArea ?? imageSize).height
		};
	}
</script>

<Cropper
	class="filling-cropper-example"
	src={image('pexels-photo-6524107.jpeg')}
	{defaultSize}
/>

<style>
	:global(.filling-cropper-example) {
		max-height: 450px;
		background: #354146;
	}
</style>

<script lang="ts">
	import { Cropper, type CropperState } from 'svelte-advanced-cropper';
	import { image } from '#site/paths.ts';

	const src = image('three-puppies.jpg');

	// Make the stencil cover the whole visible area (or the whole image before the
	// visible area is known).
	function defaultSize({ imageSize, visibleArea }: CropperState) {
		return {
			width: (visibleArea ?? imageSize).width,
			height: (visibleArea ?? imageSize).height
		};
	}
</script>

<Cropper class="filling-cropper-example" {src} {defaultSize} />

<style>
	:global(.filling-cropper-example) {
		max-height: 450px;
		background: #354146;
	}
</style>

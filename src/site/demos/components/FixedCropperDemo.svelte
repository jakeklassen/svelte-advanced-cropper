<script lang="ts">
	import { FixedCropper, ImageRestriction, type CropperState } from 'svelte-advanced-cropper';
	import { image } from '#site/paths.ts';

	// A 300px square stencil, shrunk to fit when the cropper is narrower than that.
	function stencilSize({ boundary }: CropperState) {
		const size = Math.min(300, boundary.width - 40, boundary.height - 40);

		return { width: size, height: size };
	}
</script>

<FixedCropper
	class="fixed-cropper-demo"
	src={image('house-by-lake.jpg')}
	{stencilSize}
	stencilProps={{ handlers: {}, lines: {}, movable: false, resizable: false }}
	imageRestriction={ImageRestriction.stencil}
/>

<style>
	:global(.fixed-cropper-demo) {
		max-height: 450px;
		background: #354146;
	}
</style>

<script lang="ts">
	import { RectangleStencil, FixedCropper, ImageRestriction } from 'svelte-advanced-cropper';
	import { image } from '#site/paths.ts';

	const src = image('house-by-lake.jpg');
</script>

<FixedCropper
	class="fixed-size-example"
	{src}
	stencilSize={{
		width: 300,
		height: 300
	}}
	imageRestriction={ImageRestriction.stencil}
>
	<RectangleStencil handlers={false} lines={false} movable={false} resizable={false} />
</FixedCropper>

<style>
	:global(.fixed-size-example) {
		max-height: 450px;
		background: #354146;
	}
</style>

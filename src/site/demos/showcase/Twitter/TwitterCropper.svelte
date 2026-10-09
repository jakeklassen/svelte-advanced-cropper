<script lang="ts">
	import {
		FixedCropper,
		RectangleStencil,
		ImageRestriction,
		type CropperState,
		type FixedCropperProps
	} from 'svelte-advanced-cropper';
	import Wrapper from './Wrapper.svelte';

	type Props = Omit<FixedCropperProps, 'stencilSize' | 'transitions' | 'imageRestriction'>;

	let { class: cssClass, children, wrapper: customWrapper, ...cropperProps }: Props = $props();

	// A square stencil that fills the cropper, minus a margin.
	function stencilSize({ boundary }: CropperState) {
		const size = Math.min(boundary.height, boundary.width) - 48;

		return { width: size, height: size };
	}

	// Start with the largest square that fits in the image.
	function defaultSize({ imageSize }: CropperState) {
		const size = Math.min(imageSize.height, imageSize.width);

		return { width: size, height: size };
	}
</script>

<FixedCropper
	minWidth={150}
	minHeight={150}
	{defaultSize}
	{...cropperProps}
	class={['twitter-cropper', cssClass]}
	imageRestriction={ImageRestriction.stencil}
	{stencilSize}
	transitions={false}
>
	{#snippet wrapper(p)}
		{#if customWrapper}{@render customWrapper(p)}{:else}<Wrapper {...p} />{/if}
	{/snippet}
	{#if children}{@render children()}{:else}
		<RectangleStencil
			movable={false}
			resizable={false}
			lines={false}
			handlers={false}
			aspectRatio={1}
		/>
	{/if}
</FixedCropper>

<style>
	:global(.twitter-cropper.advanced-cropper) {
		background: none;
	}
	:global(.twitter-cropper .advanced-cropper-rectangle-stencil__overlay) {
		color: rgba(237, 242, 244, 0.5);
	}
	:global(.twitter-cropper .advanced-cropper-rectangle-stencil__preview) {
		border: solid 5px rgb(29, 161, 242);
	}
</style>

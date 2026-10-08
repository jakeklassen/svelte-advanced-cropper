<script lang="ts">
	import {
		FixedCropper,
		ImageRestriction,
		type CropperState,
		type FixedCropperProps
	} from 'svelte-advanced-cropper';
	import Wrapper from './Wrapper.svelte';

	type Props = Omit<FixedCropperProps, 'stencilSize' | 'transitions' | 'imageRestriction'>;

	let {
		class: className,
		stencilProps = {},
		wrapperComponent = Wrapper,
		...cropperProps
	}: Props = $props();

	// A square stencil that fills the cropper, minus a margin.
	const stencilSize = ({ boundary }: CropperState) => {
		const size = Math.min(boundary.height, boundary.width) - 48;
		return { width: size, height: size };
	};

	// Start with the largest square that fits in the image.
	const defaultSize = ({ imageSize }: CropperState) => {
		const size = Math.min(imageSize.height, imageSize.width);
		return { width: size, height: size };
	};
</script>

<FixedCropper
	minWidth={150}
	minHeight={150}
	{defaultSize}
	{...cropperProps}
	class={['twitter-cropper', className]}
	stencilProps={{
		...stencilProps,
		previewClassName: [stencilProps.previewClassName, 'twitter-cropper__preview'],
		overlayClassName: [stencilProps.overlayClassName, 'twitter-cropper__overlay'],
		movable: false,
		scalable: false,
		lines: {},
		handlers: {},
		aspectRatio: 1
	}}
	{wrapperComponent}
	imageRestriction={ImageRestriction.stencil}
	{stencilSize}
	transitions={false}
/>

<style>
	:global(.twitter-cropper.advanced-cropper) {
		background: none;
	}
	:global(.twitter-cropper .twitter-cropper__overlay) {
		color: rgba(237, 242, 244, 0.5);
	}
	:global(.twitter-cropper .twitter-cropper__preview) {
		border: solid 5px rgb(29, 161, 242);
	}
</style>

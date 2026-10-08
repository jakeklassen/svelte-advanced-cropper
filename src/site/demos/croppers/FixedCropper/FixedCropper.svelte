<script lang="ts">
	import {
		CircleStencil,
		FixedCropper,
		ImageRestriction,
		RectangleStencil,
		type CropperState,
		type FixedCropperProps,
		type FixedCropperRef
	} from 'svelte-advanced-cropper';
	import Wrapper from './Wrapper.svelte';

	type Props = Omit<FixedCropperProps, 'stencilSize'> & {
		stencilType?: 'circle' | 'rectangle';
	};

	let { class: className, stencilProps, stencilType = 'rectangle', ...props }: Props = $props();

	let cropper: FixedCropperRef | undefined = $state();

	// The stencil starts as large as the visible area allows.
	function defaultSize({ imageSize, visibleArea }: CropperState) {
		return {
			width: (visibleArea ?? imageSize).width,
			height: (visibleArea ?? imageSize).height
		};
	}

	// A square stencil with a 40px margin above and below it and a 20px margin on each side.
	// The bottom 40px of the boundary overlap the zoom slider (see Wrapper.svelte).
	function stencilSize({ boundary }: CropperState) {
		const size = Math.min(boundary.height - 2 * 40, boundary.width - 2 * 20);

		return { width: size, height: size };
	}

	// The stencil's aspect ratio depends on its type, so recompute the state when
	// `stencilType` changes.
	$effect(() => {
		void stencilType;
		cropper?.refresh();
	});
</script>

<FixedCropper
	bind:this={cropper}
	class={['fixed-cropper', className]}
	{stencilSize}
	{defaultSize}
	imageRestriction={ImageRestriction.stencil}
	stencilProps={{
		previewClassName: [
			'fixed-cropper-stencil__preview',
			stencilType === 'circle' && 'fixed-cropper-stencil__preview--circle'
		],
		overlayClassName: [
			'fixed-cropper-stencil__overlay',
			stencilType === 'circle' && 'fixed-cropper-stencil__overlay--circle'
		],
		handlers: {},
		lines: {},
		movable: false,
		resizable: false,
		...stencilProps
	}}
	stencilComponent={stencilType === 'circle' ? CircleStencil : RectangleStencil}
	wrapperComponent={Wrapper}
	{...props}
/>

<style>
	:global(.fixed-cropper.advanced-cropper) {
		display: flex;
		flex-direction: column;
		height: 100%;
		background: black;
	}
	:global(.fixed-cropper-stencil__overlay),
	:global(.fixed-cropper-stencil__preview) {
		border-radius: 10px;
	}
	:global(.fixed-cropper-stencil__overlay--circle),
	:global(.fixed-cropper-stencil__preview--circle) {
		border-radius: 50%;
	}
	:global(.fixed-cropper-stencil__preview) {
		border: solid 2px rgba(255, 255, 255, 0.5);
	}
</style>

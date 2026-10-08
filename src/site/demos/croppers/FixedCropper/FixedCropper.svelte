<script lang="ts">
	import { untrack } from 'svelte';
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
	const defaultSize = ({ imageSize, visibleArea }: CropperState) => ({
		width: (visibleArea || imageSize).width,
		height: (visibleArea || imageSize).height
	});

	// A square stencil that leaves room for the zoom slider below it.
	const stencilSize = ({ boundary }: CropperState) => {
		const size = Math.min(boundary.height - 80, boundary.width - 40);
		return { width: size, height: size };
	};

	// The stencil's aspect ratio depends on its type, so recompute the state on a change.
	$effect(() => {
		void stencilType;
		untrack(() => cropper?.refresh());
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

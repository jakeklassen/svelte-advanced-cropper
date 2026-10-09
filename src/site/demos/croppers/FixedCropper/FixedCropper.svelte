<script lang="ts">
	import {
		CircleStencil,
		FixedCropper,
		ImageRestriction,
		RectangleStencil,
		type CropperState,
		type FixedCropperProps,
		type FixedCropperInstance
	} from 'svelte-advanced-cropper';
	import Wrapper from './Wrapper.svelte';

	type Props = Omit<FixedCropperProps, 'stencilSize'> & {
		stencilType?: 'circle' | 'rectangle';
	};

	let {
		class: cssClass,
		children,
		wrapper: customWrapper,
		stencilType = 'rectangle',
		...props
	}: Props = $props();

	let cropper: FixedCropperInstance | undefined = $state();

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
</script>

<FixedCropper
	bind:this={cropper}
	class={['fixed-cropper', cssClass]}
	{stencilSize}
	{defaultSize}
	imageRestriction={ImageRestriction.stencil}
	{...props}
>
	{#snippet wrapper(p)}
		{#if customWrapper}{@render customWrapper(p)}{:else}<Wrapper {...p} />{/if}
	{/snippet}
	{#if children}{@render children()}{:else if stencilType === 'circle'}
		<CircleStencil handlers={false} lines={false} movable={false} resizable={false} />
	{:else}
		<RectangleStencil handlers={false} lines={false} movable={false} resizable={false} />
	{/if}
</FixedCropper>

<style>
	:global(.fixed-cropper.advanced-cropper) {
		display: flex;
		flex-direction: column;
		height: 100%;
		background: black;
	}
	:global(.fixed-cropper .advanced-cropper-stencil-overlay),
	:global(.fixed-cropper [class$='-stencil__preview']) {
		border-radius: 10px;
	}
	:global(.fixed-cropper .advanced-cropper-circle-stencil__overlay),
	:global(.fixed-cropper .advanced-cropper-circle-stencil__preview) {
		border-radius: 50%;
	}
	:global(.fixed-cropper [class$='-stencil__preview']) {
		border: solid 2px rgba(255, 255, 255, 0.5);
	}
</style>

<script lang="ts">
	import {
		Cropper,
		RectangleStencil,
		ImageRestriction,
		type CropperProps,
		type ResizeAlgorithm
	} from 'svelte-advanced-cropper';
	import {
		defaultSize,
		fitStencilToImage,
		resizeCoordinates,
		stencilConstraints,
		transformImage,
		zoomStencil
	} from 'advanced-cropper/showcase/mobile';
	import CropperWrapper from './CropperWrapper.svelte';

	interface Props extends Omit<
		CropperProps,
		'transitions' | 'priority' | 'imageRestriction' | 'stencilConstraints' | 'transformImage'
	> {
		navigation?: boolean;
	}

	let {
		class: cssClass,
		navigation = true,
		children,
		wrapper: customWrapper,
		...cropperProps
	}: Props = $props();

	// The mobile declaration requires unused right/bottom fields; its anchored algorithm
	// consumes the left/top movement supplied by the cropper.
	const resizeAlgorithm: ResizeAlgorithm = (state, settings, anchor, directions, options) =>
		resizeCoordinates(state, settings, anchor, { ...directions, right: 0, bottom: 0 }, options);
</script>

<Cropper
	{...cropperProps}
	{stencilConstraints}
	imageRestriction={ImageRestriction.none}
	class={['telegram-cropper', cssClass]}
	postProcess={[fitStencilToImage, zoomStencil]}
	{defaultSize}
	transformImageAlgorithm={transformImage}
	resizeCoordinatesAlgorithm={resizeAlgorithm}
	transitions
>
	{#snippet wrapper(p)}
		{#if customWrapper}{@render customWrapper(p)}{:else}<CropperWrapper {...p} {navigation} />{/if}
	{/snippet}
	{#if children}{@render children()}{:else}<RectangleStencil grid movable={false} />{/if}
</Cropper>

<style lang="scss">
	// The corners theme, applied to this cropper only, with the accent color it inherits.
	:global {
		.telegram-cropper {
			@import 'advanced-cropper/themes/corners.scss';
			color: #61dafb;
		}
	}
</style>

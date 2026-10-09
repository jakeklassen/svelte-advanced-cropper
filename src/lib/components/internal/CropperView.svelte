<script lang="ts" generics="E extends SettingsExtension = {}">
	import type { CropperProps, SettingsExtension } from '../../types';
	import type { CropperController } from '../../controllers/CropperController.svelte';
	import { stretchCropperBoundary } from 'advanced-cropper';
	import { fillLayoutBoundary } from '../../service/boundary';
	import { normalizeMoveImageOptions } from '../../controllers/normalizeMoveImageOptions';
	import { normalizeScaleImageOptions } from '../../controllers/normalizeScaleImageOptions';
	import { normalizeRotateImageOptions } from '../../controllers/normalizeRotateImageOptions';
	import CropperBackgroundImage from '../layers/CropperBackgroundImage.svelte';
	import CropperBackgroundWrapper from '../layers/CropperBackgroundWrapper.svelte';
	import CropperCanvas from './CropperCanvas.svelte';
	import CropperWrapper from '../layers/CropperWrapper.svelte';
	import StretchableBoundary from '../layers/StretchableBoundary.svelte';
	import RectangleStencil from '../stencils/RectangleStencil.svelte';

	let {
		style,
		class: cssClass,
		children,
		controller,
		wrapper,
		boundary,
		backgroundWrapper,
		background,
		canvas = true,
		crossOrigin = true,
		disabled = false,
		moveImage = true,
		scaleImage = true,
		rotateImage = false
	}: CropperProps<E> & { controller: CropperController<E> } = $props();
	const cropper = $derived(controller.api);
	const wrapperArguments = $derived({
		cropper,
		disabled,
		style,
		class: ['advanced-cropper', disabled && 'advanced-cropper--disabled', cssClass],
		children: boundaryLayer
	});
	const boundaryArguments = $derived({
		cropper,
		disabled,
		class: 'advanced-cropper__boundary',
		registerBoundary: controller.elements.boundarySlot.register,
		sizeAlgorithm: fillLayoutBoundary,
		stretchAlgorithm: stretchCropperBoundary,
		children: boundaryContent
	});
	const gestureArguments = $derived({
		cropper,
		disabled,
		class: 'advanced-cropper__background-wrapper',
		moveImage: normalizeMoveImageOptions(moveImage),
		scaleImage: normalizeScaleImageOptions(scaleImage),
		rotateImage: normalizeRotateImageOptions(rotateImage),
		children: imageContent
	});
	const backgroundArguments = $derived({
		cropper,
		disabled,
		crossOrigin,
		class: 'advanced-cropper__background',
		attachSource: controller.attachSource
	});
</script>

{#snippet imageContent()}
	{#if cropper.getState()}
		{#if background}{@render background(backgroundArguments)}{:else}<CropperBackgroundImage
				{...backgroundArguments}
			/>{/if}
	{/if}
	{#if children}{@render children()}{:else}<RectangleStencil />{/if}
{/snippet}
{#snippet boundaryContent()}
	{#if backgroundWrapper}{@render backgroundWrapper(
			gestureArguments
		)}{:else}<CropperBackgroundWrapper {...gestureArguments} />{/if}
	{#if canvas}<CropperCanvas bind:this={controller.elements.canvas} />{/if}
{/snippet}
{#snippet boundaryLayer()}
	{#if boundary}{@render boundary(boundaryArguments)}{:else}<StretchableBoundary
			{...boundaryArguments}
		/>{/if}
{/snippet}
{#if wrapper}{@render wrapper(wrapperArguments)}{:else}<CropperWrapper {...wrapperArguments} />{/if}

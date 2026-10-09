<script lang="ts" module>
	import type { TransformableImageProps } from '../gestures/TransformableImage.svelte';
	import type { Snippet } from 'svelte';
	import type { ClassValue } from 'svelte/elements';
	import type { CropperTransitions, ImageTransform } from 'advanced-cropper';
	import type { MoveImageOptions, RotateImageOptions, ScaleImageOptions } from '../../types';

	interface DesiredCropperInstance {
		transformImage: (transform: ImageTransform) => void;
		transformImageEnd: () => void;
		getTransitions: () => CropperTransitions;
	}

	export interface CropperBackgroundWrapperProps {
		cropper: DesiredCropperInstance;
		rotateImage?: boolean | RotateImageOptions;
		scaleImage?: boolean | ScaleImageOptions;
		moveImage?: boolean | MoveImageOptions;
		children?: Snippet;
		class?: ClassValue;
		style?: string;
		timeout?: number;
		onEvent?: TransformableImageProps['onEvent'];
		disabled?: boolean;
	}
</script>

<script lang="ts">
	import { normalizeMoveImageOptions } from '../../controllers/normalizeMoveImageOptions';
	import { normalizeRotateImageOptions } from '../../controllers/normalizeRotateImageOptions';
	import { normalizeScaleImageOptions } from '../../controllers/normalizeScaleImageOptions';
	import TransformableImage from '../gestures/TransformableImage.svelte';

	let {
		scaleImage = true,
		moveImage = true,
		rotateImage = false,
		children,
		class: cssClass,
		style,
		cropper,
		timeout,
		onEvent,
		disabled
	}: CropperBackgroundWrapperProps = $props();

	const transitionsActive = $derived(cropper.getTransitions().active);
	const rotateImageOptions = $derived(normalizeRotateImageOptions(rotateImage));
	const scaleImageOptions = $derived(normalizeScaleImageOptions(scaleImage));
	const moveImageOptions = $derived(normalizeMoveImageOptions(moveImage));
</script>

<TransformableImage
	class={cssClass}
	{style}
	onTransform={cropper.transformImage}
	onTransformEnd={cropper.transformImageEnd}
	touchMove={moveImageOptions.touch}
	mouseMove={moveImageOptions.mouse}
	touchScale={scaleImageOptions.touch}
	wheelScale={scaleImageOptions.wheel}
	touchRotate={rotateImageOptions.touch}
	disabled={transitionsActive || disabled}
	preventDefault={!disabled}
	{timeout}
	{onEvent}
>
	{@render children?.()}
</TransformableImage>

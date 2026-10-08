<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { ClassValue } from 'svelte/elements';
	import type { CropperTransitions, ImageTransform } from 'advanced-cropper';
	import type { MoveImageOptions, RotateImageOptions, ScaleImageOptions } from '../../types';

	interface DesiredCropperRef {
		transformImage: (transform: ImageTransform) => void;
		transformImageEnd: () => void;
		getTransitions: () => CropperTransitions;
	}

	export interface CropperBackgroundWrapperProps {
		cropper: DesiredCropperRef;
		rotateImage?: boolean | RotateImageOptions;
		scaleImage?: boolean | ScaleImageOptions;
		moveImage?: boolean | MoveImageOptions;
		children?: Snippet;
		class?: ClassValue;
		style?: string;
		timeout?: number;
		disabled?: boolean;
	}
</script>

<script lang="ts">
	import { useMoveImageOptions } from '../../hooks/useMoveImageOptions';
	import { useRotateImageOptions } from '../../hooks/useRotateImageOptions';
	import { useScaleImageOptions } from '../../hooks/useScaleImageOptions';
	import TransformableImage from './TransformableImage.svelte';

	let {
		scaleImage = true,
		moveImage = true,
		rotateImage = false,
		children,
		class: className,
		style,
		cropper,
		timeout,
		disabled
	}: CropperBackgroundWrapperProps = $props();

	const transitionsActive = $derived(cropper.getTransitions().active);
	const rotateImageOptions = $derived(useRotateImageOptions(rotateImage));
	const scaleImageOptions = $derived(useScaleImageOptions(scaleImage));
	const moveImageOptions = $derived(useMoveImageOptions(moveImage));
</script>

<TransformableImage
	class={className}
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
>
	{@render children?.()}
</TransformableImage>

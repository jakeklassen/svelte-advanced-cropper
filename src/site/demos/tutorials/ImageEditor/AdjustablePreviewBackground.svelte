<script lang="ts">
	import type { ClassValue } from 'svelte/elements';
	import {
		getPreviewStyle,
		styleToString,
		type CropperImage,
		type CropperState,
		type CropperTransitions,
		type Size
	} from 'svelte-advanced-cropper';
	import AdjustableImage from './AdjustableImage.svelte';

	interface DesiredCropperRef {
		getState: () => CropperState | null;
		getTransitions: () => CropperTransitions | null;
		getImage: () => CropperImage | null;
	}

	interface Props {
		class?: ClassValue;
		cropper: DesiredCropperRef;
		crossOrigin?: 'anonymous' | 'use-credentials' | boolean;
		brightness?: number;
		saturation?: number;
		hue?: number;
		contrast?: number;
		size?: Size | null;
	}

	let {
		class: className,
		cropper,
		crossOrigin,
		brightness = 0,
		saturation = 0,
		hue = 0,
		contrast = 0,
		size
	}: Props = $props();

	const state = $derived(cropper.getState());
	const transitions = $derived(cropper.getTransitions());
	const image = $derived(cropper.getImage());

	const style = $derived(
		image && state && size ? styleToString(getPreviewStyle(image, state, size, transitions)) : ''
	);
</script>

<AdjustableImage
	src={image?.src}
	{crossOrigin}
	{brightness}
	{saturation}
	{hue}
	{contrast}
	class={className}
	{style}
/>

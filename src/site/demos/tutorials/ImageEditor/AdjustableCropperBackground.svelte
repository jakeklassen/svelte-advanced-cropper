<script lang="ts">
	import type { ClassValue } from 'svelte/elements';
	import {
		getBackgroundStyle,
		styleToString,
		type CropperImage,
		type CropperState,
		type CropperTransitions
	} from 'svelte-advanced-cropper';
	import AdjustableImage from './AdjustableImage.svelte';

	interface DesiredCropperRef {
		getState: () => CropperState | null;
		getTransitions: () => CropperTransitions;
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
		/** The drawn element. The cropper crops from it in `getCanvas()`. */
		ref?: HTMLCanvasElement | null;
	}

	let {
		class: className,
		cropper,
		crossOrigin,
		brightness = 0,
		saturation = 0,
		hue = 0,
		contrast = 0,
		ref = $bindable(null)
	}: Props = $props();

	const state = $derived(cropper.getState());
	const transitions = $derived(cropper.getTransitions());
	const image = $derived(cropper.getImage());

	const style = $derived(
		image && state ? styleToString(getBackgroundStyle(image, state, transitions)) : ''
	);
</script>

<AdjustableImage
	bind:ref
	src={image?.src}
	{crossOrigin}
	{brightness}
	{saturation}
	{hue}
	{contrast}
	class={className}
	{style}
/>

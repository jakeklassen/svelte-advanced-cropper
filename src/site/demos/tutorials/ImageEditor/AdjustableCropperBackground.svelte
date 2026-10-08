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
	import type { Adjustments } from './filters.ts';

	interface DesiredCropperRef {
		getState: () => CropperState | null;
		getTransitions: () => CropperTransitions | null;
		getImage: () => CropperImage | null;
	}

	interface Props extends Partial<Adjustments> {
		class?: ClassValue;
		cropper: DesiredCropperRef;
		crossOrigin?: 'anonymous' | 'use-credentials' | boolean;
		/** The drawn element. The cropper crops from it in `getCanvas()`. */
		ref?: HTMLCanvasElement | null;
	}

	let {
		class: className,
		cropper,
		crossOrigin,
		ref = $bindable(null),
		...adjustments
	}: Props = $props();

	const state = $derived(cropper.getState());
	const transitions = $derived(cropper.getTransitions());
	const image = $derived(cropper.getImage());

	const style = $derived(
		image && state ? styleToString(getBackgroundStyle(image, state, transitions)) : ''
	);
</script>

<AdjustableImage
	{...adjustments}
	bind:ref
	src={image?.src}
	{crossOrigin}
	class={className}
	{style}
/>

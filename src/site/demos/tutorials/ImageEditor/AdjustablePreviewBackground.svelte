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
		size?: Size | null;
	}

	let { class: className, cropper, crossOrigin, size, ...adjustments }: Props = $props();

	const state = $derived(cropper.getState());
	const transitions = $derived(cropper.getTransitions());
	const image = $derived(cropper.getImage());

	const style = $derived(
		image && state && size ? styleToString(getPreviewStyle(image, state, size, transitions)) : ''
	);
</script>

<AdjustableImage {...adjustments} src={image?.src} {crossOrigin} class={className} {style} />

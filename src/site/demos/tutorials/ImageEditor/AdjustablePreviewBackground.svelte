<script lang="ts">
	import {
		getPreviewStyle,
		styleToString,
		type CropperPreviewBackgroundSnippetProps
	} from 'svelte-advanced-cropper';
	import AdjustableImage from './AdjustableImage.svelte';
	import type { Adjustments } from './filters.ts';

	type Props = CropperPreviewBackgroundSnippetProps & Partial<Adjustments>;
	let {
		class: cssClass,
		style,
		preview,
		crossOrigin,
		size,
		brightness,
		contrast,
		saturation,
		hue
	}: Props = $props();
	const state = $derived(preview.getState());
	const transitions = $derived(preview.getTransitions());
	const image = $derived(preview.getImage());
	const imageStyle = $derived(
		image && state && size ? styleToString(getPreviewStyle(image, state, size, transitions)) : ''
	);
</script>

<AdjustableImage
	{brightness}
	{contrast}
	{saturation}
	{hue}
	src={image?.src}
	{crossOrigin}
	class={cssClass}
	style={`${imageStyle};${style ?? ''}`}
/>

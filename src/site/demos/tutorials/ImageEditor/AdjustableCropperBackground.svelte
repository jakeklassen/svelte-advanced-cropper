<script lang="ts">
	import {
		getBackgroundStyle,
		styleToString,
		type CropperBackgroundSnippetProps
	} from 'svelte-advanced-cropper';
	import AdjustableImage from './AdjustableImage.svelte';
	import type { Adjustments } from './filters.ts';

	type Props = CropperBackgroundSnippetProps & Partial<Adjustments>;
	let {
		class: cssClass,
		style,
		cropper,
		crossOrigin,
		attachSource,
		brightness,
		contrast,
		saturation,
		hue
	}: Props = $props();
	const state = $derived(cropper.getState());
	const transitions = $derived(cropper.getTransitions());
	const image = $derived(cropper.getImage());
	const imageStyle = $derived(
		image && state ? styleToString(getBackgroundStyle(image, state, transitions)) : ''
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
	{attachSource}
/>

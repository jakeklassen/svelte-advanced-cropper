<script lang="ts">
	import {
		CropperFade,
		type CropperWrapperSnippetProps,
		type FixedCropperSettings
	} from 'svelte-advanced-cropper';
	import { getAbsoluteZoom, getZoomFactor } from 'advanced-cropper/extensions/absolute-zoom';
	import Navigation from './Navigation.svelte';

	type Props = CropperWrapperSnippetProps<FixedCropperSettings>;

	let { cropper, class: cssClass, style, children }: Props = $props();

	const state = $derived(cropper.getState());
	const settings = $derived(cropper.getSettings());

	const absoluteZoom = $derived(getAbsoluteZoom(state, settings));
	// Fade in once the image has loaded and the cropper has a state for it.
	const visible = $derived(state !== null && cropper.isLoaded());

	function onZoom(value: number, transitions = false) {
		cropper.zoomImage(getZoomFactor(state, settings, value), { transitions });
	}
</script>

<CropperFade class={['custom-wrapper', cssClass]} {style} {visible}>
	{@render children?.()}
	<Navigation class="custom-wrapper__navigation" zoom={absoluteZoom} {onZoom} />
</CropperFade>

<style>
	:global(.custom-wrapper) {
		flex-grow: 1;
		min-height: 0;
	}
	/* The fade is the cropper's root element here. Animate only the fade itself, so a
	   size change (e.g. `max-height` arriving with a late stylesheet) applies at once
	   instead of being measured halfway through a transition. */
	:global(.custom-wrapper.advanced-cropper-fade) {
		transition-property: opacity, visibility;
	}
	:global(.custom-wrapper__navigation) {
		max-width: 100%;
		width: 462px;
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		margin: 0 auto;
	}
</style>

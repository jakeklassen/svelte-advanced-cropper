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

	function onZoom(value: number) {
		cropper.zoomImage(getZoomFactor(state, settings, value), { transitions: false });
	}
</script>

<CropperFade class={['twitter-cropper-wrapper', cssClass]} {style} {visible}>
	<div class="twitter-cropper-wrapper__content">{@render children?.()}</div>
	<div class="twitter-cropper-wrapper__navigation">
		<Navigation zoom={absoluteZoom} {onZoom} />
	</div>
</CropperFade>

<style>
	.twitter-cropper-wrapper__content {
		display: flex;
		height: 100%;
		min-height: 0;
		overflow: hidden;
	}
	.twitter-cropper-wrapper__navigation {
		display: flex;
		align-items: center;
		max-width: 400px;
		width: 100%;
		margin: 0 auto;
	}
</style>

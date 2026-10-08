<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { ClassValue } from 'svelte/elements';
	import { CropperFade, type FixedCropperRef } from 'svelte-advanced-cropper';
	import { getAbsoluteZoom, getZoomFactor } from 'advanced-cropper/extensions/absolute-zoom';
	import Navigation from './Navigation.svelte';

	interface Props {
		cropper: FixedCropperRef;
		class?: ClassValue;
		style?: string;
		children?: Snippet;
	}

	let { cropper, class: className, style, children }: Props = $props();

	const state = $derived(cropper.getState());
	const settings = $derived(cropper.getSettings());
	const absoluteZoom = $derived(getAbsoluteZoom(state, settings));

	function onZoom(value: number) {
		cropper.zoomImage(getZoomFactor(state, settings, value), { transitions: false });
	}
</script>

<CropperFade
	class={['twitter-cropper-wrapper', className]}
	{style}
	visible={state && cropper.isLoaded()}
>
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

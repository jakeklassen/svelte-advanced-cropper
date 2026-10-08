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
	// As wide as the boundary's shorter side, less a 20px margin on each side.
	const navigationWidth = $derived(
		state ? Math.min(state.boundary.height, state.boundary.width) - 2 * 20 : 0
	);

	function onZoom(value: number, transitions?: boolean) {
		cropper.zoomImage(getZoomFactor(state, settings, value), {
			transitions: Boolean(transitions)
		});
	}
</script>

<CropperFade
	class={['fixed-cropper-wrapper', className]}
	{style}
	visible={state && cropper.isLoaded()}
>
	<div class="fixed-cropper-wrapper__content">{@render children?.()}</div>
	<div class="fixed-cropper-wrapper__navigation" style:width="{navigationWidth}px">
		<Navigation zoom={absoluteZoom} {onZoom} />
	</div>
</CropperFade>

<style>
	.fixed-cropper-wrapper__content {
		display: flex;
		height: 100%;
		min-height: 0;
		overflow: visible;
		/* Overlap the top half of the 80px navigation, so the stencil sits close to the slider. */
		margin-bottom: -40px;
	}
	.fixed-cropper-wrapper__navigation {
		height: 80px;
		flex-shrink: 0;
		overflow: hidden;
		margin: 0 auto;
		/* Above the cropper content that overlaps it by 40px. */
		position: relative;
	}
</style>

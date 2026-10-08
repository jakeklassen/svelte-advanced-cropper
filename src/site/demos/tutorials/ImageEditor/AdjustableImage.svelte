<script lang="ts">
	import type { ClassValue } from 'svelte/elements';
	import { CropperSource } from 'svelte-advanced-cropper';
	import { drawAdjustedImage, type Adjustments } from './filters.ts';

	interface Props extends Partial<Adjustments> {
		src?: string;
		class?: ClassValue;
		crossOrigin?: 'anonymous' | 'use-credentials' | boolean;
		style?: string;
		/** The canvas the adjusted image is drawn into. */
		ref?: HTMLCanvasElement | null;
	}

	let {
		src,
		class: className,
		crossOrigin,
		brightness = 0,
		saturation = 0,
		hue = 0,
		contrast = 0,
		style,
		ref = $bindable(null)
	}: Props = $props();

	let source: HTMLImageElement | HTMLCanvasElement | null = $state(null);

	// Draws the source image into the canvas, with the adjustments applied. It runs as an
	// effect, to redraw whenever an adjustment changes, and once more when the image loads.
	function draw() {
		// Read the adjustments before the readiness check, so the effect always tracks them,
		// even when its first run comes before the image has loaded.
		const adjustments = { brightness, contrast, saturation, hue };
		if (ref && source instanceof HTMLImageElement && source.complete) {
			drawAdjustedImage(ref, source, adjustments);
		}
	}

	$effect(draw);
</script>

<!--
	New elements for every image, as upstream keys them by `src`. A fresh canvas starts blank,
	so the previous picture never shows, stretched to the new image's size, while it loads.
-->
{#key src}
	<canvas bind:this={ref} class={['adjustable-image-element', className]} {style}></canvas>
	<CropperSource
		bind:ref={source}
		{src}
		{crossOrigin}
		class="adjustable-image-source"
		onload={draw}
	/>
{/key}

<style>
	.adjustable-image-element {
		position: absolute;
		pointer-events: none;
		user-select: none;
		transform-origin: center;
		max-width: none !important;
	}
	:global(.adjustable-image-source) {
		display: none;
	}
</style>

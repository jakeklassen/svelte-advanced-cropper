<script lang="ts">
	import type { ClassValue } from 'svelte/elements';
	import { CropperSource, type AttachBackgroundSource } from 'svelte-advanced-cropper';
	import { drawAdjustedImage, type Adjustments } from './filters.ts';

	interface Props extends Partial<Adjustments> {
		src?: string;
		class?: ClassValue;
		crossOrigin?: 'anonymous' | 'use-credentials' | boolean;
		style?: string;
		/** The canvas the adjusted image is drawn into. */
		attachSource?: AttachBackgroundSource;
	}

	let {
		src,
		class: cssClass,
		crossOrigin,
		brightness = 0,
		saturation = 0,
		hue = 0,
		contrast = 0,
		style,
		attachSource
	}: Props = $props();

	let canvas: HTMLCanvasElement | undefined = $state();
	let source: HTMLImageElement | null = $state(null);

	// Each source owns a readiness promise; registration waits for its filtered pixels.
	const readiness = $derived.by(() => {
		void src;
		let resolve: (() => void) | undefined;
		const ready = new Promise<void>((done) => {
			resolve = done;
		});

		return { ready, resolve };
	});

	// Draws the source image into the canvas, with the adjustments applied. It runs as an
	// effect, to redraw whenever an adjustment changes, and once more when the image loads.
	function draw() {
		// Read the adjustments before the readiness check, so the effect always tracks them,
		// even when its first run comes before the image has loaded.
		const adjustments = { brightness, contrast, saturation, hue };
		if (canvas && source?.complete && source.naturalWidth > 0) {
			drawAdjustedImage(canvas, source, adjustments);
			readiness.resolve?.();
		}
	}

	$effect(draw);
</script>

{#key src}
	<canvas
		bind:this={canvas}
		{@attach attachSource?.(readiness.ready)}
		class={['adjustable-image-element', cssClass]}
		{style}
	></canvas>
	<CropperSource
		bind:element={source}
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

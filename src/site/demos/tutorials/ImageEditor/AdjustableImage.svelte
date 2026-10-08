<script lang="ts">
	import type { ClassValue } from 'svelte/elements';
	import { CropperSource } from 'svelte-advanced-cropper';
	import { drawAdjustedImage } from './filters';

	interface Props {
		src?: string;
		class?: ClassValue;
		crossOrigin?: 'anonymous' | 'use-credentials' | boolean;
		brightness?: number;
		saturation?: number;
		hue?: number;
		contrast?: number;
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

	let source: HTMLImageElement | null = $state(null);

	function draw() {
		if (ref && source?.complete) {
			drawAdjustedImage(ref, source, { brightness, contrast, saturation, hue });
		}
	}

	// Redraw when the image or an adjustment changes; `onload` covers the first draw.
	$effect(draw);
</script>

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

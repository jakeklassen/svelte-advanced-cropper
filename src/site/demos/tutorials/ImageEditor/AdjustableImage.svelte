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

	let source: HTMLImageElement | HTMLCanvasElement | null = $state(null);
	// Bumped when the source image finishes loading, so the effect redraws then too.
	let loads = $state(0);

	// Redraw whenever the image loads or an adjustment changes. The adjustments are read
	// before the readiness check so they are always tracked, even if the first run
	// happens before the image has loaded.
	$effect(() => {
		const adjustments = { brightness, contrast, saturation, hue };
		void loads;
		if (ref && source instanceof HTMLImageElement && source.complete) {
			drawAdjustedImage(ref, source, adjustments);
		}
	});
</script>

{#key src}
	<canvas bind:this={ref} class={['adjustable-image-element', className]} {style}></canvas>
	<CropperSource
		bind:ref={source}
		{src}
		{crossOrigin}
		class="adjustable-image-source"
		onload={() => loads++}
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

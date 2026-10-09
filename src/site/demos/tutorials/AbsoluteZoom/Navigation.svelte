<script lang="ts">
	import type { ClassValue } from 'svelte/elements';
	import { ZoomIn, ZoomOut } from '@lucide/svelte';
	import Slider from './Slider.svelte';

	interface Props {
		/** From 0 to 1. */
		zoom: number;
		onZoom?: (value: number, transitions?: boolean) => void;
		class?: ClassValue;
	}

	let { zoom, onZoom, class: cssClass }: Props = $props();

	const BUTTON_STEP = 0.25;

	// The buttons zoom in steps, animated.
	function zoomBy(delta: number) {
		onZoom?.(Math.min(1, Math.max(0, zoom + delta)), true);
	}
</script>

<div class={['absolute-zoom-navigation', cssClass]}>
	<button
		type="button"
		class="absolute-zoom-navigation__button"
		aria-label="Zoom out"
		onclick={() => zoomBy(-BUTTON_STEP)}
	>
		<ZoomOut color="white" size={18} />
	</button>
	<Slider value={zoom} onChange={onZoom} />
	<button
		type="button"
		class="absolute-zoom-navigation__button"
		aria-label="Zoom in"
		onclick={() => zoomBy(BUTTON_STEP)}
	>
		<ZoomIn color="white" size={18} />
	</button>
</div>

<style>
	.absolute-zoom-navigation {
		height: 80px;
		display: flex;
		justify-content: center;
		align-items: center;
	}
	.absolute-zoom-navigation__button {
		flex-shrink: 0;
		cursor: pointer;
		width: 80px;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0;
		background: none;
		border: none;
		outline: none;
		transition: transform 0.5s;
		will-change: transform;
	}
	.absolute-zoom-navigation__button:hover,
	.absolute-zoom-navigation__button:focus-visible {
		transform: scale(1.1);
	}
	@media (max-width: 540px) {
		.absolute-zoom-navigation__button {
			width: 56px;
		}
	}
</style>

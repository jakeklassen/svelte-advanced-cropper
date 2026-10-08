<script lang="ts">
	import type { ClassValue } from 'svelte/elements';
	import { ZoomIn, ZoomOut } from '@lucide/svelte';
	import { isNumber } from 'svelte-advanced-cropper';
	import Slider from './Slider.svelte';

	interface Props {
		zoom?: number;
		onZoom?: (value: number, transitions?: boolean) => void;
		class?: ClassValue;
	}

	let { zoom, onZoom, class: className }: Props = $props();

	function onZoomIn() {
		if (onZoom && isNumber(zoom)) {
			onZoom(Math.min(1, zoom + 0.25), true);
		}
	}

	function onZoomOut() {
		if (onZoom && isNumber(zoom)) {
			onZoom(Math.max(0, zoom - 0.25), true);
		}
	}
</script>

<div class={['absolute-zoom-navigation', className]}>
	<button
		type="button"
		class="absolute-zoom-navigation__button"
		aria-label="Zoom out"
		onclick={onZoomOut}
	>
		<ZoomOut color="white" size={18} />
	</button>
	<Slider value={zoom} onChange={onZoom} />
	<button
		type="button"
		class="absolute-zoom-navigation__button"
		aria-label="Zoom in"
		onclick={onZoomIn}
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

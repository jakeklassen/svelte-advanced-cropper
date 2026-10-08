<script lang="ts">
	import { ZoomIn, ZoomOut } from '@lucide/svelte';
	import { isNumber } from 'svelte-advanced-cropper';
	import Slider from './Slider.svelte';

	interface Props {
		zoom?: number;
		onZoom?: (value: number, transitions?: boolean) => void;
	}

	let { zoom, onZoom }: Props = $props();

	function zoomIn() {
		if (isNumber(zoom)) onZoom?.(Math.min(1, zoom + 0.25), true);
	}

	function zoomOut() {
		if (isNumber(zoom)) onZoom?.(Math.max(0, zoom - 0.25), true);
	}
</script>

<div class="navigation">
	<button type="button" class="button" aria-label="Zoom out" onclick={zoomOut}>
		<ZoomOut size={22} />
	</button>
	<Slider value={zoom} onChange={(value) => onZoom?.(value)} />
	<button type="button" class="button" aria-label="Zoom in" onclick={zoomIn}>
		<ZoomIn size={22} />
	</button>
</div>

<style>
	.navigation {
		height: 80px;
		display: flex;
		justify-content: center;
		align-items: center;
	}
	.button {
		will-change: transform;
		cursor: pointer;
		width: 80px;
		flex-shrink: 0;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		background: none;
		border: none;
		outline: none;
		color: white;
		transition: transform 0.5s;
		padding: 0;
	}
	.button:hover,
	.button:focus-visible {
		transform: scale(1.1);
	}
</style>

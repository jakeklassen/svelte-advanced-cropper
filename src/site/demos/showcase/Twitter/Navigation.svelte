<script lang="ts">
	import { ZoomIn, ZoomOut } from '@lucide/svelte';
	import Slider from '../../croppers/FixedCropper/Slider.svelte';

	interface Props {
		/** From 0 to 1. */
		zoom: number;
		onZoom?: (value: number) => void;
	}

	let { zoom, onZoom }: Props = $props();
</script>

<div class="twitter-navigation">
	<ZoomOut class="twitter-navigation__icon" size={19} aria-hidden="true" />
	<Slider
		class="twitter-navigation__slider"
		value={zoom}
		onChange={onZoom}
		--slider-line="rgb(142, 208, 249)"
		--slider-fill="rgb(29, 161, 242)"
		--slider-halo="rgba(29, 161, 242, 0.15)"
		--slider-line-height="5px"
	/>
	<ZoomIn class="twitter-navigation__icon" size={19} aria-hidden="true" />
</div>

<style>
	/* The parent (Wrapper.svelte) sets the width and centres it. */
	.twitter-navigation {
		display: flex;
		align-items: center;
		width: 100%;
		height: 50px;
		color: rgb(101, 119, 134);
	}
	.twitter-navigation :global(.twitter-navigation__icon) {
		flex-shrink: 0;
	}
	.twitter-navigation :global(.twitter-navigation__slider) {
		margin-left: 10px;
		margin-right: 10px;
	}
</style>

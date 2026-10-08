<script lang="ts">
	import { ZoomIn, ZoomOut } from '@lucide/svelte';
	import Slider from '../../croppers/FixedCropper/Slider.svelte';

	interface Props {
		zoom?: number;
		onZoom?: (value: number) => void;
	}

	let { zoom, onZoom }: Props = $props();
</script>

<div class="navigation">
	<div class="wrapper">
		<ZoomOut class="zoom-icon" size={19} aria-hidden="true" />
		<Slider
			class="slider"
			value={zoom}
			onChange={onZoom}
			style="--slider-line: rgb(142, 208, 249); --slider-fill: rgb(29, 161, 242); --slider-halo: rgba(29, 161, 242, 0.15); --slider-line-height: 5px"
		/>
		<ZoomIn class="zoom-icon" size={19} aria-hidden="true" />
	</div>
</div>

<style>
	.navigation {
		display: flex;
		width: 100%;
		align-items: center;
		justify-content: center;
		height: 50px;
	}
	.wrapper {
		display: flex;
		align-items: center;
		max-width: 400px;
		width: 100%;
		color: rgb(101, 119, 134);
	}
	.wrapper :global(.zoom-icon) {
		flex-shrink: 0;
	}
	.wrapper :global(.slider) {
		margin-left: 10px;
		margin-right: 10px;
	}
</style>

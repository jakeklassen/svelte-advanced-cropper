<script lang="ts">
	import { Cropper, type CropperRef } from 'svelte-advanced-cropper';
	import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, ZoomIn, ZoomOut } from '@lucide/svelte';
	import SquareButton from '#site/demos/shared/SquareButton.svelte';
	import VerticalButtons from '#site/demos/shared/VerticalButtons.svelte';
	import { image } from '#site/paths.ts';

	const src = image('cat-on-green.jpg');

	let cropper: CropperRef | undefined = $state();

	// Each button moves the image by a quarter of the stencil size, in its direction.
	const directions = {
		left: { x: -1, y: 0 },
		right: { x: 1, y: 0 },
		top: { x: 0, y: -1 },
		bottom: { x: 0, y: 1 }
	};

	function move(direction: keyof typeof directions) {
		const coordinates = cropper?.getCoordinates();
		if (!cropper || !coordinates) {
			return;
		}

		const { x, y } = directions[direction];
		cropper.moveImage((x * coordinates.width) / 4, (y * coordinates.height) / 4);
	}
</script>

<div class="transform-image-example">
	<Cropper bind:this={cropper} class="transform-image-example__cropper" {src} />
	<VerticalButtons>
		<SquareButton title="Zoom In" onclick={() => cropper?.zoomImage(2)}><ZoomIn /></SquareButton>
		<SquareButton title="Zoom Out" onclick={() => cropper?.zoomImage(0.5)}><ZoomOut /></SquareButton
		>
		<SquareButton title="Move Top" onclick={() => move('top')}><ArrowUp /></SquareButton>
		<SquareButton title="Move Left" onclick={() => move('left')}><ArrowLeft /></SquareButton>
		<SquareButton title="Move Right" onclick={() => move('right')}><ArrowRight /></SquareButton>
		<SquareButton title="Move Bottom" onclick={() => move('bottom')}><ArrowDown /></SquareButton>
	</VerticalButtons>
</div>

<style>
	.transform-image-example {
		position: relative;
	}
	:global(.transform-image-example__cropper) {
		max-height: 450px;
		background: #354146;
	}
</style>

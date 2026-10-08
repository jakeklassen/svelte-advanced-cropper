<script lang="ts">
	import { Cropper, type CropperRef } from 'svelte-advanced-cropper';
	import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, ZoomIn, ZoomOut } from '@lucide/svelte';
	import SquareButton from '#site/demos/shared/SquareButton.svelte';
	import VerticalButtons from '#site/demos/shared/VerticalButtons.svelte';
	import { image } from '#site/paths.ts';

	let cropper: CropperRef | undefined = $state();

	function zoom(factor: number) {
		cropper?.zoomImage(factor);
	}

	// Move the image by a quarter of the stencil size.
	function move(direction: 'left' | 'right' | 'top' | 'bottom') {
		const coordinates = cropper?.getCoordinates();
		if (!cropper || !coordinates) {
			return;
		}

		const { width, height } = coordinates;
		if (direction === 'left') {
			cropper.moveImage(-width / 4);
		} else if (direction === 'right') {
			cropper.moveImage(width / 4);
		} else if (direction === 'top') {
			cropper.moveImage(0, -height / 4);
		} else {
			cropper.moveImage(0, height / 4);
		}
	}
</script>

<div class="transform-image-example">
	<Cropper
		bind:this={cropper}
		class="transform-image-example__cropper"
		src={image('photo-1538888649860-8fb12eb67541.jpg')}
	/>
	<VerticalButtons>
		<SquareButton title="Zoom In" onclick={() => zoom(2)}><ZoomIn /></SquareButton>
		<SquareButton title="Zoom Out" onclick={() => zoom(0.5)}><ZoomOut /></SquareButton>
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

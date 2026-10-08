<script lang="ts">
	import { Cropper, type CropperRef } from 'svelte-advanced-cropper';
	import {
		RotateCcw,
		RotateCw,
		Save,
		// Named by the mirror axis that is drawn: a vertical axis means a horizontal flip.
		TrianglesCenterlineDashedHorizontal as FlipVerticalIcon,
		TrianglesCenterlineDashedVertical as FlipHorizontalIcon
	} from '@lucide/svelte';
	import SquareButton from '#site/demos/shared/SquareButton.svelte';
	import VerticalButtons from '#site/demos/shared/VerticalButtons.svelte';
	import { image } from '#site/paths.ts';

	let cropper: CropperRef | undefined = $state();

	function flip(horizontal: boolean, vertical: boolean) {
		cropper?.flipImage(horizontal, vertical);
	}

	function rotate(angle: number) {
		cropper?.rotateImage(angle);
	}

	// Open the cropped result in a new tab.
	function download() {
		const result = cropper?.getCanvas()?.toDataURL();
		const newTab = window.open();
		if (newTab && result) {
			newTab.document.body.innerHTML = `<img src="${result}">`;
		}
	}
</script>

<div class="rotate-image-example">
	<Cropper
		bind:this={cropper}
		class="rotate-image-example__cropper"
		src={image('photo-1600353068867-5b4de71e3afb.jpg')}
	/>
	<VerticalButtons>
		<SquareButton title="Flip Horizontal" onclick={() => flip(true, false)}>
			<FlipHorizontalIcon />
		</SquareButton>
		<SquareButton title="Flip Vertical" onclick={() => flip(false, true)}>
			<FlipVerticalIcon />
		</SquareButton>
		<SquareButton title="Rotate Clockwise" onclick={() => rotate(90)}><RotateCw /></SquareButton>
		<SquareButton title="Rotate Counter-Clockwise" onclick={() => rotate(-90)}>
			<RotateCcw />
		</SquareButton>
		<SquareButton title="Download" onclick={download}><Save /></SquareButton>
	</VerticalButtons>
</div>

<style>
	.rotate-image-example {
		position: relative;
	}
	:global(.rotate-image-example__cropper) {
		max-height: 450px;
		background: #354146;
	}
</style>

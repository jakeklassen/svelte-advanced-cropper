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

	const src = image('golden-puppy.jpg');

	let cropper: CropperRef | undefined = $state();

	// Open the cropped result in a new tab.
	function openResultInNewTab() {
		const canvas = cropper?.getCanvas();
		if (!canvas) {
			return;
		}

		const newTab = window.open();
		if (newTab) {
			newTab.document.body.innerHTML = `<img src="${canvas.toDataURL()}">`;
		}
	}
</script>

<div class="rotate-image-example">
	<Cropper bind:this={cropper} class="rotate-image-example__cropper" {src} />
	<VerticalButtons>
		<SquareButton title="Flip Horizontal" onclick={() => cropper?.flipImage(true, false)}>
			<FlipHorizontalIcon />
		</SquareButton>
		<SquareButton title="Flip Vertical" onclick={() => cropper?.flipImage(false, true)}>
			<FlipVerticalIcon />
		</SquareButton>
		<SquareButton title="Rotate Clockwise" onclick={() => cropper?.rotateImage(90)}
			><RotateCw /></SquareButton
		>
		<SquareButton title="Rotate Counter-Clockwise" onclick={() => cropper?.rotateImage(-90)}>
			<RotateCcw />
		</SquareButton>
		<SquareButton title="Download" onclick={openResultInNewTab}><Save /></SquareButton>
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

<script lang="ts" module>
	import type { CropperState, DrawOptions } from 'advanced-cropper';

	export type { CropperCanvasMethods } from './methods';
</script>

<script lang="ts">
	import { drawCroppedArea } from 'advanced-cropper';

	let canvas: HTMLCanvasElement | undefined = $state();
	let spareCanvas: HTMLCanvasElement | undefined = $state();

	export function draw(
		state: CropperState,
		image: HTMLElement,
		options: DrawOptions = {}
	): HTMLCanvasElement | null {
		if (!image || !canvas || !spareCanvas) {
			return null;
		}

		const result = drawCroppedArea(
			state,
			image as HTMLImageElement | HTMLCanvasElement,
			canvas,
			spareCanvas,
			options
		);
		// To export a rotated or flipped image, the core first draws the whole photo, turned,
		// into the spare canvas. Upstream keeps that copy (about 96 MB for a 24 MP photo) for
		// as long as the cropper is mounted; shrinking the canvas frees it.
		spareCanvas.width = 0;
		spareCanvas.height = 0;

		return result;
	}
</script>

<canvas class="advanced-cropper-canvas" bind:this={canvas}></canvas>
<canvas class="advanced-cropper-canvas" bind:this={spareCanvas}></canvas>

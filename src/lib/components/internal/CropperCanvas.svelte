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
		image: HTMLImageElement | HTMLCanvasElement,
		options: DrawOptions = {}
	): HTMLCanvasElement | null {
		if (!image || !canvas || !spareCanvas) {
			return null;
		}

		const result = drawCroppedArea(state, image, canvas, spareCanvas, options);
		// To export a rotated or flipped image, the core first draws the whole photo, turned,
		// into the spare canvas. Shrink it after export to release that copy (92 MB for
		// a 24 MP photo, measured in Chrome) while the cropper remains mounted.
		spareCanvas.width = 0;
		spareCanvas.height = 0;

		return result;
	}
</script>

<canvas class="advanced-cropper-canvas" bind:this={canvas}></canvas>
<canvas class="advanced-cropper-canvas" bind:this={spareCanvas}></canvas>

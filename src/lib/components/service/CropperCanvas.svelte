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

		return drawCroppedArea(
			state,
			image as HTMLImageElement | HTMLCanvasElement,
			canvas,
			spareCanvas,
			options
		);
	}
</script>

<canvas class="advanced-cropper-canvas" bind:this={canvas}></canvas>
<canvas class="advanced-cropper-canvas" bind:this={spareCanvas}></canvas>

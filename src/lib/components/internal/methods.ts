import type { CropperState, DrawOptions } from 'advanced-cropper';

/** What `CropperCanvas` exports. */
export interface CropperCanvasMethods {
	draw: (
		state: CropperState,
		image: HTMLImageElement | HTMLCanvasElement,
		options?: DrawOptions
	) => HTMLCanvasElement | null;
}

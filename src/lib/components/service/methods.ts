import type { CropperState, DrawOptions, Size } from 'advanced-cropper';

/** What `StretchableBoundary` (or a registered boundary) exports. */
export interface StretchableBoundaryMethods {
	stretchTo: (size: Size | null) => Promise<Size | null>;
	reset: () => void;
}

/** What `CropperCanvas` exports. */
export interface CropperCanvasMethods {
	draw: (
		state: CropperState,
		image: HTMLImageElement | HTMLCanvasElement,
		options?: DrawOptions
	) => HTMLCanvasElement | null;
}

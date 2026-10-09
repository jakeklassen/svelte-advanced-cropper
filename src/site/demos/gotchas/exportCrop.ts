import type { CropperRef } from 'svelte-advanced-cropper';

// The longest side to export at, largest first. A phone that can't make the first may manage
// the second.
const MAX_SIDES = [2048, 1280];

export interface ExportedCrop {
	blob: Blob;
	width: number;
	height: number;
	/** The size limit the export succeeded at. */
	maxSide: number;
}

function toJpeg(canvas: HTMLCanvasElement): Promise<Blob | null> {
	return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9));
}

/**
 * Exports the crop as a JPEG of at most 2048 px a side, trying again at 1280 px when the
 * browser can't make the larger one. Transparent areas are painted `fillColor`. Resolves
 * null when neither size works, or when no photo is loaded.
 */
export async function exportCrop(
	cropper: CropperRef,
	{ fillColor = 'white' }: { fillColor?: string } = {}
): Promise<ExportedCrop | null> {
	for (const maxSide of MAX_SIDES) {
		const canvas = cropper.getCanvas({ maxWidth: maxSide, maxHeight: maxSide, fillColor });
		if (!canvas) {
			return null;
		}

		const { width, height } = canvas;
		// A canvas that is too big, or a tab short of memory, gives null here: no error is thrown.
		const blob = await toJpeg(canvas);
		// getCanvas() draws into the same canvas every time. Shrinking it frees its pixels
		// until the next export.
		canvas.width = 0;
		canvas.height = 0;
		if (blob) {
			return { blob, width, height, maxSide };
		}
	}

	return null;
}

import { getOptions } from 'advanced-cropper';
import type { RotateImageOptions } from '../types';

export interface DefinedRotateImageOptions {
	touch: boolean;
}

/** Normalises the `rotateImage` setting. Pure; wrap in `$derived` for reactive input. */
export function useRotateImageOptions(
	rotateImage: RotateImageOptions | boolean
): DefinedRotateImageOptions {
	return getOptions(
		rotateImage,
		{
			touch: true
		},
		{
			touch: false
		}
	);
}

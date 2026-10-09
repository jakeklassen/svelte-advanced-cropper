import { getOptions } from 'advanced-cropper';
import type { RotateImageOptions } from '../types';

export interface NormalizedRotateImageOptions {
	touch: boolean;
}

export function normalizeRotateImageOptions(
	rotateImage: RotateImageOptions | boolean
): NormalizedRotateImageOptions {
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

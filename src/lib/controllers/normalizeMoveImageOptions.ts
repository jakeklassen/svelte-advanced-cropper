import { getOptions } from 'advanced-cropper';
import type { MoveImageOptions } from '../types';

export interface NormalizedMoveImageOptions {
	touch: boolean;
	mouse: boolean;
}

export function normalizeMoveImageOptions(
	moveImage: MoveImageOptions | boolean
): NormalizedMoveImageOptions {
	return getOptions(
		moveImage,
		{
			touch: true,
			mouse: true
		},
		{
			touch: false,
			mouse: false
		}
	);
}

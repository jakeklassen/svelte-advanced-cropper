import { getOptions } from 'advanced-cropper';
import type { MoveImageOptions } from '../types';

export interface DefinedMoveImageOptions {
	touch: boolean;
	mouse: boolean;
}

/**
 * Normalises the `moveImage` setting into explicit `touch`/`mouse` flags. Upstream
 * memoises the result with `useMemo`. Here it is a pure function, so wrap it in
 * `$derived` when the input is reactive.
 */
export function useMoveImageOptions(
	moveImage: MoveImageOptions | boolean
): DefinedMoveImageOptions {
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

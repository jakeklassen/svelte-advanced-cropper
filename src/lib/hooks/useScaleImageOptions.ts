import { getOptions } from 'advanced-cropper';
import type { ScaleImageOptions } from '../types';

export interface DefinedScaleImageOptions {
	touch: boolean;
	wheel:
		| boolean
		| {
				ratio: number;
		  };
}

/** Normalises the `scaleImage` setting. Pure; wrap in `$derived` for reactive input. */
export function useScaleImageOptions(
	scaleImage: ScaleImageOptions | boolean
): DefinedScaleImageOptions {
	return getOptions(
		scaleImage,
		{
			touch: true,
			wheel: {
				ratio: 0.1
			}
		},
		{
			touch: false,
			wheel: false
		}
	);
}

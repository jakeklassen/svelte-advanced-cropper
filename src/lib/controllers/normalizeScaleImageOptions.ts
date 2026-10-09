import type { ScaleImageOptions } from '../types';

export interface NormalizedScaleImageOptions {
	touch: boolean;
	wheel: false | { ratio: number };
}

export function normalizeScaleImageOptions(
	value: ScaleImageOptions | boolean
): NormalizedScaleImageOptions {
	if (typeof value === 'boolean') {
		return { touch: value, wheel: value ? { ratio: 0.1 } : false };
	}

	const wheel = value.wheel;

	return {
		touch: value.touch ?? true,
		wheel:
			wheel === false ? false : { ratio: typeof wheel === 'object' ? (wheel.ratio ?? 0.1) : 0.1 }
	};
}

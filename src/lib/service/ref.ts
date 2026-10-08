import type {
	AbstractCropperRef,
	AbstractCropperSettings
} from '../components/AbstractCropper.types';

/** Every method of the cropper ref, in upstream order. */
export const cropperRefMethods = [
	'reset',
	'refresh',
	'setImage',
	'reconcileState',
	'moveCoordinates',
	'moveCoordinatesEnd',
	'resizeCoordinates',
	'clear',
	'resizeCoordinatesEnd',
	'moveImage',
	'flipImage',
	'zoomImage',
	'rotateImage',
	'transformImage',
	'transformImageEnd',
	'setCoordinates',
	'setVisibleArea',
	'startTransitions',
	'setState',
	'hasInteractions',
	'getStencilCoordinates',
	'getCoordinates',
	'getVisibleArea',
	'getTransforms',
	'getTransitions',
	'getInteractions',
	'getSettings',
	'getState',
	'getDefaultState',
	'getCanvas',
	'getImage',
	'isLoading',
	'isLoaded'
] as const satisfies readonly (keyof AbstractCropperRef)[];

/**
 * Builds a ref whose methods call through to the inner cropper's ref. `Cropper`
 * and `FixedCropper` wrap `AbstractCropper`, and this lets `bind:this` on them
 * expose the same methods.
 */
export function forwardCropperRef<Settings extends AbstractCropperSettings>(
	getRef: () => AbstractCropperRef<Settings> | null | undefined
): AbstractCropperRef<Settings> {
	const result: Record<string, (...args: unknown[]) => unknown> = {};
	for (const method of cropperRefMethods) {
		result[method] = (...args: unknown[]) => {
			const ref = getRef();
			if (!ref) {
				throw new Error(`Cannot call ${method}() before the cropper is mounted.`);
			}

			return (ref[method] as (...args: unknown[]) => unknown)(...args);
		};
	}

	return result as unknown as AbstractCropperRef<Settings>;
}

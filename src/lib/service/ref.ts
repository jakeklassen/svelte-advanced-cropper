import type {
	AbstractCropperRef,
	AbstractCropperSettings
} from '../components/AbstractCropper.types';

// Every method of the cropper ref, in upstream order. `satisfies` makes this fail to
// compile when a method is missing or unknown, so the list can't drift from the type.
const forwardedMethods = {
	reset: true,
	refresh: true,
	setImage: true,
	reconcileState: true,
	moveCoordinates: true,
	moveCoordinatesEnd: true,
	resizeCoordinates: true,
	clear: true,
	resizeCoordinatesEnd: true,
	moveImage: true,
	flipImage: true,
	zoomImage: true,
	rotateImage: true,
	transformImage: true,
	transformImageEnd: true,
	setCoordinates: true,
	setVisibleArea: true,
	startTransitions: true,
	setState: true,
	hasInteractions: true,
	getStencilCoordinates: true,
	getCoordinates: true,
	getVisibleArea: true,
	getTransforms: true,
	getTransitions: true,
	getInteractions: true,
	getSettings: true,
	getState: true,
	getDefaultState: true,
	getCanvas: true,
	getImage: true,
	isLoading: true,
	isLoaded: true
} satisfies Record<keyof AbstractCropperRef, true>;

export const cropperRefMethods = Object.keys(forwardedMethods) as (keyof AbstractCropperRef)[];

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
				throw new Error(
					`Cannot call ${method}() before the cropper is mounted or after it is destroyed.`
				);
			}

			return (ref[method] as (...args: unknown[]) => unknown)(...args);
		};
	}

	return result as unknown as AbstractCropperRef<Settings>;
}

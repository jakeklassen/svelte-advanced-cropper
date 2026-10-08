import { tick, untrack } from 'svelte';
import {
	isConsistentState,
	type AbstractCropperInstanceCallbacks,
	type AbstractCropperInstanceParameters,
	type CropperImage,
	type DrawOptions
} from 'advanced-cropper';
import type {
	CropperCanvasMethods,
	StretchableBoundaryMethods
} from '../components/service/methods';
import type { ExtendedSettings, SettingsExtension } from '../types';
import type {
	AbstractCropperRef,
	AbstractCropperSettings
} from '../components/AbstractCropper.types';
import { type CropperInstanceSettingsProp, useCropperInstance } from './useCropperInstance.svelte';
import { useCropperImage } from './useCropperImage.svelte';
import { useWindowResize } from './useWindowResize.svelte';
import { useUpdateEffect } from './useUpdateEffect.svelte';
import { useCropperAutoReconcile } from './useCropperAutoReconcile.svelte';

export interface AbstractCropperHookProps<Settings extends AbstractCropperSettings>
	extends
		AbstractCropperInstanceParameters<Settings>,
		AbstractCropperInstanceCallbacks<AbstractCropperRef<Settings>> {
	src?: string | null;
	checkOrientation?: boolean;
	canvas?: boolean;
	crossOrigin?: 'anonymous' | 'use-credentials' | boolean;
	onReady?: (cropper: AbstractCropperRef<Settings>) => void;
	onError?: (cropper: AbstractCropperRef<Settings>) => void;
	onUpdate?: (cropper: AbstractCropperRef<Settings>) => void;
	unloadTime?: number;
	autoReconcileState?: boolean;
	settings?: CropperInstanceSettingsProp<Settings>;
}

/**
 * Element and component references the cropper needs. Components bind into these:
 * `bind:this={refs.boundary}`, `bind:this={refs.canvas}`, and the background
 * component's `bind:ref={refs.image}`.
 */
export interface AbstractCropperRefs {
	image: HTMLElement | null;
	boundary: StretchableBoundaryMethods | null;
	canvas: CropperCanvasMethods | null;
}

// `$state.raw` fields: bindable, but component instances are never wrapped in a proxy.
class CropperRefs implements AbstractCropperRefs {
	image: HTMLElement | null = $state.raw(null);
	boundary: StretchableBoundaryMethods | null = $state.raw(null);
	canvas: CropperCanvasMethods | null = $state.raw(null);
}

/**
 * The engine behind `AbstractCropper`: it creates the cropper instance, loads the
 * image, sizes the boundary, keeps the state reconciled with the settings, and
 * returns the public `cropper` interface (the same object that `bind:this` on a
 * cropper exposes and that callbacks receive).
 *
 * Call it during component initialisation. `props` is a getter so that the latest
 * prop values are read on demand.
 */
export function useAbstractCropper<Extension extends SettingsExtension = {}>(
	props: () => AbstractCropperHookProps<ExtendedSettings<Extension>>
) {
	type Settings = ExtendedSettings<Extension>;

	const refs: AbstractCropperRefs = new CropperRefs();

	let currentImage = $state.raw<CropperImage | null>(null);

	// Callbacks only fire while the cropper is mounted, as upstream's ref is null
	// before mount and after unmount.
	let mounted = false;
	$effect(() => {
		mounted = true;
		return () => {
			mounted = false;
		};
	});

	const cropper = useCropperInstance<Settings, AbstractCropperRef<Settings>>(() => ({
		...props(),
		getInstance() {
			return mounted ? cropperInterface : null;
		}
	}));

	const cropperImage = useCropperImage(() => {
		const {
			src,
			crossOrigin = true,
			checkOrientation = true,
			unloadTime = 500,
			canvas = true
		} = props();
		return {
			src,
			crossOrigin,
			checkOrientation,
			unloadTime,
			canvas,
			onError() {
				if (mounted) untrack(props).onError?.(cropperInterface);
			}
		};
	});

	// Upstream reads `autoReconcileState` once, at mount.
	const autoReconcile = useCropperAutoReconcile(
		cropper,
		untrack(props).autoReconcileState ?? true,
		() => {
			const state = cropper.getState();
			return !state || isConsistentState(state, cropper.getSettings());
		}
	);

	const resetCropper = async () => {
		const boundaryRef = refs.boundary;
		if (boundaryRef) {
			autoReconcile.pause();
			const image = cropperImage.getImage();
			const boundary = await boundaryRef.stretchTo(image);
			const previousImage = currentImage;
			currentImage = image;
			// Let the new image render before resetting, like upstream's state callback.
			await tick();
			if (boundary && image) {
				cropper.reset(boundary, image);
			} else {
				cropper.clear();
			}
			autoReconcile.resume();
			if (image && image !== previousImage) {
				// Wait for the reset state to render, so getCanvas() works inside onReady.
				await tick();
				if (mounted) untrack(props).onReady?.(cropperInterface);
			}
		}
	};

	const refreshCropper = async () => {
		const boundaryRef = refs.boundary;
		if (boundaryRef) {
			autoReconcile.pause();
			const image = cropperImage.getImage();
			const boundary = await boundaryRef.stretchTo(image);
			if (boundary && image) {
				const state = cropper.getState();
				if (state) {
					if (
						boundary.width !== state.boundary.width ||
						boundary.height !== state.boundary.height
					) {
						cropper.setBoundary(boundary);
						// After a boundary change the state may break restrictions that held before.
						cropper.reconcileState();
					}
				} else {
					cropper.reset(boundary, image);
				}
			} else {
				cropper.clear();
			}
			autoReconcile.resume();
		}
	};

	const cropperInterface: AbstractCropperRef<Settings> = {
		reset: () => resetCropper(),
		refresh: () => refreshCropper(),
		setImage: (image: CropperImage) => {
			currentImage = image;
		},
		reconcileState: cropper.reconcileState,
		moveCoordinates: cropper.moveCoordinates,
		moveCoordinatesEnd: cropper.moveCoordinatesEnd,
		resizeCoordinates: cropper.resizeCoordinates,
		clear: cropper.clear,
		resizeCoordinatesEnd: cropper.resizeCoordinatesEnd,
		moveImage: cropper.moveImage,
		flipImage: cropper.flipImage,
		zoomImage: cropper.zoomImage,
		rotateImage: cropper.rotateImage,
		transformImage: cropper.transformImage,
		transformImageEnd: cropper.transformImageEnd,
		setCoordinates: cropper.setCoordinates,
		setVisibleArea: cropper.setVisibleArea,
		startTransitions: cropper.startTransitions,
		setState: cropper.setState,
		hasInteractions: cropper.hasInteractions,
		getStencilCoordinates: cropper.getStencilCoordinates,
		getCoordinates: cropper.getCoordinates,
		getVisibleArea: cropper.getVisibleArea,
		getTransforms: cropper.getTransforms,
		getTransitions: cropper.getTransitions,
		getInteractions: cropper.getInteractions,
		getSettings: cropper.getSettings,
		getState: cropper.getState,
		getDefaultState() {
			const state = cropper.getState();
			const image = cropperImage.getImage();
			if (state && image) {
				return cropper.createDefaultState(state.boundary, image);
			} else {
				return null;
			}
		},
		getCanvas: (options?: DrawOptions) => {
			const state = cropper.getState();
			if (refs.image && refs.canvas && state) {
				return refs.canvas.draw(state, refs.image, options);
			} else {
				return null;
			}
		},
		getImage: () => {
			return currentImage ? { ...currentImage } : null;
		},
		isLoading: () => cropperImage.isLoading(),
		isLoaded: () => cropperImage.isLoaded()
	};

	useWindowResize(() => {
		void refreshCropper();
	});

	useUpdateEffect(
		() => {
			void resetCropper();
		},
		() => cropperImage.getImage()
	);

	useUpdateEffect(
		() => {
			if (mounted) untrack(props).onUpdate?.(cropperInterface);
		},
		() => [cropperImage.isLoaded(), cropperImage.isLoading()]
	);

	return {
		cropper: cropperInterface,
		refs,
		get image() {
			return currentImage;
		}
	};
}

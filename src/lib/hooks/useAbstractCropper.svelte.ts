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
	/** The drawn background: an `<img>`, or a `<canvas>` for custom backgrounds. */
	image: HTMLImageElement | HTMLCanvasElement | null;
	boundary: StretchableBoundaryMethods | null;
	canvas: CropperCanvasMethods | null;
}

// `$state.raw` fields: bindable, but component instances are never wrapped in a proxy.
class CropperRefs implements AbstractCropperRefs {
	image: HTMLImageElement | HTMLCanvasElement | null = $state.raw(null);
	boundary: StretchableBoundaryMethods | null = $state.raw(null);
	canvas: CropperCanvasMethods | null = $state.raw(null);
}

// The ref's state-changing methods run untracked. Called from a user's `$effect`, the
// state they read would otherwise become that effect's dependencies, and their own
// writes would re-run it.
function untracked<Args extends unknown[], Result>(method: (...args: Args) => Result) {
	return (...args: Args) => untrack(() => method(...args));
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

	// The image the cropper shows. It trails the loader's image: a reset sizes the
	// boundary for a newly loaded image first, then shows it.
	let displayedImage = $state.raw<CropperImage | null>(null);

	// Callbacks only fire while the cropper is mounted, as upstream's ref is null
	// before mount and after unmount.
	let mounted = false;
	$effect(() => {
		mounted = true;

		return () => {
			mounted = false;
		};
	});

	// User callbacks run untracked, so the values they read never become dependencies
	// of the effect that fired them.
	function fire(callback: 'onReady' | 'onUpdate' | 'onError') {
		if (mounted) {
			untrack(props)[callback]?.(cropperInterface);
		}
	}

	const cropper = useCropperInstance<Settings, AbstractCropperRef<Settings>>(() => ({
		...props(),
		getInstance() {
			return mounted ? cropperInterface : null;
		}
	}));

	const imageLoader = useCropperImage(() => {
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
			onError: () => fire('onError')
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

	// Reset and refresh await the boundary (a custom boundary's stretchTo may be async).
	// Each call takes a token; a call superseded by a newer one, or finishing after
	// unmount, stops before touching the state. A reset supersedes pending refreshes,
	// but a refresh (e.g. on window resize) never cancels a reset. Auto-reconcile
	// always resumes.
	let latestReset = 0;
	let latestRefresh = 0;

	// The image the latest reset is showing. That reset fires onReady for it itself, once
	// the reset state has rendered, so that getCanvas() works inside onReady; the
	// displayed-image effect below skips it.
	let imageShownByReset: CropperImage | null = null;

	const resetCropper = async () => {
		const boundaryComponent = refs.boundary;
		if (!boundaryComponent) {
			return;
		}

		const id = ++latestReset;
		latestRefresh++;
		const isCurrent = () => id === latestReset && mounted;
		autoReconcile.pause();
		try {
			const image = imageLoader.getImage();
			const boundarySize = await boundaryComponent.stretchTo(image);
			if (!isCurrent()) {
				return;
			}

			const imageChanged = image !== null && image !== displayedImage;
			imageShownByReset = image;
			displayedImage = image;
			// Let the new image render before resetting, like upstream's state callback.
			await tick();
			if (!isCurrent()) {
				return;
			}

			if (boundarySize && image) {
				cropper.reset(boundarySize, image);
			} else {
				cropper.clear();
			}

			if (imageChanged) {
				await tick();
				if (isCurrent()) {
					fire('onReady');
				}
			}
		} finally {
			// A superseded reset must leave the marker to the newer reset that owns it.
			if (id === latestReset) {
				imageShownByReset = null;
			}

			autoReconcile.resume();
		}
	};

	const refreshCropper = async () => {
		const boundaryComponent = refs.boundary;
		if (!boundaryComponent) {
			return;
		}

		const id = ++latestRefresh;
		const isCurrent = () => id === latestRefresh && mounted;
		autoReconcile.pause();
		try {
			const image = imageLoader.getImage();
			const boundarySize = await boundaryComponent.stretchTo(image);
			if (!isCurrent()) {
				return;
			}

			if (!boundarySize || !image) {
				cropper.clear();

				return;
			}

			const state = cropper.getState();
			if (!state) {
				cropper.reset(boundarySize, image);

				return;
			}

			const boundaryChanged =
				boundarySize.width !== state.boundary.width ||
				boundarySize.height !== state.boundary.height;
			if (boundaryChanged) {
				cropper.setBoundary(boundarySize);
				// After a boundary change the state may break restrictions that held before.
				cropper.reconcileState();
			}
		} finally {
			autoReconcile.resume();
		}
	};

	const cropperInterface: AbstractCropperRef<Settings> = {
		reset: untracked(resetCropper),
		refresh: untracked(refreshCropper),
		setImage: untracked((image: CropperImage) => {
			displayedImage = image;
		}),
		reconcileState: untracked(cropper.reconcileState),
		moveCoordinates: untracked(cropper.moveCoordinates),
		moveCoordinatesEnd: untracked(cropper.moveCoordinatesEnd),
		resizeCoordinates: untracked(cropper.resizeCoordinates),
		clear: untracked(cropper.clear),
		resizeCoordinatesEnd: untracked(cropper.resizeCoordinatesEnd),
		moveImage: untracked(cropper.moveImage),
		flipImage: untracked(cropper.flipImage),
		zoomImage: untracked(cropper.zoomImage),
		rotateImage: untracked(cropper.rotateImage),
		transformImage: untracked(cropper.transformImage),
		transformImageEnd: untracked(cropper.transformImageEnd),
		setCoordinates: untracked(cropper.setCoordinates),
		setVisibleArea: untracked(cropper.setVisibleArea),
		startTransitions: untracked(cropper.startTransitions),
		setState: untracked(cropper.setState),
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
			const image = imageLoader.getImage();
			if (!state || !image) {
				return null;
			}

			return cropper.createDefaultState(state.boundary, image);
		},
		getCanvas: (options?: DrawOptions) => {
			const state = cropper.getState();
			if (!refs.image || !refs.canvas || !state) {
				return null;
			}

			return refs.canvas.draw(state, refs.image, options);
		},
		getImage: () => (displayedImage ? { ...displayedImage } : null),
		isLoading: () => imageLoader.isLoading(),
		isLoaded: () => imageLoader.isLoaded()
	};

	useWindowResize(() => {
		void refreshCropper();
	});

	useUpdateEffect(
		() => {
			void resetCropper();
		},
		() => imageLoader.getImage()
	);

	// Upstream fires onReady whenever the displayed image changes to a new image, after
	// it renders. Changes made by a reset are left to the reset (see imageShownByReset).
	useUpdateEffect(
		() => {
			if (displayedImage && displayedImage !== imageShownByReset) {
				fire('onReady');
			}
		},
		() => displayedImage
	);

	useUpdateEffect(
		() => fire('onUpdate'),
		() => [imageLoader.isLoaded(), imageLoader.isLoading()]
	);

	return {
		cropper: cropperInterface,
		refs,
		// A getter: destructuring the result would lose reactivity.
		get image() {
			return displayedImage;
		}
	};
}

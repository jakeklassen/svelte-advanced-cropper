import { onDestroy, tick, untrack } from 'svelte';
import { isUndefined, loadImage, promiseTimeout, type CropperImage } from 'advanced-cropper';

export interface CropperImageHookSettings {
	src?: string | null;
	onLoadingStart?: () => void;
	onLoadingEnd?: () => void;
	onError?: () => void;
	onLoad?: (image?: CropperImage) => void;
	crossOrigin?: 'anonymous' | 'use-credentials' | boolean;
	checkOrientation?: boolean;
	canvas?: string | boolean;
	unloadTime?: number;
}

type ImageUpdate = CropperImage | null | ((previous: CropperImage | null) => CropperImage | null);

export interface CropperImageHook {
	isLoading(): boolean;
	isLoaded(): boolean;
	getImage(): CropperImage | null;
	/** Replaces the image. Like a React state setter, it also accepts an updater function. */
	setImage(image: ImageUpdate): void;
}

/**
 * Loads `src` into a `CropperImage`, with EXIF orientation handling and CORS options.
 *
 * Pass a getter (`() => ({ src })`) so the hook follows `src` as it changes. A plain
 * object, as upstream takes, also works but is read once. Call it during component
 * initialisation. The returned getters are reactive.
 *
 * Callback order matches upstream: `onLoadingStart`, then `onLoadingEnd`, then
 * `onLoad` once the new image has rendered. Two fixes over upstream: each load is
 * identified by a request token, so a stale response can't win when `src` goes
 * A → B → A, and pending work is dropped when the component is destroyed.
 */
export function useCropperImage(
	settings: CropperImageHookSettings | (() => CropperImageHookSettings)
): CropperImageHook {
	const options = typeof settings === 'function' ? settings : () => settings;
	let image = $state.raw<CropperImage | null>(null);
	let loading = $state(false);
	let loaded = $state(false);

	// Incremented for every new src and on destroy; async work checks it is still current.
	let request = 0;

	// `options()` may read many reactive values, but a derived only notifies when its own
	// value changes, so the loading effect below runs once per distinct src.
	const src = $derived(options().src || null);

	function startLoading(source: string) {
		const id = ++request;
		const isCurrent = () => id === request;
		const {
			onLoadingStart,
			onLoadingEnd,
			onError,
			crossOrigin,
			checkOrientation,
			canvas,
			unloadTime
		} = options();

		// When replacing a loaded image, give the old one `unloadTime` ms to fade out.
		const fadeOut = loaded && unloadTime ? promiseTimeout(unloadTime) : undefined;
		loaded = false;
		loading = true;
		onLoadingStart?.();

		const load = loadImage(source, {
			crossOrigin: isUndefined(crossOrigin) ? canvas : crossOrigin,
			checkOrientation
		});

		Promise.all([load, fadeOut]).then(
			([loadedImage]) => {
				if (!isCurrent()) {
					return;
				}

				onLoadingEnd?.();
				loading = false;
				image = loadedImage;
			},
			() => {
				if (!isCurrent()) {
					return;
				}

				onError?.();
				onLoadingEnd?.();
				loading = false;
			}
		);
	}

	function unloadImage() {
		const id = ++request;
		const { unloadTime } = options();
		loaded = false;
		// Upstream leaves `loading` stuck at true if src is cleared mid-load.
		loading = false;
		if (!unloadTime) {
			image = null;

			return;
		}

		void promiseTimeout(unloadTime).then(() => {
			if (id === request) {
				image = null;
			}
		});
	}

	$effect(() => {
		const next = src;
		// Untracked: starting a load reads `loaded` and the other options.
		untrack(() => {
			if (next) {
				startLoading(next);
			} else {
				unloadImage();
			}
		});
	});

	// Upstream reacts to the committed image: when it changes to a new image, mark it
	// loaded and fire onLoad after it renders. Several setImage calls in a row, or
	// setting the same image again, produce one onLoad (for the latest image) or none.
	$effect(() => {
		const committed = image;
		if (!committed) {
			return;
		}

		loaded = true;
		const id = request;
		void tick().then(() => {
			if (id === request && image === committed) {
				options().onLoad?.(committed);
			}
		});
	});

	onDestroy(() => request++);

	return {
		isLoading() {
			return loading;
		},
		isLoaded() {
			return loaded;
		},
		getImage() {
			return image;
		},
		setImage(update) {
			image = typeof update === 'function' ? update(image) : update;
		}
	};
}

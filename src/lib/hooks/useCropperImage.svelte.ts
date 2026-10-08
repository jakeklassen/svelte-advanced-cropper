import { tick, untrack } from 'svelte';
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
 * Upstream takes the options object directly. Svelte passes a getter so the hook
 * can track `src`. Call it during component initialisation. The returned getters
 * are reactive.
 *
 * Callback order matches upstream: `onLoadingStart`, then `onLoadingEnd`, then
 * `onLoad` once the new image has rendered. Two fixes over upstream: each load is
 * identified by a request token, so a stale response can't win when `src` goes
 * A → B → A, and pending work is dropped when the component is destroyed.
 */
export function useCropperImage(options: () => CropperImageHookSettings): CropperImageHook {
	let image = $state.raw<CropperImage | null>(null);
	let loading = $state(false);
	let loaded = $state(false);

	let currentSrc: string | null = null;
	let initialized = false;
	// Incremented for every new src and on destroy; async work checks it is still current.
	let request = 0;

	const applyImage = (value: CropperImage | null, current: () => boolean) => {
		image = value;
		if (value) {
			loaded = true;
			// Upstream fires onLoad from an effect, i.e. after the image has rendered.
			void tick().then(() => {
				if (current()) untrack(options).onLoad?.(value);
			});
		}
	};

	$effect(() => {
		return () => {
			request++;
		};
	});

	$effect(() => {
		const { src } = options();
		untrack(() => {
			const next = src || null;
			if (initialized && currentSrc === next) return;
			initialized = true;
			currentSrc = next;
			const id = ++request;
			const current = () => id === request;

			const {
				onLoadingStart,
				onLoadingEnd,
				onError,
				crossOrigin,
				checkOrientation,
				canvas,
				unloadTime
			} = options();
			const wasLoaded = loaded;
			loaded = false;

			if (src) {
				loading = true;
				onLoadingStart?.();
				const promises: Promise<unknown>[] = [
					loadImage(src, {
						crossOrigin: isUndefined(crossOrigin) ? canvas : crossOrigin,
						checkOrientation
					})
				];

				if (wasLoaded && unloadTime) {
					promises.push(promiseTimeout(unloadTime));
				}

				Promise.all(promises).then(
					(responses) => {
						if (!current()) return;
						onLoadingEnd?.();
						loading = false;
						applyImage((responses as [CropperImage])[0], current);
					},
					() => {
						if (!current()) return;
						onError?.();
						onLoadingEnd?.();
						loading = false;
					}
				);
			} else {
				// Upstream leaves `loading` stuck at true if src is cleared mid-load.
				loading = false;
				if (unloadTime) {
					void promiseTimeout(unloadTime).then(() => {
						if (current()) image = null;
					});
				} else {
					image = null;
				}
			}
		});
	});

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
			const value = typeof update === 'function' ? update(image) : update;
			const id = request;
			applyImage(value, () => id === request);
		}
	};
}

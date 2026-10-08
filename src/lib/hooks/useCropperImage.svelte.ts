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

	let currentSrc: string | null = null;
	let initialized = false;
	// Incremented for every new src and on destroy; async work checks it is still current.
	let request = 0;

	const applyImage = (value: CropperImage | null) => {
		image = value;
	};

	// Upstream reacts to the committed image: when it changes to a new image, mark it
	// loaded and fire onLoad after it renders. Several setImage calls in a row, or
	// setting the same image again, produce one onLoad (for the latest image) or none.
	$effect(() => {
		const value = image;
		if (!value) {
			return;
		}

		untrack(() => {
			loaded = true;
			const id = request;
			void tick().then(() => {
				if (id === request && image === value) {
					untrack(options).onLoad?.(value);
				}
			});
		});
	});

	$effect(() => {
		return () => {
			request++;
		};
	});

	$effect(() => {
		const { src } = options();
		untrack(() => {
			const next = src || null;
			if (initialized && currentSrc === next) {
				return;
			}

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
						if (!current()) {
							return;
						}

						onLoadingEnd?.();
						loading = false;
						applyImage((responses as [CropperImage])[0]);
					},
					() => {
						if (!current()) {
							return;
						}

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
						if (current()) {
							image = null;
						}
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
			applyImage(typeof update === 'function' ? update(image) : update);
		}
	};
}

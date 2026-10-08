import { untrack } from 'svelte';
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

export interface CropperImageHook {
	isLoading(): boolean;
	isLoaded(): boolean;
	getImage(): CropperImage | null;
	setImage(image: CropperImage | null): void;
}

/**
 * Loads `src` into a `CropperImage`, with EXIF orientation handling, CORS options,
 * and a guard against out-of-order loads when `src` changes quickly.
 *
 * Upstream takes the options object directly. Svelte passes a getter so the hook
 * can track `src`. Call it during component initialisation. The returned getters
 * are reactive.
 */
export function useCropperImage(options: () => CropperImageHookSettings): CropperImageHook {
	let image = $state.raw<CropperImage | null>(null);
	let loading = $state(false);
	let loaded = $state(false);

	let currentSrc: string | null = null;
	let initialized = false;

	const setImage = (value: CropperImage | null) => {
		image = value;
		if (value) {
			loaded = true;
			untrack(options).onLoad?.(value);
		}
	};

	$effect(() => {
		const { src } = options();
		untrack(() => {
			const next = src || null;
			if (initialized && currentSrc === next) return;
			initialized = true;
			currentSrc = next;
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
				void Promise.all(promises)
					.then((responses) => {
						const [result] = responses as [CropperImage];
						if (currentSrc === src) {
							setImage(result);
						}
					})
					.catch(() => {
						if (currentSrc === src) {
							onError?.();
						}
					})
					.finally(() => {
						if (currentSrc === src) {
							onLoadingEnd?.();
							loading = false;
						}
					});
			} else {
				// Upstream leaves `loading` stuck at true if src is cleared mid-load.
				loading = false;
				if (unloadTime) {
					void promiseTimeout(unloadTime).then(() => {
						if (currentSrc === null) {
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
		setImage
	};
}

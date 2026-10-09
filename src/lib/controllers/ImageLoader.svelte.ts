import { onDestroy, tick, untrack } from 'svelte';
import { isUndefined, loadImage, promiseTimeout, type CropperImage } from 'advanced-cropper';

export interface ImageLoaderOptions {
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

async function assertBlobReadable(src: string): Promise<void> {
	const response = await fetch(src);
	await response.body?.cancel();
}

function release(loadedImage: CropperImage | null) {
	if (loadedImage?.revoke) {
		URL.revokeObjectURL(loadedImage.src);
	}
}

type ImageUpdate = CropperImage | null | ((previous: CropperImage | null) => CropperImage | null);

export interface LoadedImage {
	isLoading: () => boolean;
	isLoaded: () => boolean;
	getImage: () => CropperImage | null;
	setImage: (image: ImageUpdate) => void;
}

export class ImageLoader implements LoadedImage {
	isLoading: LoadedImage['isLoading'];
	isLoaded: LoadedImage['isLoaded'];
	getImage: LoadedImage['getImage'];
	setImage: LoadedImage['setImage'];
	constructor(settings: ImageLoaderOptions | (() => ImageLoaderOptions)) {
		const options = typeof settings === 'function' ? settings : () => settings;
		let image = $state.raw<CropperImage | null>(null);
		let loading = $state(false);
		let loaded = $state(false);

		// Incremented for every new src and on destroy; async work checks it is still current.
		let request = 0;

		// The image this loader last loaded and showed. `setImage` doesn't change it: the loader only
		// releases what it loaded itself.
		let lastLoadedImage: CropperImage | null = null;

		function commit(next: CropperImage | null) {
			image = next;
			loaded = Boolean(next);
		}

		function show(loadedImage: CropperImage | null) {
			release(lastLoadedImage);
			lastLoadedImage = loadedImage;
			commit(loadedImage);
		}

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

			// Fails fast where the core's load would hang (see assertBlobReadable).
			const readable =
				checkOrientation && source.startsWith('blob:') ? assertBlobReadable(source) : undefined;

			Promise.all([load, fadeOut, readable]).then(
				([loadedImage]) => {
					if (!isCurrent()) {
						release(loadedImage);

						return;
					}

					onLoadingEnd?.();
					loading = false;
					show(loadedImage);
				},
				() => {
					// The photo itself may have loaded even though the blob check failed.
					void load.then(release, () => {});
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
			// The core leaves `loading` stuck at true if src is cleared mid-load.
			loading = false;
			if (!unloadTime) {
				show(null);

				return;
			}

			void promiseTimeout(unloadTime).then(() => {
				if (id === request) {
					show(null);
				}
			});
		}

		// Registered before the src effect, so it runs first when both change in one flush:
		// a src change must then clear `loaded` and supersede this image's onLoad.
		//
		// The core reacts to the committed image: when it changes to a new image,
		// fire onLoad after it renders. Several setImage calls in a row, or
		// setting the same image again, produce one onLoad (for the latest image) or none.
		$effect(() => {
			const committed = image;
			if (!committed) {
				return;
			}

			const id = request;
			void tick().then(() => {
				if (id === request && image === committed) {
					options().onLoad?.(committed);
				}
			});
		});

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

		onDestroy(() => {
			request++;
			release(lastLoadedImage);
		});

		const api: LoadedImage = {
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
				commit(typeof update === 'function' ? update(image) : update);
			}
		};
		this.isLoading = api.isLoading;
		this.isLoaded = api.isLoaded;
		this.getImage = api.getImage;
		this.setImage = api.setImage;
	}
}

import { onDestroy, onMount, tick, untrack } from 'svelte';
import { on } from 'svelte/events';
import {
	isConsistentState,
	isInitializedState,
	type CropperImage,
	type DrawOptions
} from 'advanced-cropper';
import type { CropperCanvasMethods } from '../components/internal/methods';
import type {
	CropperInstance,
	CropperProps,
	CropperSettings,
	SettingsExtension,
	StencilOptions,
	AttachBackgroundSource,
	BackgroundElement,
	BoundaryHandle
} from '../types';
import { ReactiveCropperEngine } from './ReactiveCropperEngine.svelte';
import { ImageLoader } from './ImageLoader.svelte';
import { observeReconciliation } from './observeReconciliation.svelte';
import { StencilRegistry } from './StencilRegistry.svelte';
import { provideCropperContext } from '../context/cropper';
import { RegistrationSlot } from './RegistrationSlot.svelte';
import { normalizeSettings } from './settings';

class ExportSource {
	ready = $state(false);
	readonly element: BackgroundElement;
	readonly image: CropperImage | null;
	constructor(element: BackgroundElement, image: CropperImage | null) {
		this.element = element;
		this.image = image;
	}
}
class CropperElements {
	readonly source = new RegistrationSlot<ExportSource>();
	readonly boundarySlot = new RegistrationSlot<BoundaryHandle>();
	canvas: CropperCanvasMethods | null = $state.raw(null);
	get boundary() {
		return this.boundarySlot.value;
	}
}

function untracked<Args extends unknown[], Result>(method: (...args: Args) => Result) {
	return (...args: Args) => untrack(() => method(...args));
}

export class CropperController<E extends SettingsExtension = {}> {
	readonly api: CropperInstance<E>;
	readonly elements = new CropperElements();
	readonly stencils = new StencilRegistry();
	readonly attachSource: AttachBackgroundSource;
	constructor(
		props: () => CropperProps<E>,
		normalize: (
			props: CropperProps<E>,
			options: StencilOptions
		) => CropperSettings<E> = normalizeSettings
	) {
		type Settings = CropperSettings<E>;
		const registry = this.stencils;

		const elements = this.elements;

		let displayedImage = $state.raw<CropperImage | null>(null);

		this.attachSource = (ready) => {
			const image = displayedImage;

			return (element) => {
				const source = new ExportSource(element, image);
				const cleanup = elements.source.register(source);
				let active = true;
				const markReady = () => {
					if (active && displayedImage === image) {
						source.ready = true;
					}
				};

				let removeListeners: (() => void) | undefined;
				const awaitSource = () => {
					if (!active || displayedImage !== image) {
						return;
					}

					if (!(element instanceof HTMLImageElement)) {
						markReady();

						return;
					}

					if (element.complete) {
						if (element.naturalWidth > 0) {
							markReady();
						}
					} else {
						const loaded = () => {
							removeListeners?.();
							if (element.naturalWidth > 0) {
								markReady();
							}
						};

						const failed = () => removeListeners?.();
						const removeLoad = on(element, 'load', loaded);
						const removeError = on(element, 'error', failed);
						removeListeners = () => {
							removeLoad();
							removeError();
						};
					}
				};

				if (ready) {
					void ready.then(awaitSource, () => {});
				} else {
					awaitSource();
				}

				return () => {
					active = false;
					removeListeners?.();
					cleanup();
				};
			};
		};

		let mounted = false;
		onMount(() => {
			mounted = true;

			return () => {
				mounted = false;
			};
		});

		function fire(callback: 'onReady' | 'onUpdate' | 'onError') {
			if (mounted) {
				untrack(() => props()[callback]?.(cropperInterface));
			}
		}

		const cropper = new ReactiveCropperEngine<Settings, CropperInstance<E>>(() => ({
			transitions: true,
			...props(),
			settings: normalize(props(), registry.readOptions()),
			getInstance() {
				return mounted ? cropperInterface : null;
			}
		}));

		const imageLoader = new ImageLoader(() => {
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

		const autoReconcile = observeReconciliation(
			cropper,
			() => props().autoReconcileState ?? true,
			() => {
				const state = cropper.getState();

				return !state || isConsistentState(state, cropper.getSettings());
			}
		);

		let latestReset = 0;
		let latestRefresh = 0;
		let resetActive = false;
		let refreshQueued = false;
		let releaseReset: (() => void) | undefined;
		let releaseRefresh: (() => void) | undefined;
		let refreshActive = false;
		const refreshWaiters: { resolve: () => void; reject: (error: unknown) => void }[] = [];

		let imageShownByReset: CropperImage | null = null;
		// Remember notification identity without retaining unloaded image bytes.
		let lastReadyImage: WeakRef<CropperImage> | null = null;

		async function notifyReady(image: CropperImage, isCurrent: () => boolean) {
			await tick();
			if (
				!isCurrent() ||
				!isInitializedState(cropper.getState()) ||
				displayedImage !== image ||
				lastReadyImage?.deref() === image
			) {
				return;
			}

			if (props().canvas !== false) {
				const source = elements.source.value;
				if (!source?.ready || source.image !== image) {
					return;
				}
			}

			if (isCurrent() && displayedImage === image && lastReadyImage?.deref() !== image) {
				lastReadyImage = new WeakRef(image);
				fire('onReady');
			}
		}

		const resetCropper = async () => {
			const boundary = elements.boundary;
			if (!boundary) {
				return;
			}

			releaseReset?.();
			releaseRefresh?.();
			refreshActive = false;
			const id = ++latestReset;
			resetActive = true;
			const stencilEpoch = registry.epoch;
			const boundaryEpoch = elements.boundarySlot.epoch;
			latestRefresh++;
			const isCurrent = () =>
				id === latestReset &&
				mounted &&
				boundary === elements.boundary &&
				boundaryEpoch === elements.boundarySlot.epoch &&
				stencilEpoch === registry.epoch;
			const release = autoReconcile.pause();
			releaseReset = release;
			try {
				const image = imageLoader.getImage();
				const boundarySize = await boundary.stretchTo(image);
				if (!isCurrent()) {
					return;
				}

				imageShownByReset = image;
				displayedImage = image;
				await tick();
				if (!isCurrent()) {
					return;
				}

				if (boundarySize && image) {
					cropper.reset(boundarySize, image);
				} else {
					cropper.clear();
				}

				if (image) {
					await notifyReady(image, isCurrent);
				}
			} finally {
				if (id === latestReset) {
					imageShownByReset = null;
					resetActive = false;
					if (refreshQueued) {
						refreshQueued = false;
						const waiters = refreshWaiters.splice(0);
						void refreshCropper().then(
							() => {
								for (const waiter of waiters) {
									waiter.resolve();
								}
							},
							(error: unknown) => {
								for (const waiter of waiters) {
									waiter.reject(error);
								}
							}
						);
					}
				}

				release();
			}
		};

		const refreshCropper = async () => {
			if (resetActive) {
				refreshQueued = true;

				return new Promise<void>((resolve, reject) => {
					refreshWaiters.push({ resolve, reject });
				});
			}

			const boundary = elements.boundary;
			if (!boundary) {
				return;
			}

			releaseRefresh?.();
			refreshActive = true;
			const id = ++latestRefresh;
			const stencilEpoch = registry.epoch;
			const boundaryEpoch = elements.boundarySlot.epoch;
			const isCurrent = () =>
				id === latestRefresh &&
				mounted &&
				boundary === elements.boundary &&
				boundaryEpoch === elements.boundarySlot.epoch &&
				stencilEpoch === registry.epoch;
			const release = autoReconcile.pause();
			releaseRefresh = release;
			try {
				const image = imageLoader.getImage();
				const boundarySize = await boundary.stretchTo(image);
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
					if (displayedImage) {
						await notifyReady(displayedImage, isCurrent);
					}

					return;
				}

				const boundaryChanged =
					boundarySize.width !== state.boundary.width ||
					boundarySize.height !== state.boundary.height;
				if (boundaryChanged) {
					cropper.setBoundary(boundarySize);
					cropper.reconcileState();
				}
			} finally {
				release();
				if (id === latestRefresh) {
					refreshActive = false;
				}
			}
		};

		const cropperInterface: CropperInstance<E> = {
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
			setCoordinates: untracked((transforms, options) => {
				cropper.setCoordinates(
					(Array.isArray(transforms) ? transforms : [transforms]).map((transform) =>
						typeof transform === 'function'
							? (state) => transform(state, cropper.getSettings())
							: transform
					),
					options
				);
			}),
			setVisibleArea: untracked(cropper.setVisibleArea),
			startTransitions: untracked(cropper.startTransitions),
			setState: untracked((modifier, options) => {
				cropper.setState(
					typeof modifier === 'function'
						? (state) => modifier(state, cropper.getSettings())
						: modifier,
					options
				);
			}),
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
				const source = elements.source.value;
				if (
					!source?.ready ||
					source.image !== displayedImage ||
					!elements.canvas ||
					!state ||
					props().canvas === false
				) {
					return null;
				}

				return elements.canvas.draw(state, source.element, options);
			},
			getImage: () => (displayedImage ? { ...displayedImage } : null),
			isLoading: () => imageLoader.isLoading(),
			isLoaded: () => imageLoader.isLoaded()
		};

		const loadedImage = $derived(imageLoader.getImage());
		const currentImage = $derived(displayedImage);
		const loadingStatus = $derived(
			Number(imageLoader.isLoaded()) + 2 * Number(imageLoader.isLoading())
		);
		// Compare the first run against initialization too: mount callbacks may change values.
		let previousLoadedImage = untrack(() => loadedImage);
		let previousImage = untrack(() => currentImage);
		let previousStatus = untrack(() => loadingStatus);
		$effect(() => {
			const image = loadedImage;
			if (image === previousLoadedImage) {
				return;
			}

			previousLoadedImage = image;
			untrack(() => {
				void resetCropper();
			});
		});
		$effect(() => {
			const image = currentImage;
			if (image === previousImage) {
				return;
			}

			previousImage = image;
			untrack(() => {
				if (image && image !== imageShownByReset) {
					void notifyReady(image, () => mounted);
				}
			});
		});
		$effect(() => {
			const status = loadingStatus;
			if (status === previousStatus) {
				return;
			}

			previousStatus = status;
			untrack(() => fire('onUpdate'));
		});

		$effect(() => {
			const source = elements.source.value;
			const ready = source?.ready;
			const initialized = isInitializedState(cropper.getState());
			const image = displayedImage;
			const enabled = props().canvas !== false;
			if (initialized && image && (!enabled || (ready && source?.image === image))) {
				untrack(() => {
					void notifyReady(image, () => mounted && !resetActive && Boolean(cropper.getState()));
				});
			}
		});

		this.api = cropperInterface;
		provideCropperContext({
			cropper: cropperInterface,
			get disabled() {
				return props().disabled ?? false;
			},
			get image() {
				return displayedImage;
			},
			registerStencil(getOptions) {
				const cleanup = registry.register(getOptions);
				onDestroy(cleanup);

				return cleanup;
			}
		});
		let lastEpoch = registry.epoch;
		let lastBoundaryEpoch = -1;
		$effect(() => {
			registry.commit();
			const options = registry.readOptions();
			normalize(
				untrack(() => ({ ...props(), transformImage: { ...props().transformImage } })),
				options
			);

			const boundaryEpoch = elements.boundarySlot.epoch;
			// Option reads remain tracked even with automatic settings reconciliation disabled.
			untrack(() => {
				const boundaryChanged = lastBoundaryEpoch !== boundaryEpoch;
				lastBoundaryEpoch = boundaryEpoch;
				if (boundaryChanged || registry.epoch !== lastEpoch) {
					releaseReset?.();
					releaseRefresh?.();
				}

				if ((boundaryChanged || registry.epoch !== lastEpoch) && resetActive) {
					void resetCropper();
				}

				if (
					(boundaryChanged || (registry.epoch !== lastEpoch && refreshActive)) &&
					!resetActive &&
					imageLoader.getImage()
				) {
					if (cropper.getState()) {
						void refreshCropper();
					} else {
						void resetCropper();
					}
				}

				if (registry.epoch !== lastEpoch) {
					lastEpoch = registry.epoch;
					const interactions = cropper.getInteractions();
					if (interactions.moveCoordinates) {
						cropper.moveCoordinatesEnd();
					}

					if (interactions.resizeCoordinates) {
						cropper.resizeCoordinatesEnd();
					}
				}

				autoReconcile.request();
			});
		});
		onDestroy(() => {
			mounted = false;
			releaseReset?.();
			releaseRefresh?.();
			cropper.dispose();
			for (const waiter of refreshWaiters.splice(0)) {
				waiter.resolve();
			}
		});
	}
}

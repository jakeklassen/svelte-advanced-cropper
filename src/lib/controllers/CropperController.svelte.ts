import { onDestroy, tick, untrack } from 'svelte';
import { isConsistentState, type CropperImage, type DrawOptions } from 'advanced-cropper';
import type {
	CropperCanvasMethods,
	StretchableBoundaryMethods
} from '../components/service/methods';
import type {
	CropperInstance,
	CropperProps,
	CropperSettings,
	SettingsExtension,
	StencilOptions,
	AttachBackgroundSource,
	BackgroundElement
} from '../types';
import { ReactiveCropperEngine } from './ReactiveCropperEngine.svelte';
import { ImageLoader } from './ImageLoader.svelte';
import { listenForWindowResize } from './listenForWindowResize.svelte';
import { observeChanges } from './observeChanges.svelte';
import { observeReconciliation } from './observeReconciliation.svelte';
import { StencilRegistry } from './StencilRegistry.svelte';
import { provideCropperContext } from '../context/cropper';
import { RegistrationSlot } from './RegistrationSlot.svelte';
import { normalizeSettings } from './settings';

class ExportSource {
	ready = $state(false);
	constructor(
		readonly element: BackgroundElement,
		readonly image: CropperImage | null
	) {}
}
class CropperElements {
	readonly source = new RegistrationSlot<ExportSource>();
	readonly boundarySlot = new RegistrationSlot<StretchableBoundaryMethods>();
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
				const loaded = element instanceof HTMLImageElement ? element.decode() : Promise.resolve();
				void Promise.all([loaded, ready]).then(
					() => {
						if (active && displayedImage === image) {
							source.ready = true;
						}
					},
					() => {}
				);

				return () => {
					active = false;
					cleanup();
				};
			};
		};

		let mounted = false;
		$effect(() => {
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
			untrack(props).autoReconcileState ?? true,
			() => {
				const state = cropper.getState();

				return !state || isConsistentState(state, cropper.getSettings());
			}
		);

		let latestReset = 0;
		let latestRefresh = 0;
		let resetActive = false;
		let refreshQueued = false;
		const refreshWaiters: { resolve: () => void; reject: (error: unknown) => void }[] = [];

		let imageShownByReset: CropperImage | null = null;
		let lastReadyImage: CropperImage | null = null;

		async function notifyReady(image: CropperImage, isCurrent: () => boolean) {
			await tick();
			if (!isCurrent() || displayedImage !== image || lastReadyImage === image) {
				return;
			}

			if (props().canvas !== false) {
				const source = elements.source.value;
				if (!source?.ready || source.image !== image) {
					return;
				}
			}

			if (isCurrent() && displayedImage === image && lastReadyImage !== image) {
				lastReadyImage = image;
				fire('onReady');
			}
		}

		const resetCropper = async () => {
			const boundary = elements.boundary;
			if (!boundary) {
				return;
			}

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
			autoReconcile.pause();
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

				autoReconcile.resume();
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

			const id = ++latestRefresh;
			const stencilEpoch = registry.epoch;
			const boundaryEpoch = elements.boundarySlot.epoch;
			const isCurrent = () =>
				id === latestRefresh &&
				mounted &&
				boundary === elements.boundary &&
				boundaryEpoch === elements.boundarySlot.epoch &&
				stencilEpoch === registry.epoch;
			autoReconcile.pause();
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
				autoReconcile.resume();
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

		listenForWindowResize(() => {
			void refreshCropper();
		});

		observeChanges(
			() => {
				void resetCropper();
			},
			() => imageLoader.getImage()
		);

		observeChanges(
			() => {
				if (displayedImage && displayedImage !== imageShownByReset) {
					void notifyReady(displayedImage, () => mounted);
				}
			},
			() => displayedImage
		);

		observeChanges(
			() => fire('onUpdate'),
			() => [imageLoader.isLoaded(), imageLoader.isLoading()]
		);

		$effect(() => {
			const source = elements.source.value;
			const ready = source?.ready;
			const image = displayedImage;
			const enabled = props().canvas !== false;
			if (image && (!enabled || (ready && source?.image === image))) {
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
			if (typeof options.aspectRatio === 'function') {
				options.aspectRatio();
			}

			const boundaryEpoch = elements.boundarySlot.epoch;
			// Option reads remain tracked even with automatic settings reconciliation disabled.
			void options;
			untrack(() => {
				const boundaryChanged = lastBoundaryEpoch !== boundaryEpoch;
				lastBoundaryEpoch = boundaryEpoch;
				if ((boundaryChanged || registry.epoch !== lastEpoch) && resetActive) {
					void resetCropper();
				}

				if (boundaryChanged && !resetActive && imageLoader.getImage()) {
					if (cropper.getState()) {
						void refreshCropper();
					} else {
						void resetCropper();
					}
				}

				if (registry.epoch !== lastEpoch) {
					lastEpoch = registry.epoch;
					cropper.moveCoordinatesEnd();
					cropper.resizeCoordinatesEnd();
				}

				autoReconcile.request();
			});
		});
		onDestroy(() => {
			mounted = false;
			cropper.dispose();
			for (const waiter of refreshWaiters.splice(0)) {
				waiter.resolve();
			}
		});
	}
}

<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { ClassValue } from 'svelte/elements';
	import type { CropperImage, CropperState, CropperTransitions, Size } from 'advanced-cropper';
	import type {
		CropperPreviewWrapperSnippetProps,
		CropperPreviewBoundarySnippetProps,
		CropperPreviewBackgroundSnippetProps,
		CrossOrigin
	} from '../../types';

	export interface CropperPreviewSource {
		getState: () => CropperState | null;
		getImage: () => CropperImage | null;
		getTransitions: () => CropperTransitions | null;
		isLoading: () => boolean;
		isLoaded: () => boolean;
	}

	export interface CropperPreviewInstance {
		refresh: () => void;
		update: (cropper?: CropperPreviewSource | null) => void;
	}

	export interface CropperPreviewProps {
		state?: CropperState | null;
		image?: CropperImage | null;
		transitions?: CropperTransitions | null;
		loading?: boolean;
		loaded?: boolean;
		class?: ClassValue;
		wrapper?: Snippet<[CropperPreviewWrapperSnippetProps]>;
		boundary?: Snippet<[CropperPreviewBoundarySnippetProps]>;
		background?: Snippet<[CropperPreviewBackgroundSnippetProps]>;
		crossOrigin?: CrossOrigin;
		style?: string;
		/**
		 * The cropper to mirror: the value bound with `bind:this` on a cropper.
		 * The Svelte binding is
		 * already reactive, so the instance is passed directly.
		 */
		cropper?: CropperPreviewSource | null;
	}
</script>

<script lang="ts">
	import { onDestroy, untrack } from 'svelte';
	import { isGreater, ratio, stretchPreviewBoundary } from 'advanced-cropper';
	import { listenForWindowResize } from '../../controllers/listenForWindowResize.svelte';
	import StretchableBoundary from '../service/StretchableBoundary.svelte';
	import { RegistrationSlot } from '../../controllers/RegistrationSlot.svelte';
	import type { BoundaryHandle } from '../../types';
	import { fillLayoutBoundary } from '../../service/boundary';
	import CropperPreviewBackground from './CropperPreviewBackground.svelte';
	import CropperPreviewWrapper from './CropperPreviewWrapper.svelte';

	let {
		class: cssClass,
		// Renamed: a local `state` would clash with the `$state` rune.
		state: stateProp = null,
		image = null,
		transitions = null,
		wrapper,
		boundary,
		background,
		crossOrigin = true,
		loaded = true,
		loading = false,
		style,
		cropper
	}: CropperPreviewProps = $props();

	const boundaries = new RegistrationSlot<BoundaryHandle>();

	// Set through the exported `update()`; takes priority over the props-based instance.
	let internalInstance: CropperPreviewSource | null = $state.raw(null);

	const propsInstance: CropperPreviewSource = {
		getState: () => stateProp,
		getTransitions: () => transitions,
		getImage: () => image,
		isLoaded: () => loaded,
		isLoading: () => loading
	};

	// Refresh invalidates reads from adapters whose getters are not reactive.
	let revision = $state(0);

	const instance: CropperPreviewSource = $derived.by(() => {
		void revision;
		const source = cropper || internalInstance || propsInstance;

		return {
			getState: () => source.getState(),
			getTransitions: () => source.getTransitions(),
			getImage: () => source.getImage(),
			isLoaded: () => source.isLoaded(),
			isLoading: () => source.isLoading()
		};
	});

	let size: Size | null = $state.raw(null);

	// Scalars, so that moving the crop (same size, new object) does not re-stretch.
	const width = $derived(instance.getState()?.coordinates?.width);
	const height = $derived(instance.getState()?.coordinates?.height);

	const src = $derived(instance.getImage()?.src);

	// Incremented for every stretch and on destroy, so that only the latest stretch, and
	// none after destroy, sets the size (a custom boundary's stretchTo may be async).
	let latestStretch = 0;
	onDestroy(() => latestStretch++);

	// Fits the content box to the boundary, keeping the crop's aspect ratio.
	function stretch() {
		const coordinates = instance.getState()?.coordinates;
		const currentBoundary = boundaries.value;
		const epoch = boundaries.epoch;
		const id = ++latestStretch;
		if (!currentBoundary || !coordinates) {
			size = null;

			return;
		}

		void currentBoundary.stretchTo(coordinates).then((stretched) => {
			if (
				id !== latestStretch ||
				currentBoundary !== boundaries.value ||
				epoch !== boundaries.epoch
			) {
				return;
			}

			if (!stretched) {
				size = null;

				return;
			}

			const aspectRatio = ratio(coordinates);
			size = isGreater(aspectRatio, ratio(stretched))
				? { width: stretched.width, height: stretched.width / aspectRatio }
				: { width: stretched.height * aspectRatio, height: stretched.height };
		});
	}

	export function refresh() {
		revision++;
		stretch();
	}

	export function update(next?: CropperPreviewSource | null) {
		internalInstance = next || null;
		refresh();
	}

	listenForWindowResize(refresh);

	// Recompute fitted size when dimensions or boundary ownership change.
	$effect(() => {
		void width;
		void height;
		void boundaries.value;
		void boundaries.epoch;
		untrack(stretch);
	});
	const wrapperArguments = $derived({
		preview: instance,
		class: [cssClass, 'advanced-cropper-preview'],
		style,
		children: boundaryLayer
	});
	const boundaryArguments = $derived({
		preview: instance,
		class: 'advanced-cropper-preview__boundary',
		registerBoundary: boundaries.register,
		sizeAlgorithm: fillLayoutBoundary,
		stretchAlgorithm: stretchPreviewBoundary,
		children: content
	});
	const backgroundArguments = $derived({
		preview: instance,
		size,
		crossOrigin,
		class: ['advanced-cropper-preview__image', src && 'advanced-cropper-preview__image--visible']
	});
</script>

{#snippet content()}
	<div
		class="advanced-cropper-preview__content"
		style:width={size ? `${size.width}px` : undefined}
		style:height={size ? `${size.height}px` : undefined}
	>
		{#if background}{@render background(backgroundArguments)}{:else}<CropperPreviewBackground
				{...backgroundArguments}
			/>{/if}
	</div>
{/snippet}
{#snippet boundaryLayer()}
	{#if boundary}{@render boundary(boundaryArguments)}{:else}<StretchableBoundary
			{...boundaryArguments}
		/>{/if}
{/snippet}
{#if wrapper}{@render wrapper(wrapperArguments)}{:else}<CropperPreviewWrapper
		{...wrapperArguments}
	/>{/if}

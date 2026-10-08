<script lang="ts" module>
	import type { Component } from 'svelte';
	import type { ClassValue } from 'svelte/elements';
	import type { CropperImage, CropperState, CropperTransitions, Size } from 'advanced-cropper';
	import type { ArbitraryProps, CropperBoundaryComponent } from '../../types';

	export interface CropperPreviewDesiredCropperRef {
		getState: () => CropperState | null;
		getImage: () => CropperImage | null;
		getTransitions: () => CropperTransitions | null;
		isLoading: () => boolean;
		isLoaded: () => boolean;
	}

	export interface CropperPreviewRef {
		refresh: () => void;
		update: (cropper?: CropperPreviewDesiredCropperRef | null) => void;
	}

	export type PreviewWrapperComponent = Component<{
		cropper: any;
		class?: ClassValue;
		style?: string;
		loading?: boolean;
		loaded?: boolean;
		children?: import('svelte').Snippet;
	}>;

	export type PreviewBackgroundComponent = Component<{
		cropper: any;
		size: Size | null;
		class?: ClassValue;
	}>;

	export interface CropperPreviewProps {
		state?: CropperState | null;
		image?: CropperImage | null;
		transitions?: CropperTransitions | null;
		loading?: boolean;
		loaded?: boolean;
		class?: ClassValue;
		contentClassName?: ClassValue;
		backgroundClassName?: ClassValue;
		backgroundComponent?: PreviewBackgroundComponent;
		backgroundProps?: ArbitraryProps;
		boundaryComponent?: CropperBoundaryComponent;
		boundaryProps?: ArbitraryProps;
		boundaryClassName?: ClassValue;
		wrapperComponent?: PreviewWrapperComponent;
		wrapperProps?: ArbitraryProps;
		style?: string;
		/**
		 * The cropper to mirror: the value bound with `bind:this` on a cropper.
		 * Upstream takes a React ref object (`{ current }`); a Svelte binding is
		 * already reactive, so the instance is passed directly.
		 */
		cropper?: CropperPreviewDesiredCropperRef | null;
	}
</script>

<script lang="ts">
	import { untrack } from 'svelte';
	import { isGreater, ratio, stretchPreviewBoundary } from 'advanced-cropper';
	import { useWindowResize } from '../../hooks/useWindowResize.svelte';
	import StretchableBoundary from '../service/StretchableBoundary.svelte';
	import type { StretchableBoundaryMethods } from '../service/methods';
	import CropperPreviewBackground from './CropperPreviewBackground.svelte';
	import CropperPreviewWrapper from './CropperPreviewWrapper.svelte';

	let {
		class: className,
		contentClassName,
		state: stateProp = null,
		image = null,
		transitions = null,
		backgroundComponent = CropperPreviewBackground,
		backgroundProps,
		backgroundClassName,
		boundaryComponent = StretchableBoundary,
		boundaryProps,
		boundaryClassName,
		wrapperComponent = CropperPreviewWrapper,
		wrapperProps,
		loaded = true,
		loading = false,
		style,
		cropper
	}: CropperPreviewProps = $props();

	let boundary: StretchableBoundaryMethods | undefined = $state.raw();

	// Set through the exported `update()`; takes priority over the props-based instance.
	let internalInstance: CropperPreviewDesiredCropperRef | null = $state.raw(null);

	const propsInstance: CropperPreviewDesiredCropperRef = {
		getState: () => stateProp,
		getTransitions: () => transitions,
		getImage: () => image,
		isLoaded: () => loaded,
		isLoading: () => loading
	};

	// Bumped by refresh()/update(). Upstream force-renders there, so that a cropper
	// object whose getters are not reactive is still re-read. A new wrapper object per
	// revision does the same: everything that reads `instance` re-evaluates.
	let revision = $state(0);

	const instance: CropperPreviewDesiredCropperRef = $derived.by(() => {
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

	function stretch() {
		const current = instance.getState()?.coordinates;
		if (boundary && current) {
			void boundary.stretchTo(current).then((stretched) => {
				if (stretched && current) {
					if (isGreater(ratio(current), ratio(stretched))) {
						size = {
							width: stretched.width,
							height: stretched.width / ratio(current)
						};
					} else {
						size = {
							width: stretched.height * ratio(current),
							height: stretched.height
						};
					}
				} else {
					size = null;
				}
			});
		}
	}

	export function refresh() {
		revision++;
		stretch();
	}

	export function update(next?: CropperPreviewDesiredCropperRef | null) {
		internalInstance = next || null;
		refresh();
	}

	useWindowResize(() => refresh());

	$effect(() => {
		// Upstream: useLayoutEffect(refresh, [coordinates?.height, coordinates?.width]).
		void width;
		void height;
		void boundary;
		untrack(stretch);
	});

	const WrapperComponent = $derived(wrapperComponent);
	const BoundaryComponent = $derived(boundaryComponent);
	const BackgroundComponent = $derived(backgroundComponent);
</script>

<WrapperComponent
	{...wrapperProps}
	class={[className, 'advanced-cropper-preview']}
	cropper={instance}
	{style}
>
	<BoundaryComponent
		bind:this={boundary}
		stretchAlgorithm={stretchPreviewBoundary}
		{...boundaryProps}
		class={['advanced-cropper-preview__boundary', boundaryClassName]}
	>
		<div
			class={[contentClassName, 'advanced-cropper-preview__content']}
			style:width={size ? `${size.width}px` : undefined}
			style:height={size ? `${size.height}px` : undefined}
		>
			<BackgroundComponent
				{...backgroundProps}
				cropper={instance}
				{size}
				class={[
					backgroundClassName,
					'advanced-cropper-preview__image',
					src && 'advanced-cropper-preview__image--visible'
				]}
			/>
		</div>
	</BoundaryComponent>
</WrapperComponent>

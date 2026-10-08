<script lang="ts" module>
	import type { StencilSize } from 'advanced-cropper/extensions/stencil-size';
	import type { CustomCropperProps, CustomCropperRef } from '../../types';

	type UnavailableProps = 'sizeRestrictions' | 'aspectRatio';

	export interface FixedCropperSettings {
		stencilSize: StencilSize<this>;
	}

	export type FixedCropperProps = Omit<CustomCropperProps<FixedCropperSettings>, UnavailableProps>;

	export type FixedCropperRef = CustomCropperRef<FixedCropperSettings>;
</script>

<script lang="ts">
	import {
		aspectRatio,
		defaultSize,
		fixedStencil,
		fixedStencilConstraints,
		sizeRestrictions
	} from 'advanced-cropper/extensions/stencil-size';
	import { withDefaultSizeRestrictions } from 'advanced-cropper';
	import AbstractCropper from '../AbstractCropper.svelte';
	import { settingPropNames, splitCropperProps } from '../../service/cropperProps';
	import { forwardCropperRef } from '../../service/ref';

	let props: FixedCropperProps = $props();

	const cropperProps = $derived(
		splitCropperProps<FixedCropperSettings>(props, [...settingPropNames, 'stencilSize'])
	);

	let abstractCropper: FixedCropperRef | undefined = $state.raw();

	// Svelte needs static export names. A test checks that every ref method is exported.
	export const {
		reset,
		refresh,
		setImage,
		reconcileState,
		moveCoordinates,
		moveCoordinatesEnd,
		resizeCoordinates,
		clear,
		resizeCoordinatesEnd,
		moveImage,
		flipImage,
		zoomImage,
		rotateImage,
		transformImage,
		transformImageEnd,
		setCoordinates,
		setVisibleArea,
		startTransitions,
		setState,
		hasInteractions,
		getStencilCoordinates,
		getCoordinates,
		getVisibleArea,
		getTransforms,
		getTransitions,
		getInteractions,
		getSettings,
		getState,
		getDefaultState,
		getCanvas,
		getImage,
		isLoading,
		isLoaded
	} = forwardCropperRef(() => abstractCropper);
</script>

<AbstractCropper
	postProcess={fixedStencil}
	stencilConstraints={fixedStencilConstraints}
	{...cropperProps.props}
	settings={{
		defaultSize,
		aspectRatio,
		sizeRestrictions: withDefaultSizeRestrictions(sizeRestrictions),
		...cropperProps.settings,
		// After the user's settings: the stencil size is fixed, so transforming the image
		// must never resize the stencil.
		transformImage: {
			...cropperProps.settings.transformImage,
			adjustStencil: false
		}
	}}
	bind:this={abstractCropper}
/>

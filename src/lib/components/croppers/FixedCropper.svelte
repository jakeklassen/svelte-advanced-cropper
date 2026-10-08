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
	import { useAbstractCropperProps } from '../../hooks/useAbstractCropperProps';
	import { defaultSettings } from '../../service/constants';
	import { forwardCropperRef } from '../../service/ref';

	let props: FixedCropperProps = $props();

	const cropperProps = $derived(
		useAbstractCropperProps<FixedCropperSettings>(props, [...defaultSettings, 'stencilSize'])
	);

	let inner: FixedCropperRef | undefined = $state.raw();

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
	} = forwardCropperRef(() => inner);
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
		transformImage: {
			...cropperProps.settings.transformImage,
			adjustStencil: false
		}
	}}
	bind:this={inner}
/>

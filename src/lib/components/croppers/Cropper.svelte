<script lang="ts" module>
	import type {
		CustomCropperProps,
		CustomCropperRef,
		ExtendedSettings,
		SettingsExtension
	} from '../../types';
	import type { CropperInstanceSettingsProp } from '../../hooks/useCropperInstance.svelte';

	export type CropperProps<Extension extends SettingsExtension = {}> =
		CustomCropperProps<Extension>;

	export type CropperRef<Extension extends SettingsExtension = {}> = CustomCropperRef<Extension>;
</script>

<script lang="ts" generics="Extension extends SettingsExtension = {}">
	import AbstractCropper from '../AbstractCropper.svelte';
	import { useAbstractCropperProps } from '../../hooks/useAbstractCropperProps';
	import { forwardCropperRef } from '../../service/ref';

	let props: CropperProps<Extension> = $props();

	// Upstream also accepted the deprecated `stencilSize` and `autoZoom` props here, but
	// its prop splitting never routed them to the code that handled them, so they had
	// no effect. They are not ported; use FixedCropper and `postProcess` instead.
	const cropperProps = $derived(useAbstractCropperProps<Extension>(props));

	let inner: CropperRef<Extension> | undefined = $state.raw();

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
	{...cropperProps.props}
	settings={cropperProps.settings as CropperInstanceSettingsProp<ExtendedSettings<Extension>>}
	bind:this={inner}
/>

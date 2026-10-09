<script lang="ts" module>
	import type { SettingsExtension, FixedCropperProps } from '../../types';

	export type { FixedCropperProps } from '../../types';
</script>

<script lang="ts" generics="E extends SettingsExtension = {}">
	import { CropperController } from '../../controllers/CropperController.svelte';
	import CropperView from '../internal/CropperView.svelte';
	import RegistrationCheck from '../internal/RegistrationCheck.svelte';
	import {
		aspectRatio,
		defaultSize,
		fixedStencil,
		fixedStencilConstraints,
		sizeRestrictions
	} from 'advanced-cropper/extensions/stencil-size';
	import { withDefaultSizeRestrictions } from 'advanced-cropper';
	import type { CropperProps, FixedCropperSettings } from '../../types';
	import { normalizeSettings } from '../../controllers/settings';

	let props: FixedCropperProps<E> = $props();
	const configured: CropperProps<E & FixedCropperSettings> = $derived({
		defaultSize,
		aspectRatio,
		sizeRestrictions: withDefaultSizeRestrictions(sizeRestrictions),
		postProcess: fixedStencil,
		stencilConstraints: (raw, options) => ({
			...raw,
			...fixedStencilConstraints({ ...raw, stencilSize: props.stencilSize }, options)
		}),
		...props,
		settings: { ...props.settings, stencilSize: props.stencilSize } as E & FixedCropperSettings
	} satisfies CropperProps<E & FixedCropperSettings>);
	const controller = new CropperController<E & FixedCropperSettings>(
		() => configured,
		(input, options) => {
			const settings = normalizeSettings(input, options);

			return { ...settings, transformImage: { ...settings.transformImage, adjustStencil: false } };
		}
	);
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
	} = controller.api;
</script>

<CropperView {...configured} {controller} />
<RegistrationCheck validate={controller.stencils.commit} />

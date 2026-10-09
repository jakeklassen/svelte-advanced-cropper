<script lang="ts" module>
	import type { SettingsExtension, CropperProps } from '../../types';

	export type { CropperProps } from '../../types';
</script>

<script lang="ts" generics="E extends SettingsExtension = {}">
	import { CropperController } from '../../controllers/CropperController.svelte';
	import CropperView from '../internal/CropperView.svelte';
	import RegistrationCheck from '../internal/RegistrationCheck.svelte';

	let props: CropperProps<E> = $props();
	const controller = new CropperController<E>(() => props);
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

<CropperView {...props} {controller} />
<RegistrationCheck validate={controller.stencils.commit} />

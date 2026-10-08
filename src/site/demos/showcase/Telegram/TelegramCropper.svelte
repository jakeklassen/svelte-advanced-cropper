<script lang="ts">
	import type { ClassValue } from 'svelte/elements';
	import {
		Cropper,
		ImageRestriction,
		type CropperProps,
		type ResizeAlgorithm
	} from 'svelte-advanced-cropper';
	import {
		defaultSize,
		fitStencilToImage,
		resizeCoordinates,
		stencilConstraints,
		transformImage,
		zoomStencil
	} from 'advanced-cropper/showcase/mobile';
	import CropperWrapper from './CropperWrapper.svelte';
	import type { NavigationClassNames } from './types.ts';

	interface Props extends Omit<
		CropperProps,
		'transitions' | 'priority' | 'imageRestriction' | 'stencilConstraints' | 'transformImage'
	> {
		spinnerClassName?: ClassValue;
		navigation?: boolean;
		navigationProps?: NavigationClassNames;
	}

	let {
		class: className,
		spinnerClassName,
		navigation = true,
		stencilProps = {},
		navigationProps = {},
		wrapperComponent = CropperWrapper,
		...cropperProps
	}: Props = $props();

	// The core types this algorithm's `directions` as `ResizeDirections`, while the
	// `resizeCoordinatesAlgorithm` setting expects `MoveDirections`.
	const resizeAlgorithm = resizeCoordinates as unknown as ResizeAlgorithm;
</script>

<Cropper
	{...cropperProps}
	{stencilConstraints}
	stencilProps={{ grid: true, ...stencilProps, movable: false }}
	{wrapperComponent}
	wrapperProps={{ navigationProps, navigation, spinnerClassName }}
	imageRestriction={ImageRestriction.none}
	class={['telegram-cropper', className]}
	postProcess={[fitStencilToImage, zoomStencil]}
	{defaultSize}
	transformImageAlgorithm={transformImage}
	resizeCoordinatesAlgorithm={resizeAlgorithm}
	transitions
/>

<style lang="scss">
	// The corners theme, applied to this cropper only, with the accent color it inherits.
	:global {
		.telegram-cropper {
			@import 'advanced-cropper/themes/corners.scss';
			color: #61dafb;
		}
	}
</style>

<script lang="ts" generics="Extension extends SettingsExtension = {}">
	import { defaultStencilConstraints } from 'advanced-cropper';
	import type { ExtendedSettings, SettingsExtension, StencilConstraints } from '../types';
	import type { AbstractCropperProps, AbstractCropperSettingsProp } from './AbstractCropper.types';
	import { useAbstractCropper } from '../hooks/useAbstractCropper.svelte';
	import CropperBackgroundImage from './service/CropperBackgroundImage.svelte';
	import CropperBackgroundWrapper from './service/CropperBackgroundWrapper.svelte';
	import CropperCanvas from './service/CropperCanvas.svelte';
	import CropperWrapper from './service/CropperWrapper.svelte';
	import StretchableBoundary from './service/StretchableBoundary.svelte';
	import RectangleStencil from './stencils/RectangleStencil.svelte';

	let {
		style,
		class: className,
		stencilComponent: StencilComponent = RectangleStencil,
		stencilConstraints = defaultStencilConstraints as unknown as StencilConstraints<
			AbstractCropperSettingsProp<ExtendedSettings<Extension>>
		>,
		stencilProps = {},
		wrapperComponent: WrapperComponent = CropperWrapper,
		wrapperProps = {},
		backgroundComponent: BackgroundComponent = CropperBackgroundImage,
		backgroundProps = {},
		backgroundClassName,
		backgroundWrapperComponent: BackgroundWrapperComponent = CropperBackgroundWrapper,
		backgroundWrapperProps = {},
		backgroundWrapperClassName,
		boundaryComponent: BoundaryComponent = StretchableBoundary,
		boundaryProps,
		boundaryClassName,
		canvas = true,
		crossOrigin = true,
		disabled,
		settings,
		...hookProps
	}: AbstractCropperProps<ExtendedSettings<Extension>> = $props();

	// The stencil instance. Its exports (e.g. `aspectRatio`) are stencil options, as
	// upstream merges the stencil's imperative handle into them.
	let stencil: Record<string, unknown> | undefined = $state.raw();

	// Skips Svelte's dev-mode `$set`/`$on`/`$destroy` stubs.
	const stencilExports = $derived(
		Object.fromEntries(Object.entries(stencil ?? {}).filter(([key]) => !key.startsWith('$')))
	);

	const hook = useAbstractCropper<Extension>(() => ({
		...hookProps,
		crossOrigin,
		stencilProps,
		canvas,
		settings: {
			...settings,
			...stencilConstraints(settings, {
				...stencilProps,
				...stencilExports
			})
		}
	}));

	// `hook.image` stays a getter: destructuring it would lose reactivity.
	const { cropper, refs } = hook;

	// Svelte needs static export names. `forwardCropperRef` in service/ref.ts lists the
	// same methods; a test checks that every one of them is exported.
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
	} = cropper;
</script>

<WrapperComponent
	{...wrapperProps}
	{disabled}
	class={['advanced-cropper', className]}
	{cropper}
	{style}
	loading={cropper.isLoading()}
	loaded={cropper.isLoaded()}
>
	<BoundaryComponent
		{...boundaryProps}
		bind:this={refs.boundary}
		class={['advanced-cropper__boundary', boundaryClassName]}
	>
		<BackgroundWrapperComponent
			{...backgroundWrapperProps}
			{disabled}
			{cropper}
			class={['advanced-cropper__background-wrapper', backgroundWrapperClassName]}
		>
			{#if cropper.getState()}
				<BackgroundComponent
					{...backgroundProps}
					bind:ref={refs.image}
					{crossOrigin}
					{cropper}
					class={['advanced-cropper__background', backgroundClassName]}
				/>
			{/if}
			<StencilComponent
				{...stencilProps}
				{disabled}
				bind:this={stencil}
				{cropper}
				image={hook.image}
			/>
		</BackgroundWrapperComponent>
		{#if canvas}
			<CropperCanvas bind:this={refs.canvas} />
		{/if}
	</BoundaryComponent>
</WrapperComponent>

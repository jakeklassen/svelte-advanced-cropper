<script lang="ts" generics="E extends SettingsExtension = {}">
	import type { CropperProps, SettingsExtension } from '../../types';
	import type { CropperController } from '../../controllers/CropperController.svelte';
	import CropperBackgroundImage from '../service/CropperBackgroundImage.svelte';
	import CropperBackgroundWrapper from '../service/CropperBackgroundWrapper.svelte';
	import CropperCanvas from '../service/CropperCanvas.svelte';
	import CropperWrapper from '../service/CropperWrapper.svelte';
	import StretchableBoundary from '../service/StretchableBoundary.svelte';
	import RectangleStencil from '../stencils/RectangleStencil.svelte';

	let {
		style,
		class: cssClass,
		children,
		controller,
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
		moveImage,
		scaleImage,
		rotateImage
	}: CropperProps<E> & { controller: CropperController<E> } = $props();

	const cropper = $derived(controller.api);
</script>

<WrapperComponent
	{...wrapperProps}
	{disabled}
	class={['advanced-cropper', cssClass]}
	{cropper}
	{style}
>
	<BoundaryComponent
		{...boundaryProps}
		bind:this={controller.elements.boundary}
		class={['advanced-cropper__boundary', boundaryClassName]}
	>
		<BackgroundWrapperComponent
			{moveImage}
			{scaleImage}
			{rotateImage}
			{...backgroundWrapperProps}
			{disabled}
			{cropper}
			class={['advanced-cropper__background-wrapper', backgroundWrapperClassName]}
		>
			{#if cropper.getState()}
				<BackgroundComponent
					{...backgroundProps}
					bind:element={controller.elements.image}
					{crossOrigin}
					{cropper}
					class={['advanced-cropper__background', backgroundClassName]}
				/>
			{/if}
			{#if children}
				{@render children()}
			{:else}
				<RectangleStencil />
			{/if}
		</BackgroundWrapperComponent>
		{#if canvas}
			<CropperCanvas bind:this={controller.elements.canvas} />
		{/if}
	</BoundaryComponent>
</WrapperComponent>

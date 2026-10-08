<script lang="ts">
	import {
		FixedCropper,
		ImageRestriction,
		type FixedCropperProps,
		type FixedCropperRef
	} from 'svelte-advanced-cropper';
	import CustomWrapper from './CustomWrapper.svelte';

	interface Props extends FixedCropperProps {
		/** The inner cropper, for `bind:cropper`. */
		cropper?: FixedCropperRef;
	}

	let { stencilProps, cropper = $bindable(), ...props }: Props = $props();
</script>

<FixedCropper
	bind:this={cropper}
	stencilProps={{
		handlers: false,
		lines: false,
		movable: false,
		resizable: false,
		...stencilProps
	}}
	imageRestriction={ImageRestriction.stencil}
	wrapperComponent={CustomWrapper}
	{...props}
/>

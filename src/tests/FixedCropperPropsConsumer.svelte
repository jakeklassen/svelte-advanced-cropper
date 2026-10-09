<script lang="ts">
	import { expectTypeOf } from 'vitest';
	import {
		FixedCropper,
		CropperWrapper,
		type FixedCropperProps,
		type FixedCropperInstance,
		type CropperSettings,
		type FixedCropperSettings
	} from '#lib';

	let props: FixedCropperProps = $props();
	let cropper: FixedCropperInstance | undefined = $state();
	const settings = $derived(cropper?.getSettings());
	expectTypeOf<typeof settings>().toEqualTypeOf<
		CropperSettings<FixedCropperSettings> | undefined
	>();
</script>

<FixedCropper
	{...props}
	bind:this={cropper}
	onChange={(instance) => {
		const settings = instance.getSettings();
		expectTypeOf<typeof settings>().toExtend<CropperSettings<FixedCropperSettings>>();
		expectTypeOf<keyof typeof settings>().toEqualTypeOf<
			keyof CropperSettings<FixedCropperSettings>
		>();
		// @ts-expect-error Default settings have no extension fields.
		void instance.getSettings().dpi;
	}}
>
	{#snippet wrapper(p)}
		{@const settings = p.cropper.getSettings()}
		{expectTypeOf<typeof settings>().toExtend<CropperSettings<FixedCropperSettings>>() && ''}
		{expectTypeOf<keyof typeof settings>().toEqualTypeOf<
			keyof CropperSettings<FixedCropperSettings>
		>() && ''}
		<CropperWrapper {...p} />
	{/snippet}
</FixedCropper>

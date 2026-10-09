<script lang="ts">
	import { expectTypeOf } from 'vitest';
	import {
		Cropper,
		CropperWrapper,
		type CropperProps,
		type CropperInstance,
		type CropperSettings
	} from '#lib';

	let props: CropperProps = $props();
	let cropper: CropperInstance | undefined = $state();
	const settings = $derived(cropper?.getSettings());
	expectTypeOf<typeof settings>().toEqualTypeOf<CropperSettings | undefined>();
</script>

<Cropper
	{...props}
	bind:this={cropper}
	onChange={(instance) => {
		const settings = instance.getSettings();
		expectTypeOf<typeof settings>().toExtend<CropperSettings>();
		expectTypeOf<keyof typeof settings>().toEqualTypeOf<keyof CropperSettings>();
		// @ts-expect-error Default settings have no extension fields.
		void instance.getSettings().dpi;
	}}
>
	{#snippet wrapper(p)}
		{@const settings = p.cropper.getSettings()}
		{expectTypeOf<typeof settings>().toExtend<CropperSettings>() && ''}
		{expectTypeOf<keyof typeof settings>().toEqualTypeOf<keyof CropperSettings>() && ''}
		<CropperWrapper {...p} />
	{/snippet}
</Cropper>

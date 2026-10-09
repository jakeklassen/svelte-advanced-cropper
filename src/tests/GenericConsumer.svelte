<script lang="ts">
	import { expectTypeOf } from 'vitest';
	import {
		Cropper,
		FixedCropper,
		CropperWrapper,
		type CropperInstance,
		type FixedCropperInstance,
		type CropperProps,
		type FixedCropperProps
	} from '#lib';

	interface PrintSettings {
		dpi: number;
		product: 'print';
	}
	const settings: PrintSettings = { dpi: 300, product: 'print' };
	const cropperProps: CropperProps<PrintSettings> = { settings };
	const fixedProps: FixedCropperProps<PrintSettings> = {
		settings,
		stencilSize: { width: 200, height: 100 }
	};
	let cropper: CropperInstance<PrintSettings> | undefined = $state();
	let fixed: FixedCropperInstance<PrintSettings> | undefined = $state();
	const dpi = $derived(cropper?.getSettings().dpi ?? fixed?.getSettings().dpi);
</script>

<Cropper
	{settings}
	bind:this={cropper}
	onChange={(instance) => {
		const dpi: number = instance.getSettings().dpi;
		// @ts-expect-error Extension types survive callback inference.
		const wrong: string = instance.getSettings().dpi;
		void dpi;
		void wrong;
	}}
>
	{#snippet wrapper(p)}
		{@const dpi = p.cropper.getSettings().dpi}
		<CropperWrapper {...p} class={['print', `dpi-${dpi}`]} />
	{/snippet}
</Cropper>
<FixedCropper
	{settings}
	bind:this={fixed}
	stencilSize={{ width: 200, height: 100 }}
	onChange={(instance) => {
		expectTypeOf(instance.getSettings().dpi).toEqualTypeOf<number>();
		expectTypeOf(instance.getSettings().product).toEqualTypeOf<'print'>();
		// @ts-expect-error Extension values remain numeric.
		const wrong: string = instance.getSettings().dpi;
		void wrong;
	}}
>
	{#snippet wrapper(p)}
		{expectTypeOf(p.cropper.getSettings().dpi).toEqualTypeOf<number>() && ''}
		<CropperWrapper {...p} />
	{/snippet}
</FixedCropper>
<Cropper
	{...cropperProps}
	onChange={(instance) => {
		expectTypeOf(instance.getSettings().dpi).toEqualTypeOf<number>();
		expectTypeOf(instance.getSettings().product).toEqualTypeOf<'print'>();
	}}
/>
<FixedCropper
	{...fixedProps}
	onChange={(instance) => {
		expectTypeOf(instance.getSettings().dpi).toEqualTypeOf<number>();
		expectTypeOf(instance.getSettings().product).toEqualTypeOf<'print'>();
	}}
/>
<p>{dpi}</p>

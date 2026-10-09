<script lang="ts">
	import { Cropper, FixedCropper, type CropperInstance, type FixedCropperInstance } from '#lib';

	interface PrintSettings {
		dpi: number;
		product: 'print';
	}
	const settings: PrintSettings = { dpi: 300, product: 'print' };
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
/>
<FixedCropper {settings} bind:this={fixed} stencilSize={{ width: 200, height: 100 }} />
<p>{dpi}</p>

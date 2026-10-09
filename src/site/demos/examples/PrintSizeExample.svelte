<script lang="ts">
	import { RectangleStencil, Cropper, type CropperInstance } from 'svelte-advanced-cropper';
	import { image } from '#site/paths.ts';

	// Square print sizes in inches, and the resolution print shops usually ask for.
	const PRINT_SIZES = [2, 4, 8];
	const TARGET_DPI = 300;

	const src = image('chocolate-labrador.jpg');

	let cropper: CropperInstance | undefined = $state();
	let inches = $state(4);

	// The cropper's getters are reactive: this follows the crop as it's moved and resized.
	let crop = $derived(cropper?.getCoordinates());
	let neededPixels = $derived(inches * TARGET_DPI);
	let dpi = $derived(crop ? Math.floor(Math.min(crop.width, crop.height) / inches) : 0);
	let tooSmall = $derived(crop ? dpi < TARGET_DPI : false);
</script>

<div class="print-size-example">
	<Cropper bind:this={cropper} class="print-size-example__cropper" {src}>
		<RectangleStencil aspectRatio={1} />
	</Cropper>
</div>

<div class="demo-buttons print-size-example__sizes" role="group" aria-label="Print size">
	{#each PRINT_SIZES as size (size)}
		<button class="demo-button" aria-pressed={inches === size} onclick={() => (inches = size)}>
			{size}″ print
		</button>
	{/each}
</div>

{#if crop}
	<p class="print-size-example__reading" aria-live="polite">
		The crop is {Math.round(crop.width)} × {Math.round(crop.height)} px. At {TARGET_DPI} DPI,
		{inches}″ needs {neededPixels} × {neededPixels} px.
	</p>
	{#if tooSmall}
		<p class="print-size-example__warning" aria-live="polite">
			This crop would print at about {dpi} DPI, so it may look soft. A larger crop, or a smaller print,
			will look sharper. You can still continue.
		</p>
	{/if}
{/if}

<style>
	.print-size-example {
		height: 320px;
		background: black;
	}
	.print-size-example :global(.print-size-example__cropper) {
		height: 100%;
	}
	.print-size-example__sizes [aria-pressed='true'] {
		border-color: var(--color-primary);
		color: var(--color-primary);
	}
	.print-size-example__reading,
	.print-size-example__warning {
		margin: 0.75rem 0 0;
		font-size: 0.9rem;
	}
	.print-size-example__warning {
		padding: 0.5rem 0.75rem;
		border-left: 3px solid light-dark(#b54708, #fdb022);
		background: var(--color-surface-subtle);
	}
</style>

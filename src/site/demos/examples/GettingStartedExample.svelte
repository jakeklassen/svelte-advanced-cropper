<script lang="ts">
	import { RectangleStencil, Cropper, type CropperInstance } from 'svelte-advanced-cropper';
	import { image } from '#site/paths.ts';

	const src = image('siamese-cat.jpg');

	let cropper: CropperInstance | undefined = $state();

	// The crop in the photo's own pixels. The cropper's getters are reactive, so this
	// updates as the crop moves.
	let coordinates = $derived(cropper?.getCoordinates());
</script>

<Cropper bind:this={cropper} {src} class="getting-started-example">
	<RectangleStencil aspectRatio={16 / 9} />
</Cropper>

{#if coordinates}
	<p class="getting-started-example__coordinates">
		left {Math.round(coordinates.left)}, top {Math.round(coordinates.top)}, width
		{Math.round(coordinates.width)}, height {Math.round(coordinates.height)}
	</p>
{/if}

<style>
	:global(.getting-started-example) {
		height: 600px;
		max-height: 70vh;
	}
	.getting-started-example__coordinates {
		margin: 0.75rem 0 0;
		font-family: var(--font-mono);
		font-size: 0.85rem;
		color: var(--color-muted);
	}
</style>

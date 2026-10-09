<script lang="ts">
	import { Cropper, RectangleStencil, type CropperInstance } from 'svelte-advanced-cropper';
	import { image } from '#site/paths.ts';

	let cropper: CropperInstance | undefined = $state();
	const coordinates = $derived(cropper?.getCoordinates());
</script>

<Cropper bind:this={cropper} src={image('calico-cat.jpg')} style="height: 360px">
	<RectangleStencil aspectRatio={16 / 9} />
</Cropper>

{#if coordinates}
	<p>{coordinates.width} × {coordinates.height} pixels</p>
{/if}

<button type="button" disabled={!coordinates} onclick={() => cropper?.rotateImage(90)}>
	Rotate
</button>

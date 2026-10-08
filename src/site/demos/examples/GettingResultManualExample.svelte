<script lang="ts">
	import { Cropper, type Coordinates, type CropperRef } from 'svelte-advanced-cropper';
	import { image } from '#site/paths.ts';
	import PreviewResults from './PreviewResults.svelte';

	const src = image('photo-1586083718719-019f9dc6ca94.jpg');

	let cropper: CropperRef | undefined = $state();
	let coordinates: Coordinates | null = $state(null);
	let preview: string | undefined = $state();

	function onCrop() {
		if (cropper) {
			coordinates = cropper.getCoordinates();
			// The canvas can be processed in any way you like. Here it is turned
			// into a data URL so that an <img> can show the result.
			preview = cropper.getCanvas()?.toDataURL();
		}
	}
</script>

<div class="getting-result-manual-example">
	<Cropper
		bind:this={cropper}
		class="getting-result-manual-example__cropper"
		stencilProps={{ aspectRatio: 1 }}
		{src}
	/>
	<button type="button" class="getting-result-manual-example__crop-button" onclick={onCrop}>
		Crop Image
	</button>
	{#if coordinates && preview}
		<PreviewResults {coordinates} {preview} />
	{/if}
</div>

<style>
	.getting-result-manual-example {
		position: relative;
	}
	:global(.getting-result-manual-example__cropper) {
		max-height: 720px;
		background: #354146;
	}
	.getting-result-manual-example__crop-button {
		position: absolute;
		left: 50%;
		top: 0;
		transform: translateX(-50%);
		border: none;
		background: rgba(0, 0, 0, 0.8);
		padding: 5px 20px;
		transition: background 0.5s;
		color: white;
		font: inherit;
		font-size: 16px;
		cursor: pointer;
	}
	.getting-result-manual-example__crop-button:hover {
		background: rgba(26, 167, 249, 0.9);
	}
</style>

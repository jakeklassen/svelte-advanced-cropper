<script lang="ts">
	import { onDestroy } from 'svelte';
	import { Cropper, type Coordinates, type CropperRef } from 'svelte-advanced-cropper';
	import { image } from '#site/paths.ts';
	import PreviewResults from './PreviewResults.svelte';

	const src = image('dogs-running.jpg');

	let coordinates: Coordinates | null = $state(null);
	let preview: string | undefined = $state();

	// Drawing the canvas on every change is expensive, so wait until the user
	// has stopped interacting for half a second.
	let timeout: ReturnType<typeof setTimeout> | undefined;

	onDestroy(() => clearTimeout(timeout));

	function onChange(cropper: CropperRef) {
		clearTimeout(timeout);
		timeout = setTimeout(() => {
			coordinates = cropper.getCoordinates();
			preview = cropper.getCanvas()?.toDataURL();
		}, 500);
	}
</script>

<div class="getting-result-example">
	<Cropper
		class="getting-result-example__cropper"
		stencilProps={{ aspectRatio: 1 }}
		{src}
		{onChange}
	/>
	{#if coordinates && preview}
		<PreviewResults {coordinates} {preview} />
	{/if}
</div>

<style>
	.getting-result-example {
		position: relative;
	}
	:global(.getting-result-example__cropper) {
		max-height: 450px;
		background: #354146;
	}
</style>

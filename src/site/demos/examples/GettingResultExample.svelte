<script lang="ts">
	import { onDestroy } from 'svelte';
	import { RectangleStencil, Cropper, type CropperInstance } from 'svelte-advanced-cropper';
	import { image } from '#site/paths.ts';
	import PreviewResults from './PreviewResults.svelte';

	const src = image('dogs-running.jpg');

	let cropper: CropperInstance | undefined = $state();
	const coordinates = $derived(cropper?.getCoordinates());
	let preview: string | undefined = $state();

	// Drawing the canvas on every change is expensive, so wait until the user
	// has stopped interacting for half a second.
	let timeout: ReturnType<typeof setTimeout> | undefined;

	onDestroy(() => clearTimeout(timeout));

	function onChange(instance: CropperInstance) {
		clearTimeout(timeout);
		timeout = setTimeout(() => {
			preview = instance.getCanvas()?.toDataURL();
		}, 500);
	}
</script>

<div class="getting-result-example">
	<Cropper bind:this={cropper} class="getting-result-example__cropper" {src} {onChange}>
		<RectangleStencil aspectRatio={1} />
	</Cropper>
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

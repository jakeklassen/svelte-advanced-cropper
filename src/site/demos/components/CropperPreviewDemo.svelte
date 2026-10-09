<script lang="ts">
	import { Cropper, CropperPreview, type CropperInstance } from 'svelte-advanced-cropper';
	import { image } from '#site/paths.ts';

	let cropper: CropperInstance | undefined = $state();
</script>

<div class="cropper-preview-demo">
	<Cropper bind:this={cropper} class="cropper-preview-demo__cropper" src={image('schnauzer.jpg')} />
	<CropperPreview {cropper} class="cropper-preview-demo__preview" />
</div>

<style>
	.cropper-preview-demo {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		align-items: flex-start;
	}
	.cropper-preview-demo :global(.cropper-preview-demo__cropper) {
		flex: 1 1 280px;
		min-width: 0;
		max-height: 400px;
	}
	.cropper-preview-demo :global(.cropper-preview-demo__preview) {
		width: 160px;
		height: 160px;
		background: var(--color-surface-subtle);
	}
</style>

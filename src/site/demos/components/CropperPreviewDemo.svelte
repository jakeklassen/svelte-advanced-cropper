<script lang="ts">
	import { Cropper, CropperPreview, type CropperRef } from 'svelte-advanced-cropper';
	import { image } from '#site/paths.ts';

	let cropper: CropperRef | undefined = $state();
</script>

<div class="cropper-preview-demo">
	<Cropper
		bind:this={cropper}
		class="cropper-preview-demo__cropper"
		src={image('photo-1623432532623-f8f1347d954c.jpg')}
	/>
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
		background: #eee;
	}
</style>

<script lang="ts">
	import { onDestroy } from 'svelte';
	import {
		RectangleStencil,
		Cropper,
		CropperPreview,
		type CropperInstance
	} from 'svelte-advanced-cropper';
	import { RotateCcw, Upload } from '@lucide/svelte';
	import SquareButton from '#site/demos/shared/SquareButton.svelte';
	import { image } from '#site/paths.ts';

	let src = $state(image('schnauzer.jpg'));

	let cropper: CropperInstance | undefined = $state();
	let input: HTMLInputElement | undefined = $state();

	function loadImage(event: Event & { currentTarget: HTMLInputElement }) {
		const file = event.currentTarget.files?.[0];
		if (file) {
			revokeUploadedUrl();
			uploadedUrl = URL.createObjectURL(file);
			src = uploadedUrl;
		}

		// Reset the input so that picking the same file again still fires `change`.
		event.currentTarget.value = '';
	}

	// Own upload URLs separately from preset sources.
	let uploadedUrl: string | undefined;

	function revokeUploadedUrl() {
		if (uploadedUrl) {
			URL.revokeObjectURL(uploadedUrl);
			uploadedUrl = undefined;
		}
	}

	onDestroy(revokeUploadedUrl);
</script>

<div class="preview-result-example">
	<Cropper bind:this={cropper} {src} class="preview-result-example__cropper">
		<RectangleStencil aspectRatio={1} />
	</Cropper>
	<div class="preview-result-example__previews">
		<CropperPreview {cropper} class="preview-result-example__preview" />
		<CropperPreview
			{cropper}
			class="preview-result-example__preview preview-result-example__preview--small"
		/>
	</div>
	<div class="preview-result-example__buttons">
		<SquareButton title="Upload" onclick={() => input?.click()}>
			<Upload size={20} />
		</SquareButton>
		<SquareButton title="Rotate" onclick={() => cropper?.rotateImage(90)}>
			<RotateCcw size={20} />
		</SquareButton>
	</div>
	<input
		bind:this={input}
		class="preview-result-example__file-input"
		type="file"
		accept="image/*"
		onchange={loadImage}
	/>
</div>

<style>
	.preview-result-example {
		display: flex;
		align-items: flex-start;
		position: relative;
	}
	:global(.preview-result-example__cropper) {
		width: 300px;
		max-width: calc(100% - 92px);
	}
	.preview-result-example__previews {
		margin-left: 32px;
	}
	:global(.preview-result-example__preview) {
		border-radius: 50%;
		overflow: hidden;
		margin: 24px 0;
		width: 100px;
		height: 100px;
	}
	:global(.preview-result-example__preview--small) {
		width: 60px;
		height: 60px;
	}
	.preview-result-example__buttons {
		position: absolute;
		display: flex;
		gap: 16px;
		left: 16px;
		bottom: 0;
	}
	.preview-result-example__file-input {
		display: none;
	}
	@media (max-width: 540px) {
		.preview-result-example__previews {
			margin-left: 12px;
		}
		:global(.preview-result-example__preview) {
			width: 60px;
			height: 60px;
		}
		:global(.preview-result-example__preview--small) {
			width: 40px;
			height: 40px;
		}
	}
</style>

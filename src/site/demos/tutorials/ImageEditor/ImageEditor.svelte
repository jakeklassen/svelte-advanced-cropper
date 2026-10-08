<script lang="ts">
	import { onDestroy } from 'svelte';
	import { RotateCcw } from '@lucide/svelte';
	import { Cropper, CropperPreview, type CropperRef } from 'svelte-advanced-cropper';
	import { image } from '#site/paths.ts';
	import AdjustableCropperBackground from './AdjustableCropperBackground.svelte';
	import AdjustablePreviewBackground from './AdjustablePreviewBackground.svelte';
	import Button from './Button.svelte';
	import Navigation, { type Mode } from './Navigation.svelte';
	import Slider from './Slider.svelte';
	import type { Adjustments } from './filters.ts';

	const noAdjustments: Adjustments = {
		brightness: 0,
		hue: 0,
		saturation: 0,
		contrast: 0
	};

	let cropper: CropperRef | undefined = $state();

	let src = $state(image('pexels-photo-4383577.jpeg'));

	let mode: Mode = $state('crop');

	let adjustments: Adjustments = $state({ ...noAdjustments });

	const cropperEnabled = $derived(mode === 'crop');

	const adjusted = $derived(
		Object.values(adjustments).some((value) => Math.round(value * 100) !== 0)
	);

	function reset() {
		mode = 'crop';
		adjustments = { ...noAdjustments };
	}

	// Uploaded files are shown through object URLs. Each one is revoked when the next upload
	// replaces it, and the last one when the editor is destroyed, so the browser can free the file.
	let uploadedUrl: string | undefined;

	function revokeUploadedUrl() {
		if (uploadedUrl) {
			URL.revokeObjectURL(uploadedUrl);
		}
	}

	function onUpload(file: File) {
		reset();
		revokeUploadedUrl();
		uploadedUrl = URL.createObjectURL(file);
		src = uploadedUrl;
	}

	onDestroy(revokeUploadedUrl);

	function onDownload() {
		const canvas = cropper?.getCanvas();
		if (canvas) {
			const link = document.createElement('a');
			link.download = 'image.png';
			link.href = canvas.toDataURL('image/png');
			link.click();
		}
	}
</script>

<div class="image-editor">
	<div class="image-editor__cropper">
		<Cropper
			bind:this={cropper}
			{src}
			stencilProps={{
				movable: cropperEnabled,
				resizable: cropperEnabled,
				// `{}` hides every line and handler; `undefined` keeps the default set.
				lines: cropperEnabled ? undefined : {},
				handlers: cropperEnabled ? undefined : {},
				overlayClassName: [
					'image-editor__cropper-overlay',
					!cropperEnabled && 'image-editor__cropper-overlay--faded'
				]
			}}
			backgroundWrapperProps={{
				scaleImage: cropperEnabled,
				moveImage: cropperEnabled
			}}
			backgroundComponent={AdjustableCropperBackground}
			backgroundProps={adjustments}
		/>
		{#if mode !== 'crop'}
			<Slider class="image-editor__slider" label={mode} bind:value={adjustments[mode]} />
		{/if}
		<CropperPreview
			class="image-editor__preview"
			{cropper}
			backgroundComponent={AdjustablePreviewBackground}
			backgroundProps={adjustments}
		/>
		<Button
			class={['image-editor__reset-button', !adjusted && 'image-editor__reset-button--hidden']}
			aria-label="Reset the adjustments"
			onclick={reset}
		>
			<RotateCcw size={20} />
		</Button>
	</div>
	<Navigation bind:mode {onUpload} {onDownload} />
</div>

<style>
	.image-editor {
		color: #61dafb;
		border: solid 1px #2b2a30;
	}
	.image-editor__cropper {
		position: relative;
		height: 500px;
		max-height: 100vh;
		background: #0f0e13;
	}
	.image-editor__cropper :global(.image-editor__slider) {
		position: absolute;
		bottom: 20px;
		left: 50%;
		transform: translateX(-50%);
	}
	.image-editor__cropper :global(.image-editor__preview) {
		position: absolute;
		left: 20px;
		top: 20px;
		width: 45px;
		height: 45px;
		border: solid 1px #2b2a30;
		border-radius: 50%;
		background: black;
	}
	:global(.image-editor__cropper-overlay) {
		transition: 0.5s;
	}
	:global(.image-editor__cropper-overlay--faded) {
		color: rgba(0, 0, 0, 0.9);
	}
	.image-editor__cropper :global(.image-editor__reset-button) {
		position: absolute;
		right: 20px;
		top: 20px;
		background: rgba(255, 255, 255, 0.1);
	}
	.image-editor__cropper :global(.image-editor__reset-button:hover) {
		color: #61dafb;
		background: rgba(255, 255, 255, 0.2);
	}
	.image-editor__cropper :global(.image-editor__reset-button--hidden) {
		opacity: 0;
		visibility: hidden;
	}
</style>

<script lang="ts">
	import { Cropper, type CropperRef } from 'svelte-advanced-cropper';
	import { image } from '#site/paths.ts';

	const src = image('yosemite-river.jpg');

	let cropper: CropperRef | undefined = $state();

	function uploadResult() {
		cropper?.getCanvas()?.toBlob(sendToServer, 'image/jpeg');
	}

	function sendToServer(blob: Blob | null) {
		if (!blob) {
			return;
		}

		const form = new FormData();
		form.append('file', blob);
		// Replace the URL with your own endpoint. This one doesn't accept uploads, so the
		// request is expected to fail.
		fetch('http://example.com/upload/', {
			method: 'POST',
			body: form
		}).catch((error: unknown) => {
			console.warn('Upload failed:', error);
		});
	}
</script>

<div class="upload-example">
	<Cropper
		bind:this={cropper}
		class="upload-example__cropper"
		backgroundClassName="upload-example__cropper-background"
		{src}
	/>
	<button type="button" class="upload-example__button" onclick={uploadResult}>Crop Image</button>
</div>

<style>
	:global(.upload-example__cropper) {
		border: solid 1px #36393f;
		max-height: 450px;
		background: var(--color-surface);
	}
	:global(.upload-example__cropper-background) {
		background: black;
	}
	.upload-example__button {
		display: block;
		width: 100%;
		padding: 10px 20px;
		border: none;
		font: inherit;
		font-size: 16px;
		color: white;
		background: #36393f;
		cursor: pointer;
		transition: background 0.5s;
	}
	.upload-example__button:hover {
		background: #20232a;
	}
</style>

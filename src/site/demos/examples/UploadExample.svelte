<script lang="ts">
	import { Cropper, type CropperInstance } from 'svelte-advanced-cropper';
	import { image } from '#site/paths.ts';

	const src = image('yosemite-river.jpg');

	let cropper: CropperInstance | undefined = $state();

	let submitting = $state(false);
	let status = $state('');
	const ready = $derived(Boolean(cropper?.getCoordinates()));

	async function uploadResult() {
		const canvas = cropper?.getCanvas();
		if (!canvas || submitting) {
			return;
		}

		submitting = true;
		status = 'Preparing JPEG…';
		try {
			const blob = await new Promise<Blob | null>((resolve) =>
				canvas.toBlob(resolve, 'image/jpeg')
			);
			if (!blob) {
				throw new Error('Could not encode the crop.');
			}

			const form = new FormData();
			form.append('file', blob, 'crop.jpg');
			// Read the prepared submission locally; a real application can send this form to its endpoint.
			const file = form.get('file');
			if (file instanceof Blob) {
				const bytes = await file.arrayBuffer();
				status = `Simulated upload complete: ${bytes.byteLength.toLocaleString()} bytes. Nothing was sent.`;
			}
		} catch (error: unknown) {
			status = error instanceof Error ? error.message : 'Could not prepare the upload.';
		} finally {
			submitting = false;
		}
	}
</script>

<div class="upload-example">
	<Cropper bind:this={cropper} class="upload-example__cropper" {src} />
	<button
		type="button"
		class="upload-example__button"
		onclick={uploadResult}
		disabled={!ready || submitting}>Simulate upload</button
	>
	<p role="status">{status}</p>
</div>

<style>
	:global(.upload-example__cropper) {
		border: solid 1px #36393f;
		max-height: 450px;
		background: var(--color-surface);
	}
	:global(.upload-example__cropper .advanced-cropper__background) {
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

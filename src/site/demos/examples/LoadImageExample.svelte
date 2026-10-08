<script lang="ts">
	import { Cropper, type CropperRef } from 'svelte-advanced-cropper';
	import { getMimeType } from 'advanced-cropper/extensions/mimes';
	import { X } from '@lucide/svelte';

	interface Image {
		type?: string;
		src: string;
	}

	let cropper: CropperRef | undefined = $state();
	let input: HTMLInputElement | undefined = $state();
	let image: Image | null = $state(null);

	// Each pick or clear starts a new request; a read that finishes after a newer one
	// (or after the demo is destroyed) is ignored.
	let request = 0;

	function onLoadImage(event: Event & { currentTarget: HTMLInputElement }) {
		const file = event.currentTarget.files?.[0];

		if (file) {
			const id = ++request;
			// Detect the real MIME type from the file's first bytes, so the result is
			// exported in the same format. `file.type` alone comes from the extension and
			// can be wrong, so it is only the fallback.
			const reader = new FileReader();
			reader.addEventListener('load', () => {
				if (id !== request) {
					return;
				}

				image = {
					// An object URL points at the file without copying it into memory as a string.
					src: URL.createObjectURL(file),
					type: getMimeType(reader.result, file.type)
				};
			});
			reader.readAsArrayBuffer(file);
		}

		// Reset the input so that picking the same file again still fires `change`.
		event.currentTarget.value = '';
	}

	function clear() {
		request++;
		image = null;
	}

	function download(blob: Blob, name: string) {
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = name;
		link.click();
		// Revoke on the next tick, once the browser has started the download.
		setTimeout(() => URL.revokeObjectURL(url));
	}

	function onCrop() {
		const canvas = cropper?.getCanvas();
		const type = image?.type;
		if (canvas) {
			canvas.toBlob((blob) => {
				if (blob) {
					download(blob, `cropped.${blob.type.split('/')[1] ?? 'png'}`);
				}
			}, type);
		}
	}

	$effect(() => () => {
		request++;
	});

	$effect(() => {
		const src = image?.src;

		// Revoke the previous object URL when the image changes, so the browser can free the file.
		return () => {
			if (src) {
				URL.revokeObjectURL(src);
			}
		};
	});
</script>

<div class="load-image-example">
	<div class="load-image-example__cropper-wrapper">
		<Cropper
			bind:this={cropper}
			class="load-image-example__cropper"
			backgroundClassName="load-image-example__cropper-background"
			src={image?.src}
		/>
		<button
			type="button"
			class="load-image-example__reset-button"
			title="Reset Image"
			onclick={clear}
		>
			<X size={22} />
		</button>
		{#if image}
			<div class="load-image-example__file-type">{image.type}</div>
		{/if}
	</div>
	<div class="load-image-example__buttons">
		<button type="button" class="load-image-example__button" onclick={() => input?.click()}>
			Upload image
		</button>
		{#if image}
			<button type="button" class="load-image-example__button" onclick={onCrop}>
				Download result
			</button>
		{/if}
	</div>
	<input
		bind:this={input}
		class="load-image-example__file-input"
		type="file"
		accept="image/*"
		onchange={onLoadImage}
	/>
</div>

<style>
	.load-image-example {
		user-select: none;
	}
	.load-image-example__cropper-wrapper {
		position: relative;
	}
	:global(.load-image-example__cropper) {
		border: solid 1px #36393f;
		min-height: 400px;
		max-height: 500px;
		background: white;
	}
	:global(.load-image-example__cropper-background) {
		background: black;
	}
	.load-image-example__reset-button {
		position: absolute;
		right: 20px;
		bottom: 20px;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 42px;
		height: 42px;
		padding: 0;
		border: none;
		color: white;
		background: #36393f;
		cursor: pointer;
		transition: background 0.5s;
	}
	.load-image-example__reset-button:hover {
		background: #20232a;
	}
	.load-image-example__file-type {
		position: absolute;
		top: 20px;
		left: 20px;
		padding: 0 10px 2px;
		border-radius: 5px;
		font-size: 12px;
		color: white;
		background: #0d0d0d;
	}
	.load-image-example__buttons {
		display: flex;
	}
	.load-image-example__button {
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
	.load-image-example__button:hover,
	.load-image-example__button:focus-visible {
		background: #20232a;
	}
	.load-image-example__file-input {
		display: none;
	}
</style>

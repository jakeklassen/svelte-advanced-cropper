<script lang="ts">
	import { onDestroy } from 'svelte';
	import { Cropper } from 'svelte-advanced-cropper';
	import { image } from '#site/paths.ts';
	import { croppablePhotoUrl } from './croppablePhoto.ts';

	type Status = 'loading' | 'converting' | 'ready' | 'error';

	let src = $state(image('calico-cat.jpg'));
	let status: Status = $state('loading');
	let latestPick = 0;

	// Own upload URLs separately from preset sources.
	let uploadedUrl: string | undefined;

	function revokeUploadedUrl() {
		if (uploadedUrl) {
			URL.revokeObjectURL(uploadedUrl);
			uploadedUrl = undefined;
		}
	}

	onDestroy(() => {
		latestPick++;
		revokeUploadedUrl();
	});

	async function upload(event: Event & { currentTarget: HTMLInputElement }) {
		const input = event.currentTarget;
		const file = input.files?.[0];
		// Reset the input so that picking the same file again still fires `change`.
		input.value = '';
		if (!file) {
			return;
		}

		// A newer pick wins if two conversions overlap.
		const id = ++latestPick;
		status = 'converting';
		try {
			const url = await croppablePhotoUrl(file);
			if (id !== latestPick) {
				URL.revokeObjectURL(url);

				return;
			}

			revokeUploadedUrl();
			uploadedUrl = url;
			src = uploadedUrl;
			status = 'loading';
		} catch {
			if (id === latestPick) {
				status = 'error';
			}
		}
	}

	const messages: Record<Status, string> = {
		loading: 'Loading…',
		converting: 'Preparing the photo…',
		ready: 'Ready. Try a HEIC photo from an iPhone.',
		error: "This photo can't be opened. Try another one."
	};
</script>

<div class="heic-upload-example">
	<Cropper
		class="heic-upload-example__cropper"
		{src}
		onReady={() => (status = 'ready')}
		onError={() => (status = 'error')}
	/>
</div>

<div class="demo-buttons">
	<label class="demo-button heic-upload-example__pick">
		Upload a photo
		<input type="file" accept="image/*,.heic,.heif" onchange={upload} />
	</label>
</div>

<p
	class={['heic-upload-example__status', `heic-upload-example__status--${status}`]}
	aria-live="polite"
>
	{messages[status]}
</p>

<style>
	.heic-upload-example {
		height: 320px;
		background: black;
	}
	.heic-upload-example :global(.heic-upload-example__cropper) {
		height: 100%;
	}
	.heic-upload-example__pick input {
		position: absolute;
		width: 1px;
		height: 1px;
		opacity: 0;
	}
	.heic-upload-example__pick:focus-within {
		outline: 2px solid var(--color-primary);
		outline-offset: 2px;
	}
	.heic-upload-example__status {
		margin: 0.75rem 0 0;
		font-size: 0.9rem;
	}
	.heic-upload-example__status--error {
		color: light-dark(#b42318, #f97066);
	}
</style>

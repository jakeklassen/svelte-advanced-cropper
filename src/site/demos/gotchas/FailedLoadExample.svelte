<script lang="ts">
	import { Cropper } from 'svelte-advanced-cropper';
	import { image } from '#site/paths.ts';

	type Status = 'loading' | 'ready' | 'error';

	const photo = image('photo-1553301208-a3718cc0150e.jpg');

	let src = $state(photo);
	let checkOrientation = $state(true);
	let status: Status = $state('loading');
	let stalled = $state(false);
	// Each load attempt mounts a fresh cropper, so the same src can be retried.
	let attempt = $state(0);

	function load(nextSrc: string) {
		src = nextSrc;
		status = 'loading';
		attempt++;
	}

	// An upload whose object URL has been revoked, or whose blob the browser has evicted
	// from memory: what a phone can hand you after the photo was picked.
	function brokenUpload() {
		const url = URL.createObjectURL(new Blob(['not a photo'], { type: 'image/jpeg' }));
		URL.revokeObjectURL(url);

		return url;
	}

	// Flags a load that has taken suspiciously long. Restarts with every attempt.
	$effect(() => {
		void attempt;
		stalled = false;
		if (status !== 'loading') {
			return;
		}

		const timer = setTimeout(() => (stalled = true), 3000);

		return () => clearTimeout(timer);
	});

	const message = $derived.by(() => {
		if (status === 'ready') {
			return 'Ready.';
		}

		if (status === 'error') {
			return 'onError fired: time to show a "this photo can\'t be opened" message.';
		}

		if (stalled) {
			return 'Still loading after 3 seconds. Neither onReady nor onError will ever fire.';
		}

		return 'Loading…';
	});
</script>

<div class="failed-load-example">
	{#key attempt}
		<Cropper
			class="failed-load-example__cropper"
			{src}
			{checkOrientation}
			onReady={() => (status = 'ready')}
			onError={() => (status = 'error')}
		/>
	{/key}
</div>

<div class="demo-buttons">
	<button class="demo-button" type="button" onclick={() => load(photo)}>Load a photo</button>
	<button class="demo-button" type="button" onclick={() => load(brokenUpload())}>
		Load a broken upload
	</button>
	<label class="failed-load-example__option">
		<input
			type="checkbox"
			bind:checked={
				() => checkOrientation,
				(value) => {
					checkOrientation = value;
					load(src);
				}
			}
		/>
		<code>checkOrientation</code>
	</label>
</div>

<p
	class={['failed-load-example__status', `failed-load-example__status--${status}`]}
	aria-live="polite"
>
	{message}
</p>

<style>
	.failed-load-example {
		height: 320px;
		background: black;
	}
	.failed-load-example :global(.failed-load-example__cropper) {
		height: 100%;
	}
	.failed-load-example__option {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		font-size: 0.9rem;
	}
	.failed-load-example__status {
		margin: 0.75rem 0 0;
		font-size: 0.9rem;
	}
	.failed-load-example__status--error {
		color: #b42318;
	}
</style>

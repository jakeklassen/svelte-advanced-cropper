<script lang="ts">
	import { Cropper, type CropperInstance, type PartialTransforms } from 'svelte-advanced-cropper';
	import { image } from '#site/paths.ts';

	let cropper: CropperInstance | undefined = $state();
	let input: HTMLInputElement | undefined = $state();
	let src = $state(image('tabby-cat-on-stairs.jpg'));

	const transforms: Record<string, PartialTransforms> = {
		'horizontal-flip': { flip: { horizontal: true } },
		'vertical-flip': { flip: { vertical: true } },
		'rotate-90': { rotate: 90 },
		'rotate-180': { rotate: 180 }
	};

	let transformsType = $state('rotate-90');
	const defaultTransforms = $derived(transforms[transformsType]);

	function loadImage(event: Event & { currentTarget: HTMLInputElement }) {
		const file = event.currentTarget.files?.[0];
		if (file) {
			src = URL.createObjectURL(file);
		}

		// Reset the input so that picking the same file again still fires `change`.
		event.currentTarget.value = '';
	}

	// Free the previous object URL once it is replaced (a no-op for regular URLs).
	$effect(() => {
		const current = src;

		return () => {
			if (current.startsWith('blob:')) {
				URL.revokeObjectURL(current);
			}
		};
	});
</script>

<div class="default-transforms-example">
	<Cropper
		bind:this={cropper}
		class="default-transforms-example__cropper"
		{defaultTransforms}
		{src}
	/>
	<div class="default-transforms-example__panel">
		<label class="default-transforms-example__panel-left">
			<span class="default-transforms-example__label">Default Transform</span>
			<!-- Default transforms apply when the cropper resets, so reset after a change. -->
			<select
				bind:value={
					() => transformsType,
					(type) => {
						transformsType = type;
						cropper?.reset();
					}
				}
				class="default-transforms-example__select"
			>
				<option value="horizontal-flip">Horizontal Flip</option>
				<option value="vertical-flip">Vertical Flip</option>
				<option value="rotate-90">Rotate 90°</option>
				<option value="rotate-180">Rotate 180°</option>
			</select>
		</label>
		<button type="button" class="default-transforms-example__button" onclick={() => input?.click()}>
			Upload image
		</button>
		<input
			bind:this={input}
			class="default-transforms-example__file-input"
			type="file"
			accept="image/*"
			onchange={loadImage}
		/>
	</div>
</div>

<style>
	:global(.default-transforms-example__cropper) {
		width: 100%;
		max-height: 500px;
		background: #354146;
	}
	.default-transforms-example__panel {
		display: flex;
		color: white;
		background: #36393f;
	}
	.default-transforms-example__panel-left {
		display: block;
		flex: 1;
		min-width: 0;
		padding: 20px;
		border-right: 1px solid #20232a;
	}
	.default-transforms-example__label {
		display: block;
		margin-bottom: 5px;
		font-size: 11px;
	}
	.default-transforms-example__select {
		width: 100%;
		padding: 8px;
		border: none;
		color: var(--color-text);
		background: var(--color-surface-raised);
		font: inherit;
		font-size: 15px;
	}
	.default-transforms-example__file-input {
		display: none;
	}
	.default-transforms-example__button {
		appearance: none;
		flex: 0 0 auto;
		width: 150px;
		max-width: 40%;
		padding: 10px 20px;
		border: none;
		color: white;
		font: inherit;
		font-size: 16px;
		background: #36393f;
		cursor: pointer;
		transition: background 0.5s;
	}
	.default-transforms-example__button:hover {
		background: #20232a;
	}
</style>

<script lang="ts">
	import { Cropper, type CropperRef } from 'svelte-advanced-cropper';
	import { image } from '#site/paths.ts';

	let cropper: CropperRef | undefined = $state();
	let input: HTMLInputElement | undefined = $state();
	let src = $state(image('farzin-yarahmadi-yR3GrvkWnLA-unsplash.jpg'));

	let transformsType = $state('rotate-90');

	const defaultTransforms = $derived.by(() => {
		if (transformsType === 'horizontal-flip') {
			return { flip: { horizontal: true } };
		} else if (transformsType === 'vertical-flip') {
			return { flip: { vertical: true } };
		} else if (transformsType === 'rotate-90') {
			return { rotate: 90 };
		} else if (transformsType === 'rotate-180') {
			return { rotate: 180 };
		}
	});

	function onLoadImage(event: Event & { currentTarget: HTMLInputElement }) {
		const file = event.currentTarget.files?.[0];
		if (file) {
			src = URL.createObjectURL(file);
		}
		event.currentTarget.value = '';
	}

	// Revoke the previous object URL so the browser can free the old file.
	$effect(() => {
		const current = src;
		return () => {
			if (current.startsWith('blob:')) URL.revokeObjectURL(current);
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
				bind:value={transformsType}
				class="default-transforms-example__select"
				onchange={() => cropper?.reset()}
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
			onchange={onLoadImage}
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
		color: black;
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

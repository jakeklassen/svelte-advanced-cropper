<script lang="ts">
	import { Cropper, ImageRestriction, type CropperRef } from 'svelte-advanced-cropper';
	import { image } from '#site/paths.ts';

	const src = image('kitten-yawning.jpg');

	let cropper: CropperRef | undefined = $state();
	let imageRestriction = $state(ImageRestriction.none);

	// Open the cropped result in a new tab.
	function openResultInNewTab() {
		const canvas = cropper?.getCanvas();
		if (!canvas) {
			return;
		}

		const newTab = window.open();
		if (newTab) {
			newTab.document.body.innerHTML = `<img src="${canvas.toDataURL()}">`;
		}
	}
</script>

<div class="image-restriction-example">
	<Cropper
		bind:this={cropper}
		class="image-restriction-example__cropper"
		{imageRestriction}
		{src}
	/>
	<div class="image-restriction-example__panel">
		<label class="image-restriction-example__panel-left">
			<span class="image-restriction-example__label">Image Restriction Type</span>
			<select bind:value={imageRestriction} class="image-restriction-example__select">
				<option value={ImageRestriction.fillArea}>fillArea</option>
				<option value={ImageRestriction.fitArea}>fitArea</option>
				<option value={ImageRestriction.stencil}>stencil</option>
				<option value={ImageRestriction.none}>none</option>
			</select>
		</label>
		<button type="button" class="image-restriction-example__button" onclick={openResultInNewTab}>
			Download
		</button>
	</div>
</div>

<style>
	:global(.image-restriction-example__cropper) {
		width: 100%;
		max-height: 500px;
		background: #354146;
	}
	.image-restriction-example__panel {
		display: flex;
		color: white;
		background: #36393f;
	}
	.image-restriction-example__panel-left {
		display: block;
		flex: 1;
		min-width: 0;
		padding: 20px;
		border-right: 1px solid #20232a;
	}
	.image-restriction-example__label {
		display: block;
		margin-bottom: 5px;
		font-size: 11px;
	}
	.image-restriction-example__select {
		width: 100%;
		padding: 8px;
		border: none;
		color: var(--color-text);
		background: var(--color-surface-raised);
		font: inherit;
		font-size: 15px;
	}
	.image-restriction-example__button {
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
	.image-restriction-example__button:hover {
		background: #20232a;
	}
</style>

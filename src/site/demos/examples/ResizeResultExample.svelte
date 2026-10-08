<script lang="ts">
	import { Cropper, type CropperRef } from 'svelte-advanced-cropper';
	import { image } from '#site/paths.ts';

	const src = image('dogs-running.jpg');

	let cropper: CropperRef | undefined = $state();

	// An empty number input binds to null; getCanvas() expects undefined for "no limit".
	let maxWidth: number | null = $state(256);
	let minWidth: number | null = $state(null);
	let width: number | null = $state(null);
	let height: number | null = $state(null);
	let maxArea: number | null = $state(null);

	// Open the resized result in a new tab.
	function openResultInNewTab() {
		const canvas = cropper?.getCanvas({
			maxWidth: maxWidth ?? undefined,
			minWidth: minWidth ?? undefined,
			width: width ?? undefined,
			height: height ?? undefined,
			maxArea: maxArea ?? undefined
		});
		if (!canvas) {
			return;
		}

		const newTab = window.open();
		if (newTab) {
			newTab.document.body.innerHTML = `<img src="${canvas.toDataURL()}">`;
		}
	}
</script>

<div class="resize-result-example">
	<Cropper bind:this={cropper} class="resize-result-example__cropper" {src} />
	<div class="resize-result-example__panel">
		<div class="resize-result-example__inputs">
			<label class="resize-result-example__input">
				<span>Max width</span>
				<input type="number" min="0" bind:value={maxWidth} />
			</label>
			<label class="resize-result-example__input">
				<span>Min width</span>
				<input type="number" min="0" bind:value={minWidth} />
			</label>
			<label class="resize-result-example__input">
				<span>Width</span>
				<input type="number" min="0" bind:value={width} />
			</label>
			<label class="resize-result-example__input">
				<span>Height</span>
				<input type="number" min="0" bind:value={height} />
			</label>
			<label class="resize-result-example__input">
				<span>Max area (width × height)</span>
				<input type="number" min="0" bind:value={maxArea} />
			</label>
		</div>
		<button type="button" class="resize-result-example__button" onclick={openResultInNewTab}
			>Crop</button
		>
	</div>
</div>

<style>
	:global(.resize-result-example__cropper) {
		max-height: 450px;
		border: solid 1px var(--color-border);
		background: #354146;
	}
	.resize-result-example__panel {
		display: flex;
		gap: 30px;
		padding: 20px;
		border: solid 1px var(--color-border);
		background: var(--color-surface-subtle);
		color: var(--color-text);
	}
	.resize-result-example__inputs {
		flex: 1;
		min-width: 0;
	}
	.resize-result-example__input {
		display: block;
		margin-bottom: 8px;
	}
	.resize-result-example__input span {
		display: block;
		font-size: 11px;
		margin-bottom: 3px;
	}
	.resize-result-example__input input {
		box-sizing: border-box;
		width: 100%;
		padding: 4px;
		font: inherit;
		font-size: 15px;
		color: var(--color-text);
		border: solid 1px var(--color-border);
		background: var(--color-surface-raised);
	}
	.resize-result-example__button {
		width: 120px;
		margin-top: 15px;
		padding: 17px 20px;
		border: none;
		font: inherit;
		font-size: 16px;
		color: white;
		background: #36393f;
		cursor: pointer;
		transition: background 0.5s;
	}
	.resize-result-example__button:hover {
		background: #20232a;
	}
	@media (max-width: 540px) {
		.resize-result-example__panel {
			flex-direction: column;
			gap: 0;
		}
		.resize-result-example__button {
			width: 100%;
		}
	}
</style>

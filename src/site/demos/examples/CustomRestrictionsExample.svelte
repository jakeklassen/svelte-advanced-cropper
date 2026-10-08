<script lang="ts">
	import {
		Cropper,
		getTransformedImageSize,
		retrieveSizeRestrictions,
		type CropperRef,
		type CropperState,
		type DefaultSettings
	} from 'svelte-advanced-cropper';
	import { image } from '#site/paths.ts';

	let cropper: CropperRef | undefined = $state();
	let input: HTMLInputElement | undefined = $state();
	let src = $state(image('photo-1494205577727-d32e58564756.jpg'));

	// Percentages of the image size. An empty field is `null` (no restriction).
	let minWidth: number | null = $state(50);
	let minHeight: number | null = $state(null);
	let maxWidth: number | null = $state(null);
	let maxHeight: number | null = $state(null);

	// Read the min/max props as percentages of the (transformed) image size.
	function percentsRestriction(state: CropperState, settings: DefaultSettings) {
		const percents = retrieveSizeRestrictions(settings);
		const imageSize = getTransformedImageSize(state);

		return {
			minWidth: (percents.minWidth / 100) * imageSize.width,
			minHeight: (percents.minHeight / 100) * imageSize.height,
			maxWidth: (percents.maxWidth / 100) * imageSize.width,
			maxHeight: (percents.maxHeight / 100) * imageSize.height
		};
	}

	function onDownloadResult() {
		const result = cropper?.getCanvas()?.toDataURL();
		const newTab = window.open();
		if (newTab && result) {
			newTab.document.body.innerHTML = `<img src="${result}">`;
		}
	}

	function onLoadImage(event: Event & { currentTarget: HTMLInputElement }) {
		const file = event.currentTarget.files?.[0];
		if (file) {
			const reader = new FileReader();
			reader.addEventListener('load', () => {
				if (typeof reader.result === 'string') {
					src = reader.result;
				}
			});
			reader.readAsDataURL(file);
		}
	}
</script>

<div class="custom-restrictions-example">
	<Cropper
		bind:this={cropper}
		class="custom-restrictions-example__cropper"
		sizeRestrictions={percentsRestriction}
		{src}
		minWidth={minWidth ?? undefined}
		minHeight={minHeight ?? undefined}
		maxWidth={maxWidth ?? undefined}
		maxHeight={maxHeight ?? undefined}
	/>
	<div class="custom-restrictions-example__panel">
		<div class="custom-restrictions-example__panel-left">
			<label class="custom-restrictions-example__input">
				<span>Min width</span>
				<input type="number" bind:value={minWidth} />
			</label>
			<label class="custom-restrictions-example__input">
				<span>Min height</span>
				<input type="number" bind:value={minHeight} />
			</label>
			<label class="custom-restrictions-example__input">
				<span>Max width</span>
				<input type="number" bind:value={maxWidth} />
			</label>
			<label class="custom-restrictions-example__input">
				<span>Max height</span>
				<input type="number" bind:value={maxHeight} />
			</label>
		</div>
		<div class="custom-restrictions-example__panel-right">
			<button
				type="button"
				class="custom-restrictions-example__button"
				onclick={() => input?.click()}
			>
				Upload image
			</button>
			<input
				bind:this={input}
				class="custom-restrictions-example__file-input"
				type="file"
				accept="image/*"
				onchange={onLoadImage}
			/>
			<button type="button" class="custom-restrictions-example__button" onclick={onDownloadResult}>
				Download result
			</button>
		</div>
	</div>
</div>

<style>
	:global(.custom-restrictions-example__cropper) {
		width: 100%;
		max-height: 500px;
		background: #354146;
	}
	.custom-restrictions-example__panel {
		display: flex;
		color: white;
		background: #36393f;
	}
	.custom-restrictions-example__panel-left {
		flex: 1;
		min-width: 0;
		padding: 10px 20px;
		border-right: 1px solid #20232a;
	}
	.custom-restrictions-example__input {
		display: block;
	}
	.custom-restrictions-example__input span {
		display: block;
		margin-bottom: 5px;
		font-size: 11px;
	}
	.custom-restrictions-example__input input {
		box-sizing: border-box;
		width: 100%;
		margin-bottom: 5px;
		padding: 2px;
		border: none;
		color: black;
		font: inherit;
		font-size: 15px;
	}
	.custom-restrictions-example__panel-right {
		display: flex;
		flex: 0 0 auto;
		flex-direction: column;
		width: 150px;
		max-width: 40%;
	}
	.custom-restrictions-example__file-input {
		display: none;
	}
	.custom-restrictions-example__button {
		appearance: none;
		flex: 1;
		padding: 10px 20px;
		border: none;
		color: white;
		font: inherit;
		font-size: 16px;
		background: #36393f;
		cursor: pointer;
		transition: background 0.5s;
	}
	.custom-restrictions-example__file-input + .custom-restrictions-example__button {
		border-top: 1px solid #20232a;
	}
	.custom-restrictions-example__button:hover {
		background: #20232a;
	}
</style>

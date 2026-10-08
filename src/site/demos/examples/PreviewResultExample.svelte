<script lang="ts">
	import {
		Cropper,
		CropperPreview,
		type CropperPreviewRef,
		type CropperRef
	} from 'svelte-advanced-cropper';
	import { RotateCcw, Upload } from '@lucide/svelte';
	import SquareButton from '#site/demos/shared/SquareButton.svelte';
	import { image } from '#site/paths.ts';

	let src = $state(image('photo-1623432532623-f8f1347d954c.jpg'));

	let cropper: CropperRef | undefined = $state();
	let largePreview: CropperPreviewRef | undefined = $state();
	let smallPreview: CropperPreviewRef | undefined = $state();
	let input: HTMLInputElement | undefined = $state();

	function onUpdate(instance: CropperRef) {
		largePreview?.update(instance);
		smallPreview?.update(instance);
	}

	function onRotate() {
		cropper?.rotateImage(90);
	}

	function onLoadImage(event: Event & { currentTarget: HTMLInputElement }) {
		const file = event.currentTarget.files?.[0];
		if (file) {
			src = URL.createObjectURL(file);
		}
		event.currentTarget.value = '';
	}

	$effect(() => {
		const current = src;
		// Free the previous object URL once it is replaced (a no-op for regular URLs).
		return () => {
			if (current.startsWith('blob:')) URL.revokeObjectURL(current);
		};
	});
</script>

<div class="preview-result-example">
	<Cropper
		bind:this={cropper}
		{src}
		stencilProps={{ aspectRatio: 1 }}
		class="preview-result-example__cropper"
		{onUpdate}
	/>
	<div class="preview-result-example__previews">
		<CropperPreview bind:this={largePreview} class="preview-result-example__preview" />
		<CropperPreview
			bind:this={smallPreview}
			class="preview-result-example__preview preview-result-example__preview--small"
		/>
	</div>
	<div class="preview-result-example__buttons">
		<SquareButton title="Upload" onclick={() => input?.click()}>
			<Upload size={20} />
		</SquareButton>
		<SquareButton title="Rotate" onclick={onRotate}>
			<RotateCcw size={20} />
		</SquareButton>
	</div>
	<input
		bind:this={input}
		class="preview-result-example__file-input"
		type="file"
		accept="image/*"
		onchange={onLoadImage}
	/>
</div>

<style>
	.preview-result-example {
		display: flex;
		align-items: flex-start;
		position: relative;
	}
	:global(.preview-result-example__cropper) {
		width: 300px;
		max-width: calc(100% - 92px);
	}
	.preview-result-example__previews {
		margin-left: 32px;
	}
	:global(.preview-result-example__preview) {
		border-radius: 50%;
		overflow: hidden;
		margin: 24px 0;
		width: 100px;
		height: 100px;
	}
	:global(.preview-result-example__preview--small) {
		width: 60px;
		height: 60px;
	}
	.preview-result-example__buttons {
		position: absolute;
		display: flex;
		gap: 16px;
		left: 16px;
		bottom: 0;
	}
	.preview-result-example__file-input {
		display: none;
	}
	@media (max-width: 540px) {
		.preview-result-example__previews {
			margin-left: 12px;
		}
		:global(.preview-result-example__preview) {
			width: 60px;
			height: 60px;
		}
		:global(.preview-result-example__preview--small) {
			width: 40px;
			height: 40px;
		}
	}
</style>

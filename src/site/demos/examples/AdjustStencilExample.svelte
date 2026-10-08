<script lang="ts">
	import {
		Cropper,
		ImageRestriction,
		Priority,
		type CropperRef,
		type CropperState
	} from 'svelte-advanced-cropper';
	import { image } from '#site/paths.ts';

	let cropper: CropperRef | undefined = $state();
	let adjustStencil = $state(false);

	// Start with a stencil covering 80% of the visible area, centred in it.
	function defaultSize({ visibleArea, imageSize }: CropperState) {
		const area = visibleArea ?? imageSize;
		return {
			width: area.width * 0.8,
			height: area.height * 0.8
		};
	}

	function defaultPosition({ visibleArea }: CropperState) {
		return visibleArea
			? {
					left: visibleArea.left + 0.1 * visibleArea.width,
					top: visibleArea.top + 0.1 * visibleArea.height
				}
			: { left: 0, top: 0 };
	}
</script>

<div class="adjust-stencil-example">
	<Cropper
		bind:this={cropper}
		class="adjust-stencil-example__cropper"
		transformImage={{ adjustStencil }}
		priority={Priority.visibleArea}
		imageRestriction={ImageRestriction.fitArea}
		{defaultSize}
		{defaultPosition}
		defaultVisibleArea={{
			width: 1024,
			height: 689,
			left: 19,
			top: 285
		}}
		src={image('photo-1596473322597-91d5b6938b8a.jpg')}
	/>
	<label class="adjust-stencil-example__adjust">
		<input type="checkbox" bind:checked={adjustStencil} onchange={() => cropper?.reset()} />
		Adjust stencil
	</label>
</div>

<style>
	.adjust-stencil-example {
		position: relative;
	}
	:global(.adjust-stencil-example__cropper) {
		max-height: 500px;
		background: #354146;
	}
	.adjust-stencil-example__adjust {
		position: absolute;
		left: 20px;
		top: 20px;
		padding: 10px 20px;
		color: white;
		background: rgba(0, 0, 0, 0.7);
		cursor: pointer;
	}
</style>

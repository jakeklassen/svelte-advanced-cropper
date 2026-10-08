<script lang="ts">
	import {
		Cropper,
		ImageRestriction,
		Priority,
		type CropperRef,
		type CropperState
	} from 'svelte-advanced-cropper';
	import { image } from '#site/paths.ts';

	const src = image('photo-1596473322597-91d5b6938b8a.jpg');

	let cropper: CropperRef | undefined = $state();
	let adjustStencil = $state(false);

	// Start with a stencil covering 80% of the visible area, centred in it.
	const stencilScale = 0.8;
	const stencilOffset = (1 - stencilScale) / 2;

	function defaultSize({ visibleArea, imageSize }: CropperState) {
		const area = visibleArea ?? imageSize;

		return {
			width: area.width * stencilScale,
			height: area.height * stencilScale
		};
	}

	function defaultPosition({ visibleArea }: CropperState) {
		return visibleArea
			? {
					left: visibleArea.left + stencilOffset * visibleArea.width,
					top: visibleArea.top + stencilOffset * visibleArea.height
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
		{src}
	/>
	<label class="adjust-stencil-example__adjust">
		<!-- Start over from the default crop whenever the option changes. -->
		<input
			type="checkbox"
			bind:checked={
				() => adjustStencil,
				(checked) => {
					adjustStencil = checked;
					cropper?.reset();
				}
			}
		/>
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

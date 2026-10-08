<script lang="ts">
	import { Cropper, type CropperRef } from 'svelte-advanced-cropper';
	import {
		Expand,
		LocateFixed,
		Maximize,
		Minimize2,
		MoveHorizontal,
		MoveVertical
	} from '@lucide/svelte';
	import SquareButton from '#site/demos/shared/SquareButton.svelte';
	import VerticalButtons from '#site/demos/shared/VerticalButtons.svelte';
	import { image } from '#site/paths.ts';

	let cropper: CropperRef | undefined = $state();

	// Scale the stencil, then re-centre it on its previous centre. Each step of the
	// array is applied in turn, and each one respects the cropper's restrictions.
	function resize(width = 1, height = 1) {
		const initial = cropper?.getCoordinates();
		if (!cropper || !initial) return;

		cropper.setCoordinates([
			({ coordinates }) =>
				coordinates && {
					width: coordinates.width * width,
					height: coordinates.height * height
				},
			({ coordinates }) =>
				coordinates && {
					left: initial.left + (initial.width - coordinates.width) / 2,
					top: initial.top + (initial.height - coordinates.height) / 2
				}
		]);
	}

	function center() {
		cropper?.setCoordinates(
			({ coordinates, imageSize }) =>
				coordinates && {
					left: imageSize.width / 2 - coordinates.width / 2,
					top: imageSize.height / 2 - coordinates.height / 2
				}
		);
	}

	function maximize() {
		cropper?.setCoordinates(({ imageSize }) => imageSize);
	}
</script>

<div class="set-coordinates-example">
	<Cropper
		bind:this={cropper}
		class="set-coordinates-example__cropper"
		src={image('photo-1532182657011-d3d31357b5d8.jpg')}
		stencilProps={{
			minAspectRatio: 1 / 2
		}}
	/>
	<VerticalButtons>
		<SquareButton title="Resize (x2)" onclick={() => resize(2, 2)}><Expand /></SquareButton>
		<SquareButton title="Resize height (x2)" onclick={() => resize(1, 2)}>
			<MoveVertical />
		</SquareButton>
		<SquareButton title="Resize width (x2)" onclick={() => resize(2, 1)}>
			<MoveHorizontal />
		</SquareButton>
		<SquareButton title="Resize (x1/2)" onclick={() => resize(0.5, 0.5)}>
			<Minimize2 />
		</SquareButton>
		<SquareButton title="Maximize" onclick={maximize}><Maximize /></SquareButton>
		<SquareButton title="Center" onclick={center}><LocateFixed /></SquareButton>
	</VerticalButtons>
</div>

<style>
	.set-coordinates-example {
		position: relative;
	}
	:global(.set-coordinates-example__cropper) {
		max-height: 500px;
		background: #354146;
	}
</style>

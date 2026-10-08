<script lang="ts">
	import { onMount, tick } from 'svelte';
	import {
		BoundingBox,
		Cropper,
		ImageRestriction,
		anchorMoveToResizeDirections,
		useWindowResize,
		type CropperRef,
		type MoveDirections,
		type ResizeAnchor
	} from 'svelte-advanced-cropper';
	import { image } from '#site/paths.ts';

	let cropper: CropperRef | undefined = $state();
	let container: HTMLDivElement | undefined = $state();

	let width = $state(0);
	let height = $state(0);
	let left = $state(0);
	let top = $state(0);

	// Resize the box (clamped to the container), keep it centred, and tell the cropper
	// its container changed. The cropper can't detect that on its own.
	async function updateCoordinates(newWidth: number, newHeight: number) {
		if (!container) return;

		width = Math.min(Math.max(0, newWidth), container.clientWidth);
		height = Math.min(Math.max(0, newHeight), container.clientHeight);
		left = container.clientWidth / 2 - width / 2;
		top = container.clientHeight / 2 - height / 2;

		// Wait for the new size to reach the DOM before the cropper measures it.
		await tick();
		cropper?.refresh();
	}

	// The box stays centred, so it grows by twice the distance the handle moved.
	function onResize(anchor: ResizeAnchor, directions: MoveDirections) {
		const resize = anchorMoveToResizeDirections(anchor, directions);
		void updateCoordinates(
			width + (resize.left + resize.right) * 2,
			height + (resize.top + resize.bottom) * 2
		);
	}

	useWindowResize(() => {
		void updateCoordinates(width, height);
	});

	onMount(() => {
		if (container) void updateCoordinates(container.clientWidth, container.clientHeight);
	});
</script>

<div class="refresh-example" bind:this={container}>
	<BoundingBox
		class="refresh-example__wrapper"
		style="width: {width}px; height: {height}px; left: {left}px; top: {top}px;"
		{onResize}
		lineClassNames={{ default: 'refresh-example__line' }}
		handlerClassNames={{ default: 'refresh-example__handler' }}
	>
		<Cropper
			bind:this={cropper}
			class="refresh-example__cropper"
			src={image('photo-1553301208-a3718cc0150e.jpg')}
			stencilProps={{
				aspectRatio: 1
			}}
			minWidth={200}
			minHeight={300}
			imageRestriction={ImageRestriction.fillArea}
		/>
	</BoundingBox>
</div>

<style>
	.refresh-example {
		position: relative;
		width: 100%;
		height: 400px;
		border: 1px solid #eee;
	}
	:global(.refresh-example__wrapper) {
		position: absolute;
	}
	:global(.refresh-example__cropper) {
		width: 100%;
		height: 100%;
	}
	:global(.refresh-example__line) {
		border-color: rgba(97, 218, 251, 0.5);
	}
	:global(.refresh-example__handler) {
		background: #61dafb;
	}
</style>

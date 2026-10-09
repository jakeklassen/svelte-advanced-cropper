<script lang="ts">
	import {
		RectangleStencil,
		BoundingBox,
		Cropper,
		ImageRestriction,
		anchorMoveToResizeDirections,
		type CropperInstance,
		type MoveDirections,
		type ResizeAnchor
	} from 'svelte-advanced-cropper';
	import { image } from '#site/paths.ts';

	const src = image('orange-cat-on-table.jpg');

	let cropper: CropperInstance | undefined = $state();

	// The container's inner size, kept up to date by Svelte (also on window resizes).
	let containerWidth = $state(0);
	let containerHeight = $state(0);

	// The size the handles ask for. The box starts as large as the container.
	let requestedWidth = $state(Infinity);
	let requestedHeight = $state(Infinity);

	// The box never outgrows the container and stays centred in it.
	const width = $derived(Math.min(Math.max(0, requestedWidth), containerWidth));
	const height = $derived(Math.min(Math.max(0, requestedHeight), containerHeight));
	const left = $derived((containerWidth - width) / 2);
	const top = $derived((containerHeight - height) / 2);

	// The box stays centred, so it grows by twice the distance the handle moved.
	function onResize(anchor: ResizeAnchor, directions: MoveDirections) {
		const resize = anchorMoveToResizeDirections(anchor, directions);
		requestedWidth = width + (resize.left + resize.right) * 2;
		requestedHeight = height + (resize.top + resize.bottom) * 2;
	}

	// The cropper can't tell that its container changed size, so ask it to measure
	// itself again whenever the box does. Effects run after the DOM is updated, so the
	// cropper sees the new size.
	$effect(() => {
		void width;
		void height;
		cropper?.refresh();
	});
</script>

<div class="refresh-example" bind:clientWidth={containerWidth} bind:clientHeight={containerHeight}>
	<BoundingBox
		class="refresh-example__wrapper"
		style="width: {width}px; height: {height}px; left: {left}px; top: {top}px;"
		{onResize}
	>
		<Cropper
			bind:this={cropper}
			class="refresh-example__cropper"
			{src}
			minWidth={200}
			minHeight={300}
			imageRestriction={ImageRestriction.fillArea}
		>
			<RectangleStencil aspectRatio={1} />
		</Cropper>
	</BoundingBox>
</div>

<style>
	.refresh-example {
		position: relative;
		width: 100%;
		height: 400px;
		border: 1px solid var(--color-border);
	}
	:global(.refresh-example__wrapper) {
		position: absolute;
	}
	:global(.refresh-example__cropper) {
		width: 100%;
		height: 100%;
	}
	:global(
		.refresh-example__wrapper
			> .advanced-cropper-bounding-box__lines
			> .advanced-cropper-line-wrapper
			.advanced-cropper-simple-line
	) {
		border-color: rgba(97, 218, 251, 0.5);
	}
	:global(
		.refresh-example__wrapper
			> .advanced-cropper-bounding-box__handlers
			> .advanced-cropper-bounding-box__handler-wrapper
			> .advanced-cropper-handler-wrapper
			.advanced-cropper-simple-handler
	) {
		background: #61dafb;
	}
</style>

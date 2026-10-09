<script lang="ts">
	import {
		BoundingBox,
		anchoredResizeCoordinatesAlgorithm,
		approximateSize,
		createAspectRatio,
		moveToPositionRestrictions,
		type Coordinates,
		type MoveDirections,
		type ResizeAnchor,
		type ResizeOptions
	} from 'svelte-advanced-cropper';
	import { coordinatesToStyle } from './utils.ts';

	const aspectRatio = 1;

	let initialized = false;
	let boundary = $state.raw({ width: 0, height: 0 });
	let coordinates: Coordinates = $state.raw({ width: 100, height: 100, left: 0, top: 0 });
	// The coordinates at the start of the current resize, drawn as an outline.
	let reference: Coordinates | null = $state.raw(null);

	// The box can be any size, but it must stay inside the boundary.
	const sizeRestrictions = $derived({
		minWidth: 0,
		minHeight: 0,
		maxWidth: boundary.width,
		maxHeight: boundary.height
	});
	const positionRestrictions = $derived({
		left: 0,
		top: 0,
		right: boundary.width,
		bottom: boundary.height
	});

	function onResize(anchor: ResizeAnchor, directions: MoveDirections, options: ResizeOptions) {
		reference = options.reference || null;
		coordinates = anchoredResizeCoordinatesAlgorithm(coordinates, anchor, directions, options, {
			aspectRatio: createAspectRatio(aspectRatio),
			sizeRestrictions,
			positionRestrictions
		});
	}

	function onResizeEnd() {
		reference = null;
	}

	function updateBoundary(dimension: 'width' | 'height', value: number | null | undefined) {
		if (value == null) {
			return;
		}

		boundary = { ...boundary, [dimension]: value };
		if (!boundary.width || !boundary.height) {
			return;
		}

		if (!initialized) {
			initialized = true;
			coordinates = {
				width: 100,
				height: 100,
				left: boundary.width / 2 - 50,
				top: boundary.height / 2 - 50
			};
		}

		// Keep the box inside the (possibly smaller) boundary.
		coordinates = moveToPositionRestrictions(
			{
				...coordinates,
				...approximateSize({
					width: coordinates.width,
					height: coordinates.height,
					aspectRatio,
					sizeRestrictions
				})
			},
			positionRestrictions
		);
	}
</script>

<div
	class="resize-algorithm"
	bind:clientWidth={null, (width) => updateBoundary('width', width)}
	bind:clientHeight={null, (height) => updateBoundary('height', height)}
>
	<div
		class="resize-algorithm__boundary"
		style:width="{boundary.width}px"
		style:height="{boundary.height}px"
	>
		<BoundingBox
			reference={coordinates}
			style={coordinatesToStyle(coordinates)}
			class="resize-algorithm__stencil"
			{onResize}
			{onResizeEnd}
		/>
		{#if reference}
			<div class="resize-algorithm__reference" style={coordinatesToStyle(reference)}></div>
		{/if}
	</div>
</div>

<style>
	.resize-algorithm {
		width: 100%;
		height: 400px;
	}
	.resize-algorithm__boundary {
		position: relative;
	}
	.resize-algorithm :global(.resize-algorithm__stencil) {
		position: absolute;
		color: var(--color-primary);
	}
	.resize-algorithm :global(.resize-algorithm__stencil .advanced-cropper-simple-line) {
		border-color: var(--color-primary);
	}
	.resize-algorithm__reference {
		position: absolute;
		border: solid 1px var(--color-primary-dark);
		pointer-events: none;
	}
</style>

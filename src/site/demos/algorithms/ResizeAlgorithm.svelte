<script lang="ts">
	import { onMount } from 'svelte';
	import {
		BoundingBox,
		anchoredResizeCoordinatesAlgorithm,
		approximateSize,
		createAspectRatio,
		moveToPositionRestrictions,
		useWindowResize,
		type Coordinates,
		type MoveDirections,
		type ResizeAnchor,
		type ResizeOptions
	} from 'svelte-advanced-cropper';
	import { coordinatesToStyle } from './utils';

	const aspectRatio = 1;

	let example: HTMLDivElement | undefined = $state();
	let boundary = $state.raw({ width: 0, height: 0 });
	let coordinates: Coordinates = $state.raw({ width: 100, height: 100, left: 0, top: 0 });
	// The coordinates at the start of the current resize, drawn as an outline.
	let reference: Coordinates | null = $state.raw(null);

	function onResize(anchor: ResizeAnchor, directions: MoveDirections, options: ResizeOptions) {
		reference = options.reference || null;
		coordinates = anchoredResizeCoordinatesAlgorithm(coordinates, anchor, directions, options, {
			aspectRatio: createAspectRatio(aspectRatio),
			sizeRestrictions: {
				maxWidth: boundary.width,
				maxHeight: boundary.height,
				minWidth: 0,
				minHeight: 0
			},
			positionRestrictions: {
				left: 0,
				top: 0,
				right: boundary.width,
				bottom: boundary.height
			}
		});
	}

	function onResizeEnd() {
		reference = null;
	}

	function updateBoundary() {
		if (example) {
			boundary = { width: example.clientWidth, height: example.clientHeight };
			// Keep the box inside the (possibly smaller) boundary.
			coordinates = moveToPositionRestrictions(
				{
					...coordinates,
					...approximateSize({
						width: coordinates.width,
						height: coordinates.height,
						aspectRatio,
						sizeRestrictions: {
							maxWidth: boundary.width,
							maxHeight: boundary.height,
							minWidth: 0,
							minHeight: 0
						}
					})
				},
				{ left: 0, top: 0, right: boundary.width, bottom: boundary.height }
			);
		}
	}

	useWindowResize(updateBoundary);

	onMount(() => {
		if (example) {
			coordinates = {
				width: 100,
				height: 100,
				left: example.clientWidth / 2 - 50,
				top: example.clientHeight / 2 - 50
			};
			updateBoundary();
		}
	});
</script>

<div class="resize-algorithm" bind:this={example}>
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
			lineClassNames={{ default: 'resize-algorithm__stencil-line' }}
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
	.resize-algorithm :global(.resize-algorithm__stencil-line) {
		border-color: var(--color-primary);
	}
	.resize-algorithm__reference {
		position: absolute;
		border: solid 1px var(--color-primary-dark);
		pointer-events: none;
	}
</style>

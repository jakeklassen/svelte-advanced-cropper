<!--
	A rectangle stencil for print products, assembled from the library's stencil parts, with
	print guides drawn over the crop: the band that is trimmed off (bleed), the cut line, the
	safe area to keep faces and text inside, and optional puzzle-piece lines.
-->
<script lang="ts">
	import {
		BoundingBox,
		DraggableArea,
		StencilOverlay,
		StencilWrapper,
		getCropperContext,
		type MoveDirections,
		type ResizeAnchor,
		type ResizeOptions
	} from 'svelte-advanced-cropper';

	interface Props {
		/** The finished print's size, after trimming, in any unit (inches here). */
		width: number;
		height: number;
		/** How far the photo extends past the cut line on each side, to be trimmed off. */
		bleed: number;
		/** How far inside the cut line faces and text should stay. */
		safeMargin: number;
		/** Puzzle-piece lines inside the cut line. */
		columns?: number;
		rows?: number;
	}

	let { width, height, bleed, safeMargin, columns = 1, rows = 1 }: Props = $props();

	const context = getCropperContext();
	const cropper = context.cropper;
	const disabled = $derived(context.disabled);

	const state = $derived(cropper.getState());
	const coordinates = $derived(cropper.getStencilCoordinates());
	const transitions = $derived(cropper.getTransitions());

	// The crop covers the print plus its bleed, so the stencil has that shape. The cropper
	// reads the registered options whenever the product dimensions change.
	const fullWidth = $derived(width + 2 * bleed);
	const fullHeight = $derived(height + 2 * bleed);
	const stencilAspectRatio = $derived(fullWidth / fullHeight);
	context.registerStencil(() => ({ aspectRatio: stencilAspectRatio }));

	/** An inset from the crop's edges, as CSS percentages of its width and height. */
	function inset(distance: number) {
		return `${(distance / fullHeight) * 100}% ${(distance / fullWidth) * 100}%`;
	}

	const cutInset = $derived(inset(bleed));
	const safeInset = $derived(inset(bleed + safeMargin));

	function onMove(directions: MoveDirections) {
		if (!disabled) {
			cropper.moveCoordinates(directions);
		}
	}

	function onResize(anchor: ResizeAnchor, directions: MoveDirections, options: ResizeOptions) {
		if (!disabled) {
			cropper.resizeCoordinates(anchor, directions, options);
		}
	}
</script>

{#if state}
	<StencilWrapper class="print-stencil" {transitions} {...coordinates}>
		<BoundingBox
			{disabled}
			reference={state.coordinates}
			{onResize}
			onResizeEnd={cropper.resizeCoordinatesEnd}
		>
			<DraggableArea
				{disabled}
				class="print-stencil__draggable-area"
				{onMove}
				onMoveEnd={cropper.moveCoordinatesEnd}
			>
				<StencilOverlay class="print-stencil__overlay" />
				<div class="print-stencil__guides" aria-hidden="true">
					<div class="print-stencil__cut" style:inset={cutInset}>
						{#each { length: columns - 1 }, column (column)}
							<div
								class="print-stencil__piece-line print-stencil__piece-line--vertical"
								style:left="{((column + 1) / columns) * 100}%"
							></div>
						{/each}
						{#each { length: rows - 1 }, row (row)}
							<div
								class="print-stencil__piece-line print-stencil__piece-line--horizontal"
								style:top="{((row + 1) / rows) * 100}%"
							></div>
						{/each}
					</div>
					<div class="print-stencil__safe" style:inset={safeInset}></div>
				</div>
			</DraggableArea>
		</BoundingBox>
	</StencilWrapper>
{/if}

<style>
	:global(.print-stencil) {
		cursor: move;
	}
	/* Like the built-in stencils' parts, these fill the stencil. */
	:global(.print-stencil__draggable-area),
	:global(.print-stencil__overlay) {
		position: absolute;
		width: 100%;
		height: 100%;
	}
	:global(.print-stencil__overlay) {
		border: 1px solid rgba(255, 255, 255, 0.5);
		box-sizing: border-box;
	}
	.print-stencil__guides {
		position: absolute;
		inset: 0;
		overflow: hidden;
		pointer-events: none;
	}
	/* The bleed: everything outside the cut line is shaded. */
	.print-stencil__cut {
		position: absolute;
		border: 1px dashed #fdb022;
		box-shadow: 0 0 0 100vmax rgba(0, 0, 0, 0.35);
	}
	.print-stencil__safe {
		position: absolute;
		border: 1px dashed #61dafb;
	}
	/* White with a dark edge, so the lines show on light and dark photos alike. */
	.print-stencil__piece-line {
		position: absolute;
		background: rgba(255, 255, 255, 0.8);
		box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.25);
	}
	.print-stencil__piece-line--vertical {
		top: 0;
		bottom: 0;
		width: 1px;
	}
	.print-stencil__piece-line--horizontal {
		left: 0;
		right: 0;
		height: 1px;
	}
</style>

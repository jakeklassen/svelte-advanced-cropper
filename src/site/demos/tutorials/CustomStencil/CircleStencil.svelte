<script lang="ts">
	import { MoveDiagonal } from '@lucide/svelte';
	import {
		DraggableArea,
		getCropperContext,
		StencilOverlay,
		StencilWrapper,
		type MoveDirections
	} from 'svelte-advanced-cropper';

	import { BoundingBoxType } from 'advanced-cropper/extensions/fit-to-image';

	const context = getCropperContext();
	const cropper = context.cropper;
	context.registerStencil(() => ({ aspectRatio: 1, boundingBox: BoundingBoxType.Circle }));
	const disabled = $derived(context.disabled);
	const state = $derived(cropper.getState());

	const coordinates = $derived(cropper.getStencilCoordinates());
	const transitions = $derived(cropper.getTransitions());

	function resize(shift: MoveDirections) {
		// Only the horizontal shift is used, on both axes: the square stencil grows evenly.
		cropper.resizeCoordinates('center', {
			left: shift.left,
			top: shift.left
		});
	}
</script>

{#if state}
	<StencilWrapper class="circle-stencil" {transitions} {...coordinates}>
		<DraggableArea
			{disabled}
			class="circle-stencil__handler"
			onMove={resize}
			onMoveEnd={cropper.resizeCoordinatesEnd}
		>
			<MoveDiagonal color="white" size={22} />
		</DraggableArea>
		<DraggableArea
			{disabled}
			class="circle-stencil__draggable-area"
			onMove={(directions) => cropper.moveCoordinates(directions)}
			onMoveEnd={cropper.moveCoordinatesEnd}
		>
			<StencilOverlay class="circle-stencil__overlay" />
		</DraggableArea>
	</StencilWrapper>
{/if}

<style>
	:global(.circle-stencil) {
		cursor: move;
	}
	:global(.circle-stencil__handler) {
		position: absolute;
		right: 15%;
		top: 14%;
		z-index: 1;
		cursor: ne-resize;
		width: 30px;
		height: 30px;
		display: flex;
		align-items: center;
		justify-content: center;
		transform: translate(50%, -50%);
	}
	:global(.circle-stencil__overlay) {
		border: dashed 2px white;
		box-sizing: border-box;
		border-radius: 50%;
	}
	:global(.circle-stencil__draggable-area) {
		width: 100%;
		height: 100%;
	}
</style>

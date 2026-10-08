<script lang="ts">
	import { MoveDiagonal } from '@lucide/svelte';
	import {
		DraggableArea,
		DraggableElement,
		StencilOverlay,
		StencilWrapper,
		type CropperRef,
		type MoveDirections
	} from 'svelte-advanced-cropper';

	interface Props {
		cropper: CropperRef;
	}

	let { cropper }: Props = $props();

	const coordinates = $derived(cropper.getStencilCoordinates());
	const transitions = $derived(cropper.getTransitions());

	// Read by the cropper through `bind:this` and passed to `stencilConstraints`.
	export const aspectRatio = 1;

	function onResize(shift: MoveDirections) {
		cropper.resizeCoordinates('center', {
			left: shift.left,
			top: shift.left
		});
	}

	function onMove(directions: MoveDirections) {
		cropper.moveCoordinates(directions);
	}
</script>

<StencilWrapper class="circle-stencil" {transitions} {...coordinates}>
	<DraggableElement
		class="circle-stencil__handler"
		onMove={onResize}
		onMoveEnd={cropper.resizeCoordinatesEnd}
	>
		<MoveDiagonal color="white" size={22} />
	</DraggableElement>
	<DraggableArea
		class="circle-stencil__draggable-area"
		{onMove}
		onMoveEnd={cropper.moveCoordinatesEnd}
	>
		<StencilOverlay class="circle-stencil__overlay" />
	</DraggableArea>
</StencilWrapper>

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

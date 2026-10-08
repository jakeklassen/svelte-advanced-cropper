<script lang="ts" module>
	import type { ClassValue } from 'svelte/elements';
	import type {
		CardinalDirection,
		Coordinates,
		CropperInteractions,
		CropperState,
		CropperTransitions,
		MoveDirections,
		OrdinalDirection,
		ResizeAnchor
	} from 'advanced-cropper';
	import type {
		HandlerClassNames,
		HandlerComponent,
		LineClassNames,
		LineComponent
	} from '../service/BoundingBox.svelte';

	interface DesiredCropperRef {
		getState: () => CropperState | null;
		getTransitions: () => CropperTransitions;
		getInteractions: () => CropperInteractions;
		hasInteractions: () => boolean;
		resizeCoordinates: (
			anchor: ResizeAnchor,
			directions: Partial<MoveDirections>,
			parameters: unknown
		) => void;
		resizeCoordinatesEnd: () => void;
		moveCoordinates: (directions: Partial<MoveDirections>) => void;
		moveCoordinatesEnd: () => void;
	}

	export interface CircleStencilProps {
		cropper: DesiredCropperRef;
		coordinates?: Coordinates | ((state: CropperState | null) => Coordinates);
		handlerComponent?: HandlerComponent;
		handlers?: Partial<Record<OrdinalDirection, boolean>>;
		handlerClassNames?: HandlerClassNames;
		handlerWrapperClassNames?: HandlerClassNames;
		lines?: Partial<Record<CardinalDirection, boolean>>;
		lineComponent?: LineComponent;
		lineClassNames?: LineClassNames;
		lineWrapperClassNames?: LineClassNames;
		class?: ClassValue;
		movingClassName?: ClassValue;
		resizingClassName?: ClassValue;
		gridClassName?: ClassValue;
		previewClassName?: ClassValue;
		boundingBoxClassName?: ClassValue;
		overlayClassName?: ClassValue;
		draggableAreaClassName?: ClassValue;
		movable?: boolean;
		resizable?: boolean;
		grid?: boolean;
		disabled?: boolean;
	}
</script>

<script lang="ts">
	import {
		getStencilCoordinates,
		isFunction,
		type ResizeOptions
	} from 'advanced-cropper';
	import SimpleHandler from '../handlers/SimpleHandler.svelte';
	import SimpleLine from '../lines/SimpleLine.svelte';
	import BoundingBox from '../service/BoundingBox.svelte';
	import DraggableArea from '../service/DraggableElement.svelte';
	import StencilGrid from '../service/StencilGrid.svelte';
	import StencilOverlay from '../service/StencilOverlay.svelte';
	import StencilWrapper from '../service/StencilWrapper.svelte';

	let {
		cropper,
		coordinates,
		handlerComponent = SimpleHandler,
		handlers = {
			eastNorth: true,
			westNorth: true,
			westSouth: true,
			eastSouth: true
		},
		handlerClassNames = {},
		handlerWrapperClassNames = {},
		lines = {
			west: true,
			north: true,
			east: true,
			south: true
		},
		lineComponent = SimpleLine,
		lineClassNames = {},
		lineWrapperClassNames = {},
		resizable = true,
		movable = true,
		grid,
		gridClassName,
		class: className,
		movingClassName,
		resizingClassName,
		previewClassName,
		boundingBoxClassName,
		overlayClassName,
		draggableAreaClassName,
		disabled
	}: CircleStencilProps = $props();

	const state = $derived(cropper.getState());
	const transitions = $derived(cropper.getTransitions());
	const interactions = $derived(cropper.getInteractions());

	const resizeAllowed = $derived(resizable && !disabled);
	const moveAllowed = $derived(movable && !disabled);

	// Upstream exposes these through `useImperativeHandle`; the cropper reads them from
	// the stencil instance and feeds them to `stencilConstraints`.
	export const aspectRatio = 1;
	export const boundingBox = 'circle';

	const onMove = (directions: MoveDirections) => {
		if (cropper && moveAllowed) {
			cropper.moveCoordinates(directions);
		}
	};

	const onMoveEnd = () => {
		cropper?.moveCoordinatesEnd();
	};

	const onResize = (anchor: ResizeAnchor, directions: MoveDirections, options: ResizeOptions) => {
		if (cropper && resizeAllowed) {
			cropper.resizeCoordinates(anchor, directions, options);
		}
	};

	const onResizeEnd = () => {
		cropper?.resizeCoordinatesEnd();
	};

	const stencilCoordinates = $derived(
		coordinates
			? isFunction(coordinates)
				? coordinates(state)
				: coordinates
			: getStencilCoordinates(state)
	);
</script>

{#if state}
	<StencilWrapper
		class={[
			'advanced-cropper-circle-stencil',
			className,
			interactions.moveCoordinates && movingClassName,
			interactions.resizeCoordinates && resizingClassName,
			moveAllowed && 'advanced-cropper-circle-stencil--movable',
			interactions.moveCoordinates && 'advanced-cropper-circle-stencil--moving',
			resizeAllowed && 'advanced-cropper-circle-stencil--resizable',
			interactions.resizeCoordinates && 'advanced-cropper-circle-stencil--resizing',
			disabled && 'advanced-cropper-circle-stencil--disabled'
		]}
		width={stencilCoordinates.width}
		height={stencilCoordinates.height}
		left={stencilCoordinates.left}
		top={stencilCoordinates.top}
		{transitions}
	>
		<BoundingBox
			reference={state.coordinates}
			class={[boundingBoxClassName, 'advanced-cropper-circle-stencil__bounding-box']}
			{handlers}
			{handlerComponent}
			{handlerClassNames}
			{handlerWrapperClassNames}
			{lines}
			{lineComponent}
			{lineClassNames}
			{lineWrapperClassNames}
			{onResize}
			{onResizeEnd}
			disabled={!resizeAllowed}
		>
			<DraggableArea
				disabled={!moveAllowed}
				{onMove}
				{onMoveEnd}
				class={['advanced-cropper-circle-stencil__draggable-area', draggableAreaClassName]}
			>
				<StencilOverlay class={['advanced-cropper-circle-stencil__overlay', overlayClassName]}>
					{#if grid}
						<StencilGrid
							visible={cropper.hasInteractions()}
							columns={interactions.transformImage.rotate ? 9 : 3}
							rows={interactions.transformImage.rotate ? 9 : 3}
							class={['advanced-cropper-circle-stencil__grid', gridClassName]}
						/>
					{/if}
					<div class={['advanced-cropper-circle-stencil__preview', previewClassName]}></div>
				</StencilOverlay>
			</DraggableArea>
		</BoundingBox>
	</StencilWrapper>
{/if}

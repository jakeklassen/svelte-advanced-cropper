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
		RawAspectRatio,
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

	export interface RectangleStencilProps {
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
		minAspectRatio?: number;
		maxAspectRatio?: number;
		aspectRatio?: RawAspectRatio;
		movable?: boolean;
		resizable?: boolean;
		grid?: boolean;
		disabled?: boolean;
	}
</script>

<script lang="ts">
	import {
		createAspectRatio,
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
		aspectRatio,
		minAspectRatio,
		maxAspectRatio,
		handlerComponent = SimpleHandler,
		handlers = {
			eastNorth: true,
			north: true,
			westNorth: true,
			west: true,
			westSouth: true,
			south: true,
			eastSouth: true,
			east: true
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
	}: RectangleStencilProps = $props();

	const state = $derived(cropper.getState());
	const transitions = $derived(cropper.getTransitions());
	const interactions = $derived(cropper.getInteractions());

	const resizeAllowed = $derived(resizable && !disabled);
	const moveAllowed = $derived(movable && !disabled);

	// Upstream exposes this through `useImperativeHandle`; the cropper reads it from
	// the stencil instance and feeds it to `stencilConstraints`.
	const stencilAspectRatio = $derived(
		createAspectRatio(
			aspectRatio || {
				minimum: minAspectRatio,
				maximum: maxAspectRatio
			}
		)
	);
	export { stencilAspectRatio as aspectRatio };

	const onMove = (directions: MoveDirections) => {
		if (moveAllowed) {
			cropper.moveCoordinates(directions);
		}
	};

	const onResize = (anchor: ResizeAnchor, directions: MoveDirections, options: ResizeOptions) => {
		if (resizeAllowed) {
			cropper.resizeCoordinates(anchor, directions, options);
		}
	};

	const stencilCoordinates = $derived.by(() => {
		if (!coordinates) {
			return getStencilCoordinates(state);
		}

		return isFunction(coordinates) ? coordinates(state) : coordinates;
	});

	// A finer grid helps to line the image up while rotating it.
	const gridSize = $derived(interactions.transformImage.rotate ? 9 : 3);
</script>

{#if state}
	<StencilWrapper
		class={[
			'advanced-cropper-rectangle-stencil',
			className,
			interactions.moveCoordinates && movingClassName,
			interactions.resizeCoordinates && resizingClassName,
			moveAllowed && 'advanced-cropper-rectangle-stencil--movable',
			interactions.moveCoordinates && 'advanced-cropper-rectangle-stencil--moving',
			resizeAllowed && 'advanced-cropper-rectangle-stencil--resizable',
			interactions.resizeCoordinates && 'advanced-cropper-rectangle-stencil--resizing',
			disabled && 'advanced-cropper-rectangle-stencil--disabled'
		]}
		width={stencilCoordinates.width}
		height={stencilCoordinates.height}
		left={stencilCoordinates.left}
		top={stencilCoordinates.top}
		{transitions}
	>
		<BoundingBox
			reference={state.coordinates}
			class={[boundingBoxClassName, 'advanced-cropper-rectangle-stencil__bounding-box']}
			{handlers}
			{handlerComponent}
			{handlerClassNames}
			{handlerWrapperClassNames}
			{lines}
			{lineComponent}
			{lineClassNames}
			{lineWrapperClassNames}
			{onResize}
			onResizeEnd={cropper.resizeCoordinatesEnd}
			disabled={!resizeAllowed}
		>
			<DraggableArea
				disabled={!moveAllowed}
				{onMove}
				onMoveEnd={cropper.moveCoordinatesEnd}
				class={['advanced-cropper-rectangle-stencil__draggable-area', draggableAreaClassName]}
			>
				<StencilOverlay class={['advanced-cropper-rectangle-stencil__overlay', overlayClassName]}>
					{#if grid}
						<StencilGrid
							visible={cropper.hasInteractions()}
							columns={gridSize}
							rows={gridSize}
							class={['advanced-cropper-rectangle-stencil__grid', gridClassName]}
						/>
					{/if}
					<div class={['advanced-cropper-rectangle-stencil__preview', previewClassName]}></div>
				</StencilOverlay>
			</DraggableArea>
		</BoundingBox>
	</StencilWrapper>
{/if}

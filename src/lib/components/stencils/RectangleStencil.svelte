<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { ClassValue } from 'svelte/elements';
	import type {
		CardinalDirection,
		Coordinates,
		CropperState,
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

	export interface RectangleStencilProps {
		children?: Snippet;
		coordinates?: Coordinates | ((state: CropperState | null) => Coordinates);
		handlerComponent?: HandlerComponent;
		handlers?: boolean | Partial<Record<OrdinalDirection, boolean>>;
		handlerClassNames?: HandlerClassNames;
		handlerWrapperClassNames?: HandlerClassNames;
		lines?: boolean | Partial<Record<CardinalDirection, boolean>>;
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
	import { getCropperContext } from '../../context/cropper';
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
		children,
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
		class: cssClass,
		movingClassName,
		resizingClassName,
		previewClassName,
		boundingBoxClassName,
		overlayClassName,
		draggableAreaClassName,
		disabled: ownDisabled
	}: RectangleStencilProps = $props();

	const context = getCropperContext();
	const cropper = context.cropper;
	const disabled = $derived(context.disabled || ownDisabled);

	const state = $derived(cropper.getState());
	const transitions = $derived(cropper.getTransitions());
	const interactions = $derived(cropper.getInteractions());

	const resizeAllowed = $derived(resizable && !disabled);
	const moveAllowed = $derived(movable && !disabled);

	const stencilAspectRatio = $derived(
		createAspectRatio(
			aspectRatio || {
				minimum: minAspectRatio,
				maximum: maxAspectRatio
			}
		)
	);
	context.registerStencil(() => ({ aspectRatio: stencilAspectRatio }));

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
			cssClass,
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
				{@render children?.()}
			</DraggableArea>
		</BoundingBox>
	</StencilWrapper>
{/if}

<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { ClassValue } from 'svelte/elements';
	import type {
		CardinalDirection,
		Coordinates,
		CropperState,
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

	export interface CircleStencilProps {
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
		movable?: boolean;
		resizable?: boolean;
		grid?: boolean;
		disabled?: boolean;
	}
</script>

<script lang="ts">
	import { BoundingBoxType } from 'advanced-cropper/extensions/fit-to-image';
	import { getCropperContext } from '../../context/cropper';
	import { getStencilCoordinates, isFunction, type ResizeOptions } from 'advanced-cropper';
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
		class: cssClass,
		movingClassName,
		resizingClassName,
		previewClassName,
		boundingBoxClassName,
		overlayClassName,
		draggableAreaClassName,
		disabled: ownDisabled
	}: CircleStencilProps = $props();

	const context = getCropperContext();
	const cropper = context.cropper;
	const disabled = $derived(context.disabled || ownDisabled);

	const state = $derived(cropper.getState());
	const transitions = $derived(cropper.getTransitions());
	const interactions = $derived(cropper.getInteractions());

	const resizeAllowed = $derived(resizable && !disabled);
	const moveAllowed = $derived(movable && !disabled);

	context.registerStencil(() => ({ aspectRatio: 1, boundingBox: BoundingBoxType.Circle }));

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
			'advanced-cropper-circle-stencil',
			cssClass,
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
			onResizeEnd={cropper.resizeCoordinatesEnd}
			disabled={!resizeAllowed}
		>
			<DraggableArea
				disabled={!moveAllowed}
				{onMove}
				onMoveEnd={cropper.moveCoordinatesEnd}
				class={['advanced-cropper-circle-stencil__draggable-area', draggableAreaClassName]}
			>
				<StencilOverlay class={['advanced-cropper-circle-stencil__overlay', overlayClassName]}>
					{#if grid}
						<StencilGrid
							visible={cropper.hasInteractions()}
							columns={gridSize}
							rows={gridSize}
							class={['advanced-cropper-circle-stencil__grid', gridClassName]}
						/>
					{/if}
					<div class={['advanced-cropper-circle-stencil__preview', previewClassName]}></div>
				</StencilOverlay>
				{@render children?.()}
			</DraggableArea>
		</BoundingBox>
	</StencilWrapper>
{/if}

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
	import type { HandlerSnippetProps, LineSnippetProps } from '../../types';

	export interface RectangleStencilProps {
		children?: Snippet;
		coordinates?: Coordinates | ((state: CropperState | null) => Coordinates);
		handler?: Snippet<[HandlerSnippetProps]>;
		handlers?: boolean | Partial<Record<OrdinalDirection, boolean>>;
		lines?: boolean | Partial<Record<CardinalDirection, boolean>>;
		line?: Snippet<[LineSnippetProps]>;
		class?: ClassValue;
		style?: string;
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
	import BoundingBox from '../primitives/BoundingBox.svelte';
	import DraggableArea from '../gestures/DraggableArea.svelte';
	import StencilGrid from '../primitives/StencilGrid.svelte';
	import StencilOverlay from '../primitives/StencilOverlay.svelte';
	import StencilWrapper from '../primitives/StencilWrapper.svelte';

	let {
		children,
		coordinates,
		aspectRatio,
		minAspectRatio,
		maxAspectRatio,
		handler,
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
		lines = {
			west: true,
			north: true,
			east: true,
			south: true
		},
		line,
		resizable = true,
		movable = true,
		grid,
		class: cssClass,
		style,
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
		{style}
		class={[
			'advanced-cropper-rectangle-stencil',
			cssClass,
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
			class="advanced-cropper-rectangle-stencil__bounding-box"
			{handlers}
			{handler}
			{lines}
			{line}
			{onResize}
			onResizeEnd={cropper.resizeCoordinatesEnd}
			disabled={!resizeAllowed}
		>
			<DraggableArea
				disabled={!moveAllowed}
				{onMove}
				onMoveEnd={cropper.moveCoordinatesEnd}
				class="advanced-cropper-rectangle-stencil__draggable-area"
			>
				<StencilOverlay class="advanced-cropper-rectangle-stencil__overlay">
					{#if grid}
						<StencilGrid
							visible={cropper.hasInteractions()}
							columns={gridSize}
							rows={gridSize}
							class="advanced-cropper-rectangle-stencil__grid"
						/>
					{/if}
					<div class="advanced-cropper-rectangle-stencil__preview"></div>
				</StencilOverlay>
				{@render children?.()}
			</DraggableArea>
		</BoundingBox>
	</StencilWrapper>
{/if}

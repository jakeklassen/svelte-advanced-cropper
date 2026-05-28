<script lang="ts">
  import type { Component, Snippet } from 'svelte'
  import type { ClassValue } from 'svelte/elements'
  import {
    type CardinalDirection,
    type Coordinates,
    type CropperInteractions,
    type CropperState,
    type CropperTransitions,
    type MoveDirections,
    type OrdinalDirection,
    type ResizeAnchor,
    type ResizeOptions,
    getStencilCoordinates,
    isFunction,
  } from 'advanced-cropper'
  import BoundingBox from '../service/BoundingBox.svelte'
  import type { HandlerProps, LineProps } from '../service/BoundingBox.types.js'
  import { tryGetCropperContext } from '../../context.js'
  import DraggableElement from '../service/DraggableElement.svelte'
  import StencilGrid from '../service/StencilGrid.svelte'
  import StencilOverlay from '../service/StencilOverlay.svelte'
  import StencilWrapper from '../service/StencilWrapper.svelte'

  interface HandlerClassNames extends Partial<Record<OrdinalDirection, ClassValue>> {
    default?: ClassValue
    disabled?: ClassValue
    hover?: ClassValue
  }
  interface LineClassNames extends Partial<Record<CardinalDirection, ClassValue>> {
    default?: ClassValue
    disabled?: ClassValue
    hover?: ClassValue
  }

  interface DesiredCropperRef {
    getState: () => CropperState | null
    getTransitions: () => CropperTransitions
    getInteractions: () => CropperInteractions
    hasInteractions: () => boolean
    resizeCoordinates: (
      anchor: ResizeAnchor,
      directions: Partial<MoveDirections>,
      parameters: unknown,
    ) => void
    resizeCoordinatesEnd: () => void
    moveCoordinates: (directions: Partial<MoveDirections>) => void
    moveCoordinatesEnd: () => void
  }

  interface Props {
    /** The cropper accessor. Optional — if omitted, falls back to `getCropperContext()`. */
    cropper?: DesiredCropperRef
    coordinates?: Coordinates | ((state: CropperState | null) => Coordinates)
    handlerComponent?: Component<HandlerProps>
    handler?: Snippet<[HandlerProps]>
    handlers?: Partial<Record<OrdinalDirection, boolean>>
    handlerClassNames?: HandlerClassNames
    handlerWrapperClassNames?: HandlerClassNames
    lineComponent?: Component<LineProps>
    line?: Snippet<[LineProps]>
    lines?: Partial<Record<CardinalDirection, boolean>>
    lineClassNames?: LineClassNames
    lineWrapperClassNames?: LineClassNames
    class?: ClassValue
    movingClassName?: ClassValue
    resizingClassName?: ClassValue
    gridClassName?: ClassValue
    previewClassName?: ClassValue
    boundingBoxClassName?: ClassValue
    overlayClassName?: ClassValue
    draggableAreaClassName?: ClassValue
    movable?: boolean
    resizable?: boolean
    disabled?: boolean
    grid?: boolean
  }

  let {
    cropper: cropperProp,
    coordinates,
    handlerComponent,
    handler: handlerSnippet,
    handlers = { eastNorth: true, westNorth: true, westSouth: true, eastSouth: true },
    handlerClassNames,
    handlerWrapperClassNames,
    lineComponent,
    line: lineSnippet,
    lines = { west: true, north: true, east: true, south: true },
    lineClassNames,
    lineWrapperClassNames,
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
    disabled,
  }: Props = $props()

  const cropperFromCtx = tryGetCropperContext<DesiredCropperRef>()
  const cropper = $derived(cropperProp ?? cropperFromCtx?.())

  const cropperState = $derived(cropper?.getState() ?? null)
  const transitions = $derived(
    cropper?.getTransitions() ?? ({ active: false, duration: 0, timingFunction: 'ease' } as CropperTransitions),
  )
  const interactions = $derived(
    cropper?.getInteractions() ?? ({
      moveCoordinates: false,
      resizeCoordinates: false,
      transformImage: { rotate: false, move: false, scale: false },
    } as CropperInteractions),
  )
  const resizeAllowed = $derived(resizable && !disabled)
  const moveAllowed = $derived(movable && !disabled)

  /**
   * Circle stencil is always 1:1 aspect with a `circle` bounding-box shape.
   * AbstractCropper reads these via `bind:this` to feed `stencilConstraints`.
   */
  export function getAspectRatio() {
    return 1
  }
  export const boundingBox = 'circle' as const

  function onMove(directions: MoveDirections) {
    if (cropper && moveAllowed) cropper.moveCoordinates(directions)
  }
  function onMoveEnd() {
    if (cropper) cropper.moveCoordinatesEnd()
  }
  function onResize(anchor: ResizeAnchor, directions: MoveDirections, options: ResizeOptions) {
    if (cropper && resizeAllowed) cropper.resizeCoordinates(anchor, directions, options)
  }
  function onResizeEnd() {
    if (cropper) cropper.resizeCoordinatesEnd()
  }

  const stencilCoords = $derived(
    coordinates
      ? isFunction(coordinates)
        ? coordinates(cropperState)
        : coordinates
      : getStencilCoordinates(cropperState),
  )
</script>

{#if cropperState}
  <StencilWrapper
    class={[
      'advanced-cropper-circle-stencil',
      className,
      interactions.moveCoordinates && movingClassName,
      interactions.resizeCoordinates && resizingClassName,
      {
        'advanced-cropper-circle-stencil--movable': moveAllowed,
        'advanced-cropper-circle-stencil--moving': interactions.moveCoordinates,
        'advanced-cropper-circle-stencil--resizable': resizeAllowed,
        'advanced-cropper-circle-stencil--resizing': interactions.resizeCoordinates,
        'advanced-cropper-circle-stencil--disabled': disabled,
      },
    ]}
    width={stencilCoords.width}
    height={stencilCoords.height}
    left={stencilCoords.left}
    top={stencilCoords.top}
    {transitions}
  >
    <BoundingBox
      reference={cropperState.coordinates}
      class={[boundingBoxClassName, 'advanced-cropper-circle-stencil__bounding-box']}
      {handlers}
      {handlerComponent}
      handler={handlerSnippet}
      {handlerClassNames}
      {handlerWrapperClassNames}
      {lines}
      {lineComponent}
      line={lineSnippet}
      {lineClassNames}
      {lineWrapperClassNames}
      {onResize}
      {onResizeEnd}
      disabled={!resizeAllowed}
    >
      <DraggableElement
        disabled={!moveAllowed}
        {onMove}
        {onMoveEnd}
        class={['advanced-cropper-circle-stencil__draggable-area', draggableAreaClassName]}
      >
        <StencilOverlay
          class={['advanced-cropper-circle-stencil__overlay', overlayClassName]}
        >
          {#if grid}
            <StencilGrid
              visible={cropper?.hasInteractions() ?? false}
              columns={interactions.transformImage.rotate ? 9 : 3}
              rows={interactions.transformImage.rotate ? 9 : 3}
              class={['advanced-cropper-circle-stencil__grid', gridClassName]}
            />
          {/if}
          <div class={['advanced-cropper-circle-stencil__preview', previewClassName]}></div>
        </StencilOverlay>
      </DraggableElement>
    </BoundingBox>
  </StencilWrapper>
{/if}

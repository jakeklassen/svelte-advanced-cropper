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
    type RawAspectRatio,
    type ResizeAnchor,
    type ResizeOptions,
    createAspectRatio,
    getStencilCoordinates,
    isFunction,
  } from 'advanced-cropper'
  import BoundingBox from '../service/BoundingBox.svelte'
  import type { HandlerProps, LineProps } from '../service/BoundingBox.types.js'
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
    /** The cropper accessor — needs state, transitions, interactions, move/resize methods. (M5 migrates to context.) */
    cropper: DesiredCropperRef
    /** Override the stencil's coordinates (or a function of cropper state). When omitted, uses `getStencilCoordinates(state)`. */
    coordinates?: Coordinates | ((state: CropperState | null) => Coordinates)
    /** Component-prop override for resize handles. Defaults to SimpleHandler. */
    handlerComponent?: Component<HandlerProps>
    /** Snippet override for handles (preferred). Takes precedence over `handlerComponent`. */
    handler?: Snippet<[HandlerProps]>
    handlers?: Partial<Record<OrdinalDirection, boolean>>
    handlerClassNames?: HandlerClassNames
    handlerWrapperClassNames?: HandlerClassNames
    /** Component-prop override for edge lines. Defaults to SimpleLine. */
    lineComponent?: Component<LineProps>
    /** Snippet override for lines (preferred). Takes precedence over `lineComponent`. */
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
    minAspectRatio?: number
    maxAspectRatio?: number
    aspectRatio?: RawAspectRatio
    movable?: boolean
    resizable?: boolean
    grid?: boolean
    disabled?: boolean
  }

  let {
    cropper,
    coordinates,
    aspectRatio,
    minAspectRatio,
    maxAspectRatio,
    handlerComponent,
    handler: handlerSnippet,
    handlers,
    handlerClassNames,
    handlerWrapperClassNames,
    lineComponent,
    line: lineSnippet,
    lines,
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

  const cropperState = $derived(cropper.getState())
  const transitions = $derived(cropper.getTransitions())
  const interactions = $derived(cropper.getInteractions())
  const resizeAllowed = $derived(resizable && !disabled)
  const moveAllowed = $derived(movable && !disabled)

  /**
   * The stencil's computed aspect ratio constraint. AbstractCropper reads
   * this via `bind:this` to feed `stencilConstraints` into the engine.
   */
  export function getAspectRatio() {
    return createAspectRatio(
      aspectRatio ?? { minimum: minAspectRatio, maximum: maxAspectRatio },
    )
  }

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
      'advanced-cropper-rectangle-stencil',
      className,
      interactions.moveCoordinates && movingClassName,
      interactions.resizeCoordinates && resizingClassName,
      {
        'advanced-cropper-rectangle-stencil--movable': moveAllowed,
        'advanced-cropper-rectangle-stencil--moving': interactions.moveCoordinates,
        'advanced-cropper-rectangle-stencil--resizable': resizeAllowed,
        'advanced-cropper-rectangle-stencil--resizing': interactions.resizeCoordinates,
        'advanced-cropper-rectangle-stencil--disabled': disabled,
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
      class={[boundingBoxClassName, 'advanced-cropper-rectangle-stencil__bounding-box']}
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
        class={['advanced-cropper-rectangle-stencil__draggable-area', draggableAreaClassName]}
      >
        <StencilOverlay
          class={['advanced-cropper-rectangle-stencil__overlay', overlayClassName]}
        >
          {#if grid}
            <StencilGrid
              visible={cropper.hasInteractions()}
              columns={interactions.transformImage.rotate ? 9 : 3}
              rows={interactions.transformImage.rotate ? 9 : 3}
              class={['advanced-cropper-rectangle-stencil__grid', gridClassName]}
            />
          {/if}
          <div class={['advanced-cropper-rectangle-stencil__preview', previewClassName]}></div>
        </StencilOverlay>
      </DraggableElement>
    </BoundingBox>
  </StencilWrapper>
{/if}

<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { ClassValue } from 'svelte/elements'
  import {
    getDirectionNames,
    type HorizontalCardinalDirection,
    type MoveDirections,
    type VerticalCardinalDirection,
  } from 'advanced-cropper'
  import DraggableElement from './DraggableElement.svelte'

  interface Props {
    class?: ClassValue
    /** Inline style on the root. `BoundingBox` uses this to set `top`/`left` per handle position. */
    style?: string
    children?: Snippet
    /** Fired on every pixel-step of a drag with cumulative delta since the last call. */
    onDrag?: (shift: MoveDirections, event: MouseEvent | TouchEvent) => void
    /** Fired once when the user releases the drag. */
    onDragEnd?: () => void
    onLeave?: () => void
    onEnter?: () => void
    /** When true, drag is ignored and the cursor reverts to default. */
    disabled?: boolean
    /** `'east'` or `'west'` for east/west and corner handles. Omit for a vertical edge midpoint. */
    horizontalPosition?: HorizontalCardinalDirection
    /** `'north'` or `'south'` for top/bottom and corner handles. Omit for a horizontal edge midpoint. */
    verticalPosition?: VerticalCardinalDirection
  }

  let {
    horizontalPosition,
    verticalPosition,
    class: className,
    disabled,
    onDrag,
    onDragEnd,
    onLeave,
    onEnter,
    children,
    style,
  }: Props = $props()

  const position = $derived(
    horizontalPosition || verticalPosition
      ? getDirectionNames(horizontalPosition, verticalPosition).snakeCase
      : null,
  )
</script>

<div
  {style}
  class={[
    className,
    'advanced-cropper-handler-wrapper',
    position && `advanced-cropper-handler-wrapper--${position}`,
    disabled && 'advanced-cropper-handler-wrapper--disabled',
  ]}
>
  <DraggableElement
    class="advanced-cropper-handler-wrapper__draggable"
    {disabled}
    onMove={onDrag}
    onMoveEnd={onDragEnd}
    {onLeave}
    {onEnter}
    activationDistance={0}
  >
    {@render children?.()}
  </DraggableElement>
</div>

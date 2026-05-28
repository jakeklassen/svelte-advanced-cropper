<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { ClassValue } from 'svelte/elements'
  import type {
    HorizontalCardinalDirection,
    MoveDirections,
    VerticalCardinalDirection,
  } from 'advanced-cropper'
  import DraggableElement from './DraggableElement.svelte'

  interface Props {
    class?: ClassValue
    children?: Snippet
    /** Fired on every pixel-step of a drag with cumulative delta since the last call. */
    onDrag?: (directions: MoveDirections, event: MouseEvent | TouchEvent) => void
    /** Fired once when the user releases the drag. */
    onDragEnd?: () => void
    onLeave?: () => void
    onEnter?: () => void
    /** When true, drag is ignored and the cursor reverts to default. */
    disabled?: boolean
    /** Which stencil edge this line represents: `'north'`/`'south'` (top/bottom) or `'east'`/`'west'` (left/right). Determines sizing axis and cursor. */
    position?: HorizontalCardinalDirection | VerticalCardinalDirection
  }

  let {
    position,
    class: className,
    disabled,
    onDrag,
    onDragEnd,
    onLeave,
    onEnter,
    children,
  }: Props = $props()
</script>

<DraggableElement
  class={[
    'advanced-cropper-line-wrapper',
    position && `advanced-cropper-line-wrapper--${position}`,
    disabled && 'advanced-cropper-line-wrapper--disabled',
    className,
  ]}
  {disabled}
  onMove={onDrag}
  onMoveEnd={onDragEnd}
  {onLeave}
  {onEnter}
  activationDistance={0}
>
  <div
    class={[
      'advanced-cropper-line-wrapper__content',
      position && `advanced-cropper-line-wrapper__content--${position}`,
    ]}
  >
    {@render children?.()}
  </div>
</DraggableElement>

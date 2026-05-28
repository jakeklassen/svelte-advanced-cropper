<script lang="ts">
  import type { ClassValue } from 'svelte/elements'
  import type {
    HorizontalCardinalDirection,
    MoveDirections,
    VerticalCardinalDirection,
  } from 'advanced-cropper'
  import HandlerWrapper from '../service/HandlerWrapper.svelte'

  interface Props {
    /** Class on the inner handle dot (always applied). Use for color/size tweaks without writing a custom component. */
    defaultClassName?: ClassValue
    /** Extra class on the inner dot while hovered. */
    hoverClassName?: ClassValue
    /** Class on the outer `HandlerWrapper`. */
    wrapperClassName?: ClassValue
    /** Inline style on the outer `HandlerWrapper`. `BoundingBox` uses this to set `top`/`left` per position. */
    wrapperStyle?: string
    /** `'north'` or `'south'` for corner / edge handles. Omit for a horizontal edge midpoint. */
    verticalPosition?: VerticalCardinalDirection
    /** `'east'` or `'west'` for corner / edge handles. Omit for a vertical edge midpoint. */
    horizontalPosition?: HorizontalCardinalDirection
    /** When true, drag is ignored and the cursor reverts to default. */
    disabled?: boolean
    /** Fired on every pixel-step of a drag with cumulative delta since the last call. */
    onMove?: (shift: MoveDirections, event: MouseEvent | TouchEvent) => void
    /** Fired once when the user releases the drag. */
    onMoveEnd?: () => void
  }

  let {
    verticalPosition,
    horizontalPosition,
    hoverClassName,
    wrapperClassName,
    defaultClassName,
    wrapperStyle,
    disabled,
    onMove,
    onMoveEnd,
  }: Props = $props()

  let hover = $state(false)
</script>

<HandlerWrapper
  style={wrapperStyle}
  class={[
    'advanced-cropper-simple-handler-wrapper',
    wrapperClassName,
    verticalPosition && `advanced-cropper-simple-handler-wrapper--${verticalPosition}`,
    horizontalPosition && `advanced-cropper-simple-handler-wrapper--${horizontalPosition}`,
    horizontalPosition &&
      verticalPosition &&
      `advanced-cropper-simple-handler-wrapper--${horizontalPosition}-${verticalPosition}`,
    hover && 'advanced-cropper-simple-handler-wrapper--hover',
  ]}
  {verticalPosition}
  {horizontalPosition}
  {disabled}
  onDrag={onMove}
  onDragEnd={onMoveEnd}
  onLeave={() => (hover = false)}
  onEnter={() => (hover = true)}
>
  <div
    class={[
      'advanced-cropper-simple-handler',
      hover && 'advanced-cropper-simple-handler--hover',
      defaultClassName,
      hover && hoverClassName,
      {
        [`advanced-cropper-simple-handler--${verticalPosition}`]: !!verticalPosition,
        [`advanced-cropper-simple-handler--${horizontalPosition}`]: !!horizontalPosition,
        [`advanced-cropper-simple-handler--${horizontalPosition}-${verticalPosition}`]:
          !!(horizontalPosition && verticalPosition),
      },
    ]}
  ></div>
</HandlerWrapper>

<script lang="ts">
  import type { ClassValue } from 'svelte/elements'
  import type { CardinalDirection, MoveDirections } from 'advanced-cropper'
  import LineWrapper from '../service/LineWrapper.svelte'

  interface Props {
    /** Class on the inner line element (always applied). Use for color/border tweaks without writing a custom component. */
    defaultClassName?: ClassValue
    /** Extra class on the inner line while hovered. */
    hoverClassName?: ClassValue
    /** Class on the outer `LineWrapper`. */
    wrapperClassName?: ClassValue
    /** Which stencil edge this line represents: `'north'`/`'south'` (top/bottom) or `'east'`/`'west'` (left/right). */
    position?: CardinalDirection
    /** When true, drag is ignored and the cursor reverts to default. */
    disabled?: boolean
    /** Fired on every pixel-step of a drag with cumulative delta since the last call. */
    onMove?: (directions: MoveDirections, event: MouseEvent | TouchEvent) => void
    /** Fired once when the user releases the drag. */
    onMoveEnd?: () => void
  }

  let {
    position,
    hoverClassName,
    wrapperClassName,
    defaultClassName,
    disabled,
    onMove,
    onMoveEnd,
  }: Props = $props()

  let hover = $state(false)
</script>

<LineWrapper
  class={[
    'advanced-cropper-simple-line-wrapper',
    wrapperClassName,
    { [`advanced-cropper-simple-line-wrapper--${position}`]: !!position },
  ]}
  {position}
  {disabled}
  onDrag={onMove}
  onDragEnd={onMoveEnd}
  onLeave={() => (hover = false)}
  onEnter={() => (hover = true)}
>
  <div
    class={[
      'advanced-cropper-simple-line',
      hover && 'advanced-cropper-simple-line--hover',
      defaultClassName,
      hover && hoverClassName,
      { [`advanced-cropper-simple-line--${position}`]: !!position },
    ]}
  ></div>
</LineWrapper>

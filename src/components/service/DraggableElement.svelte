<!--
  M1 stub. Real gesture impl lands in M3 (#3).
  Accepts the same prop shape as the React DraggableElement so dependents
  (HandlerWrapper, LineWrapper) compile and render correctly without changes
  when M3 replaces this file.
-->
<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { ClassValue } from 'svelte/elements'
  import type { MoveDirections } from 'advanced-cropper'

  interface Props {
    class?: ClassValue
    children?: Snippet
    /** When true, drag and hover callbacks are ignored. */
    disabled?: boolean
    /** Fired on every pixel-step of a drag with cumulative delta since the last call. */
    onMove?: (directions: MoveDirections, event: MouseEvent | TouchEvent) => void
    /** Fired once when the user releases the drag. */
    onMoveEnd?: () => void
    /** Fired once when a drag begins (after `activationDistance` is exceeded). */
    onMoveStart?: () => void
    onLeave?: () => void
    onEnter?: () => void
    /**
     * When true (default), the drag is anchored to its starting touch point;
     * moves toward the anchor are dampened. Disable for raw delta tracking.
     */
    useAnchor?: boolean
    /** Pixels of movement required before a drag is recognized (touch deadband). Defaults to 30. */
    activationDistance?: number
  }

  let { class: className, children }: Props = $props()
</script>

<div class={['advanced-cropper-draggable-element', className]}>
  {@render children?.()}
</div>

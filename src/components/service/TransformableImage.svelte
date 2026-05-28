<!--
  M2 stub. Real gesture impl lands in M3 (#3).
  Accepts the same prop shape as the React TransformableImage so dependents
  (CropperBackgroundWrapper) compile and render correctly without changes
  when M3 replaces this file.
-->
<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { ClassValue } from 'svelte/elements'
  import type { ImageTransform } from 'advanced-cropper'

  interface Props {
    class?: ClassValue
    style?: string
    children?: Snippet
    /** Fired continuously during a pinch/wheel/drag with the resolved image transform. */
    onTransform?: (transform: ImageTransform) => void
    /** Fired once when the gesture ends (debounced by `timeout` for wheel). */
    onTransformEnd?: () => void
    /** Per-event hook for granular control + `preventDefault()`. Bypasses the default preventDefault. */
    onEvent?: (e: { active: boolean; defaultPrevented: boolean; preventDefault: () => void }, nativeEvent: Event) => unknown
    /** When true, all gestures are no-ops. */
    disabled?: boolean
    /** Drag-to-move on touch. Default true. */
    touchMove?: boolean
    /** Drag-to-move on mouse. Default true. */
    mouseMove?: boolean
    /** Pinch-to-scale on touch. Default true. */
    touchScale?: boolean
    /** Two-finger rotate on touch. Default false. */
    touchRotate?: boolean
    /** Wheel-to-scale, optionally with a custom step ratio. Default true. */
    wheelScale?: boolean | { ratio: number }
    /** Debounce for `onTransformEnd` after wheel events, in ms. Default 500. */
    timeout?: number
    /** Whether to call preventDefault on the native event. Default true. */
    preventDefault?: boolean
  }

  let { class: className, style, children }: Props = $props()
</script>

<div class={className} {style}>
  {@render children?.()}
</div>

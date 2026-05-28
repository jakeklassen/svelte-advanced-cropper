<!--
  M1 stub. Real animated transitions land in M6 (#6).
  Positions a sized rectangle via inline transform/width/height with no
  animation. StencilWrapper depends on this; the visual smoke test is
  "the stencil rectangle appears at the right place and size."
-->
<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { ClassValue } from 'svelte/elements'
  import type { CropperTransitions } from 'advanced-cropper'

  interface Props {
    class?: ClassValue
    children?: Snippet
    /** Cropper transitions descriptor (duration, easing, active flag). When `active`, the values are interpolated frame-by-frame; otherwise applied instantly. */
    transitions?: CropperTransitions
    /** Target width in pixels. */
    width?: number
    /** Target height in pixels. */
    height?: number
    /** Target x offset in pixels (applied via `translate3d`). */
    left?: number
    /** Target y offset in pixels (applied via `translate3d`). */
    top?: number
  }

  let { class: className, children, width, height, left, top }: Props = $props()

  const rootStyle = $derived(
    `left:0;top:0;width:${width}px;height:${height}px;transform:translate3d(${left}px,${top}px,0)`,
  )
</script>

<div class={['advanced-cropper-artificial-transition', className]} style={rootStyle}>
  {@render children?.()}
</div>

<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { ClassValue } from 'svelte/elements'
  import type { CropperTransitions } from 'advanced-cropper'
  import ArtificialTransition from './ArtificialTransition.svelte'

  interface Props {
    children?: Snippet
    class?: ClassValue
    /** Cropper transitions descriptor (duration, easing, active flag). Passed through to `ArtificialTransition` to drive the interpolation. */
    transitions?: CropperTransitions
    /** Stencil width in pixels (boundary-space). */
    width?: number
    /** Stencil height in pixels (boundary-space). */
    height?: number
    /** Stencil x offset from the boundary's left edge, in pixels. */
    left: number
    /** Stencil y offset from the boundary's top edge, in pixels. */
    top: number
  }

  let {
    class: className,
    transitions,
    width,
    height,
    left,
    top,
    children,
  }: Props = $props()
</script>

<ArtificialTransition
  class={['advanced-cropper-stencil-wrapper', className]}
  {transitions}
  {width}
  {height}
  {top}
  {left}
>
  {@render children?.()}
</ArtificialTransition>

<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { ClassValue } from 'svelte/elements'
  import {
    type BoundarySizeAlgorithm,
    type BoundaryStretchAlgorithm,
    type Size,
    fillBoundary,
    stretchCropperBoundary,
  } from 'advanced-cropper'

  interface Props {
    class?: ClassValue
    style?: string
    stretcherClassName?: ClassValue
    contentClassName?: ClassValue
    /** Algorithm that sets the stretcher's width/height from the image size. Default: engine's `stretchCropperBoundary`. */
    stretchAlgorithm?: BoundaryStretchAlgorithm
    /** Algorithm that derives the final boundary size from the stretched container. Default: engine's `fillBoundary`. */
    sizeAlgorithm?: BoundarySizeAlgorithm
    children?: Snippet
  }

  let {
    class: className,
    style,
    stretcherClassName,
    contentClassName,
    stretchAlgorithm = stretchCropperBoundary,
    sizeAlgorithm = fillBoundary,
    children,
  }: Props = $props()

  let boundaryEl: HTMLDivElement | undefined = $state()
  let stretcherEl: HTMLDivElement | undefined = $state()

  /**
   * Clear the stretcher's inline width/height so it returns to natural sizing.
   * Called by M5's resetCropper sequence when the image is cleared.
   */
  export function reset(): void {
    if (stretcherEl) {
      stretcherEl.style.height = ''
      stretcherEl.style.width = ''
    }
  }

  /**
   * Stretch the boundary to fit `size` (typically the image's natural dimensions),
   * then measure and return the resulting boundary size that the cropper engine
   * should use. Resolves to `null` when `size` is falsy or the stretched output
   * has zero dimension on either axis.
   *
   * Returns a Promise to match the React API; resolution is synchronous in this
   * implementation but the contract stays Promise-based so callers don't need
   * to change when the algorithm ever becomes async.
   */
  export function stretchTo(size: Size | null): Promise<Size | null> {
    if (size?.width && size?.height && stretcherEl && boundaryEl) {
      stretchAlgorithm(boundaryEl, stretcherEl, size)
      const result = sizeAlgorithm(boundaryEl, size)
      return Promise.resolve(result.width && result.height ? result : null)
    }
    if (stretcherEl) {
      stretcherEl.style.height = ''
      stretcherEl.style.width = ''
    }
    return Promise.resolve(null)
  }
</script>

<div bind:this={boundaryEl} {style} class={['advanced-cropper-boundary', className]}>
  <div
    bind:this={stretcherEl}
    class={['advanced-cropper-boundary__stretcher', stretcherClassName]}
  ></div>
  <div class={['advanced-cropper-boundary__content', contentClassName]}>
    {@render children?.()}
  </div>
</div>

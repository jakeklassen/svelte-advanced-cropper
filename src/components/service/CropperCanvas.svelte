<script lang="ts">
  import {
    type CropperState,
    type DrawOptions,
    drawCroppedArea,
  } from 'advanced-cropper'

  // No public props yet — CropperCanvas exposes its work via the imperative
  // `draw()` method (see below). Consumers use `bind:this={canvas}` and call
  // `canvas.draw(state, image, options)` when they want the cropped output.

  let canvasEl: HTMLCanvasElement | undefined = $state()
  let spareCanvasEl: HTMLCanvasElement | undefined = $state()

  /**
   * Render the cropped region of `image` according to `state` into the
   * internal canvas and return it. The returned HTMLCanvasElement is the
   * same DOM node on every call (off-screen, `display: none`); consumers
   * typically convert it to a Blob / data URL.
   *
   * Returns null if the canvases haven't mounted yet.
   */
  export function draw(
    state: CropperState,
    image: HTMLElement,
    options: DrawOptions = {},
  ): HTMLCanvasElement | null {
    if (image && canvasEl && spareCanvasEl) {
      return drawCroppedArea(
        state,
        image as HTMLImageElement | HTMLCanvasElement,
        canvasEl,
        spareCanvasEl,
        options,
      )
    }
    return null
  }
</script>

<canvas class="advanced-cropper-canvas" bind:this={canvasEl}></canvas>
<canvas class="advanced-cropper-canvas" bind:this={spareCanvasEl}></canvas>

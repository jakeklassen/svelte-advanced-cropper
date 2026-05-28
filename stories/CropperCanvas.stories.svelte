<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf'
  import CropperCanvas from '../src/components/service/CropperCanvas.svelte'

  const { Story } = defineMeta({
    title: 'Boundary/CropperCanvas',
    component: CropperCanvas,
    tags: ['autodocs'],
    parameters: {
      docs: {
        description: {
          component: `
The cropper's **off-screen rendering surface** — two \`<canvas>\` elements (\`display: none\`) used by the engine's \`drawCroppedArea\` to composite the cropped output. The primary canvas holds the final pixels; the spare canvas is for intermediate work (rotation, flips, scaling).

Exposes \`draw(state, image, options): HTMLCanvasElement | null\` via a Svelte 5 instance export. Consumers (M5's \`AbstractCropper.getCanvas()\`) call \`canvas.draw(state, bgImageEl)\` after the user clicks "Crop" and receive the canvas to convert to a Blob / data URL.

\`<Cropper>\` includes this by default; pass \`canvas={false}\` to skip it if you only need the boundary visualization and will render output elsewhere.
`,
        },
      },
    },
  })

  import { createState, type CropperImage } from 'advanced-cropper'
</script>

<script lang="ts">
  let canvas: ReturnType<typeof CropperCanvas> | undefined = $state(undefined)
  let imgEl: HTMLImageElement | undefined = $state(undefined)
  let resultDataUrl = $state<string | null>(null)
  let resultMessage = $state<string>('Load the image, then click "Crop".')

  function doDraw() {
    if (!canvas || !imgEl || !imgEl.complete) {
      resultMessage = 'Image not loaded yet — wait a moment.'
      return
    }
    // Build a minimal engine state from the loaded image. createState gives
    // us a real CropperState with sensible defaults.
    const image: CropperImage = {
      src: imgEl.src,
      width: imgEl.naturalWidth,
      height: imgEl.naturalHeight,
      transforms: { rotate: 0, flip: { horizontal: false, vertical: false } },
      arrayBuffer: null,
    }
    const state = createState(
      { boundary: { width: 400, height: 300 }, image },
      {
        imageRestriction: 'none' as any,
        defaultCoordinates: () => ({
          left: image.width * 0.25,
          top: image.height * 0.25,
          width: image.width * 0.5,
          height: image.height * 0.5,
        }),
        defaultVisibleArea: () => ({
          left: 0,
          top: 0,
          width: image.width,
          height: image.height,
        }),
      } as any,
    )
    // @ts-expect-error - method exposed via bind:this
    const out = canvas.draw(state, imgEl)
    if (out) {
      resultDataUrl = out.toDataURL('image/png')
      resultMessage = `→ HTMLCanvasElement returned (${out.width}×${out.height})`
    } else {
      resultDataUrl = null
      resultMessage = '→ draw() returned null (canvas refs not ready)'
    }
  }
</script>

<Story name="Interactive: draw() the center 50% of an image">
  <div style="font-family:sans-serif">
    <p style="color:#666;margin:0 0 1em">
      The two <code>&lt;canvas&gt;</code> elements below are <code>display: none</code> — they're
      the off-screen surfaces <code>draw()</code> renders into. Click "Crop" to render the center
      50% of the source image and view the data URL below.
    </p>
    <div style="display:flex;gap:1em;align-items:flex-start;margin-bottom:1em">
      <img
        bind:this={imgEl}
        src="https://picsum.photos/seed/canvas-draw/640/480"
        alt="source"
        crossorigin="anonymous"
        style="width:240px;height:180px;object-fit:cover;border:1px solid #ccc"
      />
      <div>
        <button onclick={doDraw}>Crop (call draw())</button>
        <p style="margin:0.5em 0 0;color:#666">{resultMessage}</p>
      </div>
    </div>
    <CropperCanvas bind:this={canvas} />
    {#if resultDataUrl}
      <div style="margin-top:1em">
        <p style="margin:0 0 0.5em;color:#666">Cropped result:</p>
        <img src={resultDataUrl} alt="cropped" style="max-width:240px;border:1px solid #ccc" />
      </div>
    {/if}
  </div>
</Story>

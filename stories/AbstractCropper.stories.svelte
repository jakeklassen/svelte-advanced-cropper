<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf'
  import AbstractCropper from '../src/components/AbstractCropper.svelte'
  import type { AbstractCropperRef } from '../src/components/AbstractCropper.types.js'
  import CircleStencil from '../src/components/stencils/CircleStencil.svelte'

  const { Story } = defineMeta({
    title: 'Cropper/AbstractCropper',
    component: AbstractCropper,
    tags: ['autodocs'],
    parameters: {
      docs: {
        description: {
          component: `
The **end-to-end cropper composer** — the M5 milestone. Wires the engine instance (\`CropperInstance\`), the image loader (\`CropperImageLoader\`), the boundary/canvas/background refs, and publishes the cropper instance to descendants via \`setCropperContext\` so the M1–M4 components can read engine state without explicit prop drilling.

This is the first **actually-working cropper** in the port: drag the stencil to move/resize, drag the background image to pan, scroll-wheel to zoom, then call \`cropperRef.getCanvas()\` to grab the cropped output.

The 8 React workaround hooks (\`useForceRerender\`, \`usePersistentFunction\`, \`useStateWithCallback\`, \`useFirstMountState\`, \`useUpdateEffect\`, \`useDeprecationWarning\`, \`useAbstractCropperProps\`, plus the option-normalizers) are all gone — replaced by \`$state.raw\` on the engine data field, \`$effect\`, and \`$derived(getOptions(...))\` inline.
`,
        },
      },
    },
  })
</script>

<script lang="ts">
  let cropperRef = $state<AbstractCropperRef | undefined>(undefined)
  let outputUrl = $state<string | null>(null)
  let status = $state<string>('Image will load below — drag the stencil and the image to interact.')

  function exportCanvas() {
    if (!cropperRef) return
    const canvas = cropperRef.getCanvas()
    if (canvas) {
      outputUrl = canvas.toDataURL('image/png')
      status = `→ HTMLCanvasElement ${canvas.width}×${canvas.height}`
    } else {
      outputUrl = null
      status = '→ getCanvas() returned null (image not loaded yet?)'
    }
  }

  function reset() {
    cropperRef?.reset()
    status = '(reset)'
  }
</script>

<Story name="Interactive: drag, zoom, get canvas">
  <div style="font-family:sans-serif">
    <div style="display:flex;gap:1em;margin-bottom:1em">
      <button onclick={exportCanvas}>Get canvas (call getCanvas())</button>
      <button onclick={reset}>Reset</button>
      <p style="margin:0;color:#666;align-self:center">{status}</p>
    </div>
    <div style="display:flex;gap:1em;align-items:flex-start">
      <div style="width:480px;height:320px;background:#222">
        <AbstractCropper
          bind:this={cropperRef}
          src="https://picsum.photos/seed/abscropper/1200/800"
          style="height:100%"
          onReady={() => (status = 'Ready. Drag the stencil or the image; scroll to zoom.')}
          onError={() => (status = 'Error loading image.')}
        />
      </div>
      {#if outputUrl}
        <div>
          <p style="margin:0 0 0.5em;color:#666">Cropped output:</p>
          <img src={outputUrl} alt="cropped" style="max-width:200px;border:1px solid #ccc" />
        </div>
      {/if}
    </div>
  </div>
</Story>

<Story name="With CircleStencil">
  <div style="width:480px;height:320px;background:#222">
    <AbstractCropper
      src="https://picsum.photos/seed/abscircle/1200/800"
      stencilComponent={CircleStencil}
      style="height:100%"
    />
  </div>
</Story>

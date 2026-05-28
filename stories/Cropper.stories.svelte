<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf'
  import Cropper from '../src/components/croppers/Cropper.svelte'
  import type { CropperRef } from '../src/components/croppers/Cropper.types.js'

  const { Story } = defineMeta({
    title: 'Cropper/Cropper',
    component: Cropper,
    tags: ['autodocs'],
    parameters: {
      docs: {
        description: {
          component: `
The **public consumer component**. Thin wrapper over \`AbstractCropper\` that:

- Handles the React-port's deprecated \`stencilSize\` prop by redirecting to \`<FixedCropper>\` with a one-time console warning.
- Handles the deprecated \`autoZoom\` prop by injecting \`hybridStencilAutoZoom\` into \`parameters.postProcess\` (unless the consumer already supplied one).

Otherwise, identical surface to \`AbstractCropper\`. Most consumers should reach for this first.
`,
        },
      },
    },
  })
</script>

<script lang="ts">
  let cropperRef = $state<CropperRef | undefined>(undefined)
  let outputUrl = $state<string | null>(null)

  function exportCanvas() {
    const canvas = cropperRef?.getCanvas()
    if (canvas) outputUrl = canvas.toDataURL('image/png')
  }
</script>

<Story name="Default">
  <div style="font-family:sans-serif">
    <div style="display:flex;gap:1em;margin-bottom:1em">
      <button onclick={exportCanvas}>Get canvas</button>
    </div>
    <div style="display:flex;gap:1em;align-items:flex-start">
      <div style="width:480px;height:320px;background:#222">
        <Cropper
          bind:this={cropperRef as any}
          src="https://picsum.photos/seed/cropper-public/1200/800"
          style="height:100%"
        />
      </div>
      {#if outputUrl}
        <img src={outputUrl} alt="cropped" style="max-width:200px;border:1px solid #ccc" />
      {/if}
    </div>
  </div>
</Story>

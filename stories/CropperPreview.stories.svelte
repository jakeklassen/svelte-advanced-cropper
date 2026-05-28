<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf'
  import CropperPreview from '../src/components/helpers/CropperPreview.svelte'
  import Cropper from '../src/components/croppers/Cropper.svelte'
  import type { CropperRef } from '../src/components/croppers/Cropper.types.js'

  const { Story } = defineMeta({
    title: 'Cropper/CropperPreview',
    component: CropperPreview,
    tags: ['autodocs'],
    parameters: {
      docs: {
        description: {
          component: `
A **mirror view** of the cropped output at an arbitrary preview size. Two ways to wire it up:

1. Pass a live cropper via the \`cropper\` prop — the preview tracks the cropper's state in real time.
2. Or pass static \`cropperState\` / \`image\` / \`transitions\` props — useful for thumbnail previews of a cropped result.

Exposes \`refresh()\` and \`update(cropper)\` for imperative control.
`,
        },
      },
    },
  })
</script>

<script lang="ts">
  let cropperRef = $state<CropperRef | undefined>(undefined)
  let previewRef = $state<CropperPreview | undefined>(undefined)

  // Refresh the preview whenever the cropper publishes an update.
  function onUpdate() {
    previewRef?.refresh()
  }
</script>

<Story name="Live preview tracking a Cropper">
  <div style="font-family:sans-serif;display:flex;gap:1.5em;align-items:flex-start">
    <div>
      <p style="margin:0 0 0.5em;color:#666">Live cropper</p>
      <div style="width:400px;height:300px;background:#222">
        <Cropper
          bind:this={cropperRef as any}
          src="https://picsum.photos/seed/preview-live/1200/800"
          {onUpdate}
          style="height:100%"
        />
      </div>
    </div>
    <div>
      <p style="margin:0 0 0.5em;color:#666">160x120 preview</p>
      <div style="width:160px;height:120px;background:#333">
        <CropperPreview
          bind:this={previewRef as any}
          cropper={cropperRef as any}
          style="height:100%"
        />
      </div>
      <p style="margin:0.5em 0 0;color:#666">Drag the cropper — preview updates live.</p>
    </div>
  </div>
</Story>

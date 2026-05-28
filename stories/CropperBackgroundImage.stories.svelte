<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf'
  import CropperBackgroundImage from '../src/components/service/CropperBackgroundImage.svelte'

  const { Story } = defineMeta({
    title: 'Boundary/CropperBackgroundImage',
    component: CropperBackgroundImage,
    tags: ['autodocs'],
    parameters: {
      docs: {
        description: {
          component: `
The actual \`<img>\` displayed inside the cropper boundary. Applies the engine's computed \`transform\`, \`width\`, \`height\` and (during transitions) \`transition\` CSS so the image positions, scales, and rotates as the user manipulates the stencil.

Uses \`{#key src}\` to force a full remount when the source URL changes (important for cleaning up browser image-decoding state). Exposes \`getElement()\` so M5's \`CropperCanvas.draw()\` can pass the live \`<img>\` to the engine's \`drawCroppedArea\` for cropped output.

Override by passing a custom \`backgroundComponent\` to \`<Cropper>\` — useful for swapping in \`<video>\` or a \`<canvas>\`-painted source.
`,
        },
      },
    },
  })

  // Real-but-minimal fake cropper. With `getState: () => null` the engine's
  // background-style math is skipped, so the image renders at its natural
  // dimensions inside our viewport — proving the component mounts cleanly
  // and that {#key src} + crossorigin + getElement() all behave.
  const cropper = {
    getState: () => null,
    getTransitions: () => ({ active: false, duration: 0, timingFunction: 'ease-out' } as any),
    getImage: () => ({
      src: 'https://picsum.photos/seed/cropper-bg/640/480',
      width: 640,
      height: 480,
      arrayBuffer: null,
      transforms: { rotate: 0, flip: { horizontal: false, vertical: false } },
    } as any),
  }
</script>

<Story name="Default (engine transforms off)">
  <div
    style="position:relative;width:480px;height:320px;background:#222;overflow:hidden;font-family:sans-serif"
  >
    <CropperBackgroundImage {cropper} />
    <p style="position:absolute;left:8px;bottom:8px;color:#fff;text-shadow:0 0 4px #000;margin:0;font-size:12px">
      With <code>state: null</code> the image renders without engine transforms — proves the
      component mounts, accepts <code>cropper</code>, and applies <code>{`{#key src}`}</code> remount on src change.
    </p>
  </div>
</Story>

<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf'
  import CropperBackgroundWrapper from '../src/components/service/CropperBackgroundWrapper.svelte'

  const { Story } = defineMeta({
    title: 'Boundary/CropperBackgroundWrapper',
    component: CropperBackgroundWrapper,
    tags: ['autodocs'],
    parameters: {
      docs: {
        description: {
          component: `
Wraps the background image in a \`TransformableImage\` configured with three groups of gesture options (\`moveImage\`, \`scaleImage\`, \`rotateImage\`). Each can be a boolean or an options object — the wrapper normalizes them via the engine's \`getOptions\` helper.

Forwards \`onTransform\` / \`onTransformEnd\` to the cropper's \`transformImage\` / \`transformImageEnd\` so engine-managed transitions or in-flight transforms get applied correctly.

> ⚠️ The underlying \`TransformableImage\` is a **stub in M2** — it currently renders a pass-through div. Gesture handling lands in **M3** (issue #3), after which this wrapper becomes fully interactive.
`,
        },
      },
    },
  })

  const cropper = {
    transformImage: () => {},
    transformImageEnd: () => {},
    getTransitions: () => ({ active: false, duration: 0, timingFunction: 'ease-out' } as any),
  }
</script>

<Story name="Default (stub TransformableImage)">
  <CropperBackgroundWrapper {cropper} style="display:block">
    <div
      style="width:480px;height:240px;background:linear-gradient(135deg,#ff3e00,#40b3ff);display:flex;align-items:center;justify-content:center;color:#fff;font-family:sans-serif"
    >
      bg image goes here — drag-to-pan/wheel-to-zoom lands in M3
    </div>
  </CropperBackgroundWrapper>
</Story>

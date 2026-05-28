<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf'
  import TransformableImage from '../src/components/service/TransformableImage.svelte'
  import type { ImageTransform } from 'advanced-cropper'

  const { Story } = defineMeta({
    title: 'Gestures/TransformableImage',
    component: TransformableImage,
    tags: ['autodocs'],
    parameters: {
      docs: {
        description: {
          component: `
The cropper's **image-transform gesture primitive**: drag-to-pan, pinch-to-scale, two-finger rotate, and wheel-to-scale, all funneled through a single \`onTransform(ImageTransform)\` callback. Math is delegated to the engine's \`touchesToImageTransform\` and \`wheelEventToImageTransform\`.

End-of-gesture is fired via \`onTransformEnd\` — synchronously after mouse/touch release, debounced (\`timeout\`, default 500ms) after wheel events since wheels don't have a natural "release" signal.

In a full cropper composition, \`CropperBackgroundWrapper\` wires this up so the user's gestures get applied to the engine's image-transform pipeline.
`,
        },
      },
    },
  })
</script>

<script lang="ts">
  // Apply transforms to a demo box. The translate/scale/rotate fields come
  // directly from the engine's transform math.
  let scale = $state(1)
  let translate = $state({ x: 0, y: 0 })
  let rotate = $state(0)
  let last = $state<ImageTransform | null>(null)

  function apply(t: ImageTransform) {
    last = t
    if (t.move) {
      translate = { x: translate.x + (t.move.left ?? 0), y: translate.y + (t.move.top ?? 0) }
    }
    if (typeof t.scale === 'number') {
      scale *= t.scale
    } else if (t.scale && 'factor' in t.scale) {
      scale *= t.scale.factor
    }
    if (typeof t.rotate === 'number') {
      rotate += t.rotate
    } else if (t.rotate && 'angle' in t.rotate) {
      rotate += t.rotate.angle
    }
  }

  function reset() {
    scale = 1
    translate = { x: 0, y: 0 }
    rotate = 0
    last = null
  }
</script>

<Story name="Interactive: drag + wheel + pinch">
  <div style="font-family:sans-serif">
    <p style="color:#666;margin:0 0 1em">
      Drag (mouse) to pan. Scroll (wheel) to zoom. On a touchscreen, pinch to scale. Two-finger rotate is off
      by default — enable it via the <code>touchRotate</code> prop.
    </p>
    <div style="display:flex;gap:1em;align-items:flex-start">
      <TransformableImage onTransform={apply}>
        <div
          style="position:relative;width:400px;height:300px;background:#222;overflow:hidden;border:1px solid #444;cursor:grab"
        >
          <img
            src="https://picsum.photos/seed/transform/400/300"
            alt=""
            draggable={false}
            style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%) translate({translate.x}px,{translate.y}px) scale({scale}) rotate({rotate}rad);user-select:none;max-width:none"
          />
        </div>
      </TransformableImage>
      <div>
        <button onclick={reset}>Reset</button>
        <p style="margin:0.5em 0 0;color:#666">scale=<code>{scale.toFixed(3)}</code></p>
        <p style="margin:0;color:#666">translate=<code>{JSON.stringify(translate)}</code></p>
        <p style="margin:0;color:#666">rotate=<code>{rotate.toFixed(3)}</code> rad</p>
        <p style="margin:0.5em 0 0;color:#666">last ImageTransform:</p>
        <pre style="margin:0;font-size:11px;color:#888">{JSON.stringify(last, null, 2)}</pre>
      </div>
    </div>
  </div>
</Story>

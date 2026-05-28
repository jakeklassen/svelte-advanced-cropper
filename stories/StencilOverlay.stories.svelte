<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf'
  import StencilOverlay from '../src/components/service/StencilOverlay.svelte'

  const { Story } = defineMeta({
    title: 'Primitives/StencilOverlay',
    component: StencilOverlay,
    tags: ['autodocs'],
    parameters: {
      docs: {
        description: {
          component: `
The dimmed area **outside** the stencil — the visual cue showing what will be cropped out.

Renders as an invisible \`position: absolute\` element that fills its parent (the stencil rectangle) and casts a \`box-shadow: 0 0 0 1000px\` in semi-transparent black via \`currentColor\`. The shadow is clipped by the cropper boundary's \`overflow: hidden\`, producing a "darken everything except the stencil" effect.

**Use directly** if you build a custom stencil composition. \`RectangleStencil\` / \`CircleStencil\` (M4) include it for you. The overlay color comes from the active theme's \`.advanced-cropper-stencil-overlay { color: ... }\`.
`,
        },
      },
    },
  })

  // Layout shim: StencilOverlay paints via `box-shadow: 0 0 0 1000px currentColor`
  // — the *outside* of the stencil rect gets darkened, not the inside. So we
  // place the overlay inside a small stencil rect inside a larger overflow:hidden
  // viewport. The shadow clips at the viewport bounds, simulating the cropper's
  // "darken everything outside the crop" effect.
</script>

<Story name="Default (darkens around a 240x160 stencil)">
  <div
    style="position:relative;width:480px;height:320px;background:url('https://picsum.photos/seed/cropper/480/320') center/cover;overflow:hidden;font-family:sans-serif"
  >
    <div
      style="position:absolute;left:120px;top:80px;width:240px;height:160px;border:1px dashed rgba(255,255,255,0.6);box-sizing:border-box"
    >
      <StencilOverlay />
    </div>
    <p style="position:absolute;left:8px;top:8px;color:#fff;text-shadow:0 0 4px #000;margin:0;font-size:12px">
      stencil viewport (inside is visible, outside is overlay-darkened)
    </p>
  </div>
</Story>

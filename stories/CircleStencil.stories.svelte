<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf'
  import CircleStencil from '../src/components/stencils/CircleStencil.svelte'

  const { Story } = defineMeta({
    title: 'Stencils/CircleStencil',
    component: CircleStencil,
    tags: ['autodocs'],
    parameters: {
      docs: {
        description: {
          component: `
The circular stencil composition. Same internals as \`RectangleStencil\` (\`StencilWrapper\` → \`BoundingBox\` → \`DraggableArea\` → \`StencilOverlay\`), but with the aspect ratio locked to 1:1 and \`boundingBox\` exposed as \`'circle'\` (so the engine snaps the visible-area math accordingly).

By default, only the 4 corner handles are enabled (no edge midpoints), and all 4 cardinal lines render. The CSS in \`themes/default.scss\` styles the inner preview area as a circular ring.

> Static demo — full interactive cropper composition lands in M5.
`,
        },
      },
    },
  })

  // Square coordinates (circle stencil is always 1:1).
  const cropper = {
    getState: () =>
      ({
        boundary: { width: 400, height: 280 },
        coordinates: { left: 80, top: 20, width: 240, height: 240 },
        visibleArea: { left: 0, top: 0, width: 400, height: 280 },
        imageSize: { width: 400, height: 280 },
        transforms: { rotate: 0, flip: { horizontal: false, vertical: false } },
      }) as any,
    getTransitions: () => ({ active: false, duration: 0, timingFunction: 'ease' } as any),
    getInteractions: () =>
      ({
        moveCoordinates: false,
        resizeCoordinates: false,
        transformImage: { rotate: false, move: false, scale: false },
      }) as any,
    hasInteractions: () => false,
    resizeCoordinates: () => {},
    resizeCoordinatesEnd: () => {},
    moveCoordinates: () => {},
    moveCoordinatesEnd: () => {},
  }
</script>

<Story name="Default">
  <div
    style="position:relative;width:400px;height:280px;background:url('https://picsum.photos/seed/circle/400/280') center/cover;border:1px solid #444"
  >
    <CircleStencil
      {cropper}
      coordinates={{ left: 80, top: 20, width: 240, height: 240 }}
    />
  </div>
</Story>

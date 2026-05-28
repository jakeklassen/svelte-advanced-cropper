<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf'
  import SimpleLine from '../src/components/lines/SimpleLine.svelte'

  const { Story } = defineMeta({
    title: 'Primitives/SimpleLine',
    component: SimpleLine,
    tags: ['autodocs'],
    parameters: {
      docs: {
        description: {
          component: `
The **default visual** for a stencil resize edge: a thin draggable line on one of the 4 cardinal sides (N/E/S/W) that the user drags to resize that side. Composes \`LineWrapper\` (for positioning + drag wiring) with a hover-tracking line element.

These are the edge lines you see on a default \`<Cropper>\` or \`<RectangleStencil>\` between the corner handles. To replace the look (dashed, animated, themed), pass your own component as \`lineComponent\` to \`RectangleStencil\` — your component will receive the same props (\`position\`, \`disabled\`, \`onMove\`, \`onMoveEnd\`).

The line border defaults to a semi-transparent theme color and goes opaque on hover. Override via \`defaultClassName\` / \`hoverClassName\` for one-off color/thickness tweaks without writing a custom component.
`,
        },
      },
    },
  })

  // Layout shim: same as LineWrapper — each instance needs an outer positioned
  // div anchoring it to an edge, mimicking BoundingBox's per-line positioning.
  const positions = [
    { p: 'north', style: 'left:0;top:0;width:100%;transform:translateY(-50%)' },
    { p: 'east', style: 'left:100%;top:0;height:100%;transform:translateX(-50%)' },
    { p: 'south', style: 'left:0;top:100%;width:100%;transform:translateY(-50%)' },
    { p: 'west', style: 'left:0;top:0;height:100%;transform:translateX(-50%)' },
  ] as const
</script>

<Story name="All 4 cardinal lines on a rectangle">
  <div
    style="position:relative;width:300px;height:200px;background:rgba(64,179,255,0.1);border:2px dashed #40b3ff;margin:30px"
  >
    {#each positions as { p, style }}
      <div style="position:absolute;{style}">
        <SimpleLine
          position={p}
          onMove={(d) => console.log('move', p, d)}
        />
      </div>
    {/each}
  </div>
  <p style="font-family:sans-serif;color:#666;margin:30px 0 0;max-width:500px">
    Drag interaction is stubbed in M1 (#1) — gestures arrive in M3 (#3).
  </p>
</Story>

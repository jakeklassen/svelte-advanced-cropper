<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf'
  import SimpleHandler from '../src/components/handlers/SimpleHandler.svelte'

  const { Story } = defineMeta({
    title: 'Primitives/SimpleHandler',
    component: SimpleHandler,
    tags: ['autodocs'],
    parameters: {
      docs: {
        description: {
          component: `
The **default visual** for a stencil resize handle: a small filled square that the user drags to resize the stencil from one of 8 ordinal positions (4 corners + 4 edge midpoints). Composes \`HandlerWrapper\` (for positioning + drag wiring) with a hover-tracking dot element.

This is the handle you see on a default \`<Cropper>\` or \`<RectangleStencil>\`. To replace the look (e.g. circle, custom SVG), pass your own component as \`handlerComponent\` to \`RectangleStencil\` — your component will receive the same props (\`verticalPosition\`, \`horizontalPosition\`, \`disabled\`, \`onMove\`, \`onMoveEnd\`).

The handle background defaults to the theme's \`$handler-color\`. Style it directly via \`defaultClassName\` / \`hoverClassName\` for one-off color overrides without writing a custom component.
`,
        },
      },
    },
  })

  // Layout shim: SimpleHandler delegates positioning to HandlerWrapper, which
  // expects `top`/`left` set inline (BoundingBox does this in real usage).
  // We pass them via `wrapperStyle`, mapping the 8 ordinal positions to
  // top/left percentages of a 300x200 demo rectangle.
  const positions = [
    { v: 'north', h: 'west', style: 'top:0;left:0' },
    { v: 'north', h: undefined, style: 'top:0;left:50%' },
    { v: 'north', h: 'east', style: 'top:0;left:100%' },
    { v: undefined, h: 'east', style: 'top:50%;left:100%' },
    { v: 'south', h: 'east', style: 'top:100%;left:100%' },
    { v: 'south', h: undefined, style: 'top:100%;left:50%' },
    { v: 'south', h: 'west', style: 'top:100%;left:0' },
    { v: undefined, h: 'west', style: 'top:50%;left:0' },
  ] as const
</script>

<Story name="All 8 ordinal positions">
  <div
    style="position:relative;width:300px;height:200px;background:rgba(255,62,0,0.1);border:2px solid #ff3e00;margin:30px"
  >
    {#each positions as p}
      <SimpleHandler
        verticalPosition={p.v}
        horizontalPosition={p.h}
        wrapperStyle={p.style}
        onMove={(d) => console.log('move', p, d)}
      />
    {/each}
  </div>
  <p style="font-family:sans-serif;color:#666;margin:30px 0 0;max-width:500px">
    The handles position themselves via the engine's <code>HandlerWrapper</code> SCSS
    (<code>position: absolute; transform: translate(-50%, -50%)</code>) once given
    <code>top</code>/<code>left</code> via <code>wrapperStyle</code>. Drag interaction is
    stubbed in M1 (#1) — gestures arrive in M3 (#3).
  </p>
</Story>

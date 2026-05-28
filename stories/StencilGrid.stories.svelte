<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf'
  import StencilGrid from '../src/components/service/StencilGrid.svelte'

  const { Story } = defineMeta({
    title: 'Primitives/StencilGrid',
    component: StencilGrid,
    tags: ['autodocs'],
    argTypes: {
      visible: { control: 'boolean' },
      columns: { control: { type: 'number', min: 1, max: 12 } },
      rows: { control: { type: 'number', min: 1, max: 12 } },
    },
    parameters: {
      docs: {
        description: {
          component: `
The compositional grid drawn inside the stencil during interaction — typically a 3×3 rule-of-thirds grid that becomes 9×9 while the user is rotating the image. \`RectangleStencil\` toggles \`visible\` based on \`cropper.hasInteractions()\`, so the grid fades in while dragging or resizing and fades out when the user releases.

The grid caches its last visible dimensions: when \`visible: false\`, prop changes to \`columns\` / \`rows\` are ignored until the grid becomes visible again. This avoids a column-count flicker during the fade-out at the end of a rotation gesture (visible→false and rotate→false often land in the same render).
`,
        },
      },
    },
  })

  // Layout shim: in real usage, RectangleStencil wraps StencilGrid inside a
  // sized positioned container (StencilOverlay → 100% width/height). Without
  // those ancestors the grid's `display: table` cells collapse to nothing.
  // We force the grid to fill via `width:100%;height:100%`.
</script>

{#snippet frame(args)}
  <div style="position:relative;width:300px;height:200px;background:#444">
    <StencilGrid {...args} style="width:100%;height:100%" />
  </div>
{/snippet}

<Story name="Default (3x3, visible)" args={{ visible: true, columns: 3, rows: 3 }}>
  {#snippet template(args)}{@render frame(args)}{/snippet}
</Story>

<Story name="Rotation grid (9x9)" args={{ visible: true, columns: 9, rows: 9 }}>
  {#snippet template(args)}{@render frame(args)}{/snippet}
</Story>

<Story name="Hidden" args={{ visible: false, columns: 3, rows: 3 }}>
  {#snippet template(args)}
    <div style="display:flex;align-items:center;gap:1em;font-family:sans-serif">
      {@render frame(args)}
      <p style="color:#666;max-width:240px">
        `visible: false` sets opacity 0 — the grid is still in the DOM (DevTools-inspectable)
        but invisibly fades out via the engine's 0.3s opacity transition.
      </p>
    </div>
  {/snippet}
</Story>

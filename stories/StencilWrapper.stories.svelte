<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf'
  import StencilWrapper from '../src/components/service/StencilWrapper.svelte'

  const { Story } = defineMeta({
    title: 'Primitives/StencilWrapper',
    component: StencilWrapper,
    tags: ['autodocs'],
    parameters: {
      docs: {
        description: {
          component: `
The positioned rectangle representing the stencil's current location and size. Receives \`width\`, \`height\`, \`left\`, \`top\` from the cropper state and renders its children (the lines, handles, overlay, draggable area) inside that footprint.

Internally delegates positioning + animation to \`ArtificialTransition\` (M6 in this port). Real-time \`transform: translate3d(...)\` updates keep the stencil GPU-composited as the user drags or as transitions interpolate.

Consumers building custom stencils wrap their stencil markup in \`StencilWrapper\`. \`RectangleStencil\` and \`CircleStencil\` (M4) do this for you.
`,
        },
      },
    },
  })
</script>

<Story name="Positioned 200x120 at (40, 30)" args={{ width: 200, height: 120, left: 40, top: 30 }}>
  {#snippet template(args)}
    <div style="position:relative;width:320px;height:200px;background:#222;border:1px solid #444">
      <StencilWrapper {...args}>
        <div style="width:100%;height:100%;background:rgba(255,62,0,0.2);border:2px solid #ff3e00"></div>
      </StencilWrapper>
    </div>
  {/snippet}
</Story>

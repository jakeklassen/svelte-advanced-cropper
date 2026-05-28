<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf'
  import HandlerWrapper from '../src/components/service/HandlerWrapper.svelte'

  const { Story } = defineMeta({
    title: 'Primitives/HandlerWrapper',
    component: HandlerWrapper,
    tags: ['autodocs'],
    parameters: {
      docs: {
        description: {
          component: `
A positioned container for a single resize handle (a "corner" or "edge midpoint" of the stencil). Composed by \`BoundingBox\` (M4) once per ordinal direction: 4 corners + 4 edge midpoints = up to 8 instances per stencil.

Sets up the absolute positioning (centered via \`transform: translate(-50%, -50%)\`) and a cursor matching the resize direction (\`nw-resize\`, \`n-resize\`, …). Wraps its child in a \`DraggableElement\` so user drags emit \`onDrag(MoveDirections, event)\`.

You'd use this directly only if writing a **custom handle component** that needs the same positioning + drag contract as \`SimpleHandler\`. Most consumers will just pass a custom \`handlerComponent\` to \`RectangleStencil\` and let the wrapper stay default.
`,
        },
      },
    },
  })

  // Layout shim: HandlerWrapper's SCSS already provides
  // `position:absolute; transform:translate(-50%,-50%)` — but `top`/`left` are
  // set inline by BoundingBox per handle. We supply them via the `style` prop.
</script>

{#snippet handleDot()}
  <div style="width:14px;height:14px;background:#ff3e00;border-radius:2px"></div>
{/snippet}

<Story name="North-east corner">
  <div style="position:relative;width:300px;height:200px;background:#eee;margin:30px">
    <HandlerWrapper
      verticalPosition="north"
      horizontalPosition="east"
      style="top:0;left:100%"
    >
      {@render handleDot()}
    </HandlerWrapper>
  </div>
</Story>

<Story name="South-west corner, disabled">
  <div style="position:relative;width:300px;height:200px;background:#eee;margin:30px">
    <HandlerWrapper
      verticalPosition="south"
      horizontalPosition="west"
      disabled
      style="top:100%;left:0"
    >
      <div style="width:14px;height:14px;background:#999;border-radius:2px"></div>
    </HandlerWrapper>
  </div>
</Story>

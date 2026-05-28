<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf'
  import LineWrapper from '../src/components/service/LineWrapper.svelte'

  const { Story } = defineMeta({
    title: 'Primitives/LineWrapper',
    component: LineWrapper,
    tags: ['autodocs'],
    parameters: {
      docs: {
        description: {
          component: `
A positioned container for a single resize edge — the full-width or full-height drag target along one of the 4 cardinal sides (N/E/S/W) of the stencil. Composed by \`BoundingBox\` (M4) for each enabled side.

Sizes itself to 12px thick × 100% along the relevant axis, applies a side-appropriate resize cursor (\`n-resize\`, \`e-resize\`, …), and wraps its child in a \`DraggableElement\` so drags emit \`onDrag(MoveDirections, event)\`. The contained line visual sits centered on the edge via the inner \`__content\` div's transform.

Use this directly only when writing a **custom line component** that needs the same edge-positioning + drag contract as \`SimpleLine\`. Otherwise pass a custom \`lineComponent\` to \`RectangleStencil\` and let the wrapper stay default.
`,
        },
      },
    },
  })

  // Layout shim: in real usage BoundingBox wraps each LineWrapper in a positioned
  // div that anchors it to the correct edge (see engine's BoundingBox.scss
  // `.advanced-cropper-bounding-box__line--{position}`). We replicate that here.
</script>

<Story name="North line">
  <div style="position:relative;width:300px;height:200px;background:#eee;margin:30px">
    <div style="position:absolute;left:0;top:0;width:100%;transform:translateY(-50%)">
      <LineWrapper position="north">
        <div style="height:4px;background:#40b3ff"></div>
      </LineWrapper>
    </div>
  </div>
</Story>

<Story name="South line, disabled">
  <div style="position:relative;width:300px;height:200px;background:#eee;margin:30px">
    <div style="position:absolute;left:0;top:100%;width:100%;transform:translateY(-50%)">
      <LineWrapper position="south" disabled>
        <div style="height:4px;background:#999"></div>
      </LineWrapper>
    </div>
  </div>
</Story>

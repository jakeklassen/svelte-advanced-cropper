<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf'
  import { DraggableArea } from '../src'

  const { Story } = defineMeta({
    title: 'Gestures/DraggableArea',
    component: DraggableArea,
    tags: ['autodocs'],
    parameters: {
      docs: {
        description: {
          component: `
A semantic alias for \`DraggableElement\` — same component, exported under a second name for clarity at call sites. The React port renamed it for use as the **stencil's interior drag target** (the area inside the stencil that the user grabs to *move* the stencil, distinct from the edge handles that *resize* it).

\`RectangleStencil\` / \`CircleStencil\` use \`<DraggableArea>\` for the move target so a reader of those stencils can immediately tell which drag handler is for moving (vs. the \`HandlerWrapper\` / \`LineWrapper\` ones for resizing).

You don't pick between them based on behavior — they're identical. Pick by intent.
`,
        },
      },
    },
  })
</script>

<script lang="ts">
  let count = $state(0)
</script>

<Story name="Alias of DraggableElement">
  <div style="font-family:sans-serif">
    <p style="color:#666;margin:0 0 1em">
      Drag the box to fire <code>onMove</code> — exact same behavior as <code>DraggableElement</code>.
    </p>
    <div style="position:relative;width:480px;height:240px;background:#eee;overflow:hidden;border:1px solid #ccc">
      <DraggableArea onMove={() => count++}>
        <div
          style="width:200px;height:120px;margin:60px auto;background:#ff3e00;color:#fff;display:flex;align-items:center;justify-content:center;border-radius:4px;cursor:grab;user-select:none"
        >
          drag — fired {count} times
        </div>
      </DraggableArea>
    </div>
  </div>
</Story>

<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf'
  import DraggableElement from '../src/components/service/DraggableElement.svelte'

  const { Story } = defineMeta({
    title: 'Primitives/DraggableElement (stub)',
    component: DraggableElement,
    tags: ['autodocs'],
    parameters: {
      docs: {
        description: {
          component: `
The low-level **drag gesture primitive** for the entire cropper. Every handle, edge, stencil-move target, and (with a sibling primitive) the background image's pan/zoom is built on top of it. Emits \`onMove({ left, top }, event)\` continuously during drag, plus \`onMoveStart\` / \`onMoveEnd\` / \`onEnter\` / \`onLeave\` for state transitions.

In real usage, supports multi-touch + mouse + a configurable \`activationDistance\` (drag deadband) and an \`anchor\` mode that biases pixel deltas so users can drag past the anchor without overshooting.

> ⚠️ **M1 stub.** This file is currently a pass-through \`<div>\` that ignores the gesture props. The real implementation lands in **M3** (issue #3) — see the GitHub milestone for the multi-touch + anchor math.
`,
        },
      },
    },
  })
</script>

<Story name="Pass-through (stub)">
  <DraggableElement onMove={(d) => console.log('move', d)}>
    <div style="display:inline-block;padding:1em 2em;background:#ff3e00;color:#fff;border-radius:4px;font-family:sans-serif">
      drag me (no-op in M1)
    </div>
  </DraggableElement>
  <p style="font-family:sans-serif;color:#666;margin-top:1em">
    M1 stub — real gesture handling lands in M3 (#3).
  </p>
</Story>

<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf'
  import DraggableElement from '../src/components/service/DraggableElement.svelte'

  const { Story } = defineMeta({
    title: 'Gestures/DraggableElement',
    component: DraggableElement,
    tags: ['autodocs'],
    parameters: {
      docs: {
        description: {
          component: `
The low-level **drag gesture primitive** for the entire cropper. Every handle, edge, stencil-move target, and (with a sibling primitive) the background image's pan/zoom is built on top of it.

Wires window-level mouse/touch listeners so a drag that leaves the element still reports moves; supports multi-touch + mouse + a configurable \`activationDistance\` (touch deadband) and an \`anchor\` mode that dampens deltas as the touch moves *back toward* the anchor (handy for resize handles where overshoot would feel wrong).

Emits \`onMove({ left, top }, event)\` continuously during drag, plus \`onMoveStart\` / \`onMoveEnd\` / \`onEnter\` / \`onLeave\` for state transitions.
`,
        },
      },
    },
  })
</script>

<script lang="ts">
  let pos = $state({ left: 120, top: 80 })
  let dragging = $state(false)
  let hovered = $state(false)
  let lastDelta = $state({ left: 0, top: 0 })
</script>

<Story name="Interactive: drag a box around">
  <div style="font-family:sans-serif">
    <p style="color:#666;margin:0 0 1em">
      Mouse-down on the orange box and drag it around the frame. The box position is updated
      from <code>onMove</code>'s cumulative delta.
    </p>
    <div style="position:relative;width:480px;height:300px;background:#222;overflow:hidden;border:1px solid #444">
      <DraggableElement
        class="demo-draggable"
        onMoveStart={() => (dragging = true)}
        onMove={(d) => {
          lastDelta = d
          pos = { left: pos.left + d.left, top: pos.top + d.top }
        }}
        onMoveEnd={() => (dragging = false)}
        onEnter={() => (hovered = true)}
        onLeave={() => (hovered = false)}
      >
        <div
          style="position:absolute;left:{pos.left}px;top:{pos.top}px;width:80px;height:60px;background:{dragging
            ? '#40b3ff'
            : hovered
              ? '#ff5722'
              : '#ff3e00'};color:#fff;display:flex;align-items:center;justify-content:center;border-radius:4px;cursor:grab;user-select:none"
        >
          drag me
        </div>
      </DraggableElement>
    </div>
    <p style="color:#666;margin:0.5em 0 0">
      State: dragging=<code>{dragging}</code>, hovered=<code>{hovered}</code>,
      lastDelta=<code>{JSON.stringify(lastDelta)}</code>, pos=<code>{JSON.stringify(pos)}</code>
    </p>
  </div>

  <style>
    :global(.demo-draggable) {
      width: 100%;
      height: 100%;
    }
  </style>
</Story>

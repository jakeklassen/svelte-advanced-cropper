<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf'
  import BoundingBox from '../src/components/service/BoundingBox.svelte'
  import HandlerWrapper from '../src/components/service/HandlerWrapper.svelte'

  const { Story } = defineMeta({
    title: 'Stencils/BoundingBox',
    component: BoundingBox,
    tags: ['autodocs'],
    parameters: {
      docs: {
        description: {
          component: `
The **orchestrator** that lays out the 4 cardinal lines and up to 8 ordinal handles around a stencil rectangle. Builds two arrays (\`lineNodes\`, \`handlerNodes\`) from the \`lines\` / \`handlers\` config and renders each via the appropriate component slot, applying the engine's \`__line--{position}\` and \`__handler-wrapper--{position}\` classes for absolute positioning.

Supports **both polymorphism patterns** per decision #1:

- **Component prop** (\`handlerComponent\`, \`lineComponent\`) — React-API parity, easiest migration path. Defaults to \`SimpleHandler\` / \`SimpleLine\`.
- **Snippet** (\`handler\`, \`line\`) — Svelte-idiomatic, takes precedence over the component prop. The snippet receives the same props the default component would, including \`verticalPosition\` / \`horizontalPosition\` / \`onMove\` / \`onMoveEnd\` — so wrap your custom visual in a \`HandlerWrapper\` to inherit the positioning/cursor behavior.

\`RectangleStencil\` / \`CircleStencil\` compose this internally. You'd render \`BoundingBox\` directly only when building a fully custom stencil composition.
`,
        },
      },
    },
  })
</script>

<Story name="Default (SimpleHandler + SimpleLine)">
  <div
    style="position:relative;width:300px;height:200px;background:rgba(255,62,0,0.1);border:2px solid #ff3e00;margin:30px"
  >
    <BoundingBox
      onResize={(a, d) => console.log('resize', a, d)}
      onResizeEnd={() => console.log('resize end')}
    />
  </div>
</Story>

<Story name="Snippet handler override (recommended Svelte path)">
  <div
    style="position:relative;width:300px;height:200px;background:rgba(64,179,255,0.1);border:2px solid #40b3ff;margin:30px"
  >
    <BoundingBox onResize={(a, d) => console.log('resize', a, d)}>
      {#snippet handler(props)}
        <!-- Wrap in HandlerWrapper to inherit positioning + cursor; the snippet
             receives the same props the default SimpleHandler would. -->
        <HandlerWrapper
          horizontalPosition={props.horizontalPosition ?? undefined}
          verticalPosition={props.verticalPosition ?? undefined}
          disabled={props.disabled}
          onDrag={props.onMove}
          onDragEnd={props.onMoveEnd}
        >
          <div
            style="width:18px;height:18px;background:#fff;border:3px solid #40b3ff;border-radius:50%;box-shadow:0 1px 3px rgba(0,0,0,0.3)"
          ></div>
        </HandlerWrapper>
      {/snippet}
    </BoundingBox>
  </div>
  <p style="font-family:sans-serif;color:#666;margin:8px 30px;max-width:500px">
    The snippet receives <code>verticalPosition</code>, <code>horizontalPosition</code>,
    <code>onMove</code>, <code>onMoveEnd</code> — wrap in <code>HandlerWrapper</code> for
    positioning + cursor, then render your custom visual inside.
  </p>
</Story>

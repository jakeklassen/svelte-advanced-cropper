<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf'
  import RectangleStencil from '../src/components/stencils/RectangleStencil.svelte'
  import HandlerWrapper from '../src/components/service/HandlerWrapper.svelte'

  const { Story } = defineMeta({
    title: 'Stencils/RectangleStencil',
    component: RectangleStencil,
    tags: ['autodocs'],
    parameters: {
      docs: {
        description: {
          component: `
The default rectangular stencil composition: \`StencilWrapper\` (positioned) → \`BoundingBox\` (lines + handles) → \`DraggableArea\` (move) → \`StencilOverlay\` (dims the outside) → optional \`StencilGrid\`.

Polymorphic overrides for handlers, lines, and the grid are passed straight through to \`BoundingBox\`. \`aspectRatio\` (or \`minAspectRatio\` / \`maxAspectRatio\`) is exposed via the \`getAspectRatio()\` instance method so M5's \`AbstractCropper\` can feed it back into \`stencilConstraints\`.

> Static demo — full interactive cropper composition lands in M5.
`,
        },
      },
    },
  })

  // Minimal fake cropper for static visual smoke.
  function makeFakeCropper(coords = { left: 60, top: 40, width: 280, height: 200 }) {
    return {
      getState: () =>
        ({
          boundary: { width: 400, height: 280 },
          coordinates: coords,
          visibleArea: { left: 0, top: 0, width: 400, height: 280 },
          imageSize: { width: 400, height: 280 },
          transforms: { rotate: 0, flip: { horizontal: false, vertical: false } },
        }) as any,
      getTransitions: () => ({ active: false, duration: 0, timingFunction: 'ease' } as any),
      getInteractions: () =>
        ({
          moveCoordinates: false,
          resizeCoordinates: false,
          transformImage: { rotate: false, move: false, scale: false },
        }) as any,
      hasInteractions: () => false,
      resizeCoordinates: () => {},
      resizeCoordinatesEnd: () => {},
      moveCoordinates: () => {},
      moveCoordinatesEnd: () => {},
    }
  }
</script>

{#snippet frame(children: any, accentColor = '#ff3e00')}
  <div
    style="position:relative;width:400px;height:280px;background:url('https://picsum.photos/seed/stencil/400/280') center/cover;border:1px solid #444"
  >
    {@render children()}
  </div>
{/snippet}

<Story name="Default (with grid)">
  {#snippet template()}
    {@const cropper = makeFakeCropper()}
    {#snippet inner()}
      <RectangleStencil
        {cropper}
        grid
        coordinates={{ left: 60, top: 40, width: 280, height: 200 }}
      />
    {/snippet}
    {@render frame(inner)}
  {/snippet}
</Story>

<Story name="Snippet handler override">
  {#snippet template()}
    {@const cropper = makeFakeCropper()}
    {#snippet inner()}
      <RectangleStencil
        {cropper}
        coordinates={{ left: 60, top: 40, width: 280, height: 200 }}
      >
        {#snippet handler(props)}
          <HandlerWrapper
            horizontalPosition={props.horizontalPosition ?? undefined}
            verticalPosition={props.verticalPosition ?? undefined}
            disabled={props.disabled}
            onDrag={props.onMove}
            onDragEnd={props.onMoveEnd}
          >
            <div
              style="width:14px;height:14px;background:#40b3ff;border:2px solid #fff;border-radius:50%;box-shadow:0 1px 3px rgba(0,0,0,0.4)"
            ></div>
          </HandlerWrapper>
        {/snippet}
      </RectangleStencil>
    {/snippet}
    {@render frame(inner)}
  {/snippet}
</Story>

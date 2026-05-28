<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf'
  import ArtificialTransition from '../src/components/service/ArtificialTransition.svelte'

  const { Story } = defineMeta({
    title: 'Primitives/ArtificialTransition',
    component: ArtificialTransition,
    tags: ['autodocs'],
    parameters: {
      docs: {
        description: {
          component: `
The cropper's **JS-driven transition runner**. Animates \`width\`, \`height\`, and \`translate3d(left, top)\` frame-by-frame using the engine's \`Animation\` class instead of CSS \`transition\`. This gives the cropper precise control over duration, easing, and interruption — important because the user can grab and re-drag a stencil mid-animation, and the cropper needs to seamlessly take over from the in-progress interpolation.

Used internally by \`StencilWrapper\` to interpolate position + size whenever the engine emits a transitions-active state (e.g. after reset, after aspect-ratio change, or after a constrained-resize snap-back).
`,
        },
      },
    },
  })
</script>

<Story
  name="Static positioning"
  args={{ width: 160, height: 100, left: 50, top: 40 }}
>
  {#snippet template(args)}
    <div style="position:relative;width:320px;height:200px;background:#222">
      <ArtificialTransition {...args}>
        <div style="width:100%;height:100%;background:#ff3e00;opacity:0.8"></div>
      </ArtificialTransition>
    </div>
    <p style="font-family:sans-serif;color:#666;margin-top:1em">
      With <code>transitions.active: false</code> the values apply instantly. Animation kicks in
      when a CropperTransitions object with <code>active: true</code> is passed.
    </p>
  {/snippet}
</Story>

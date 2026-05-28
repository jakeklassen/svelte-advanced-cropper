<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf'
  import CropperFade from '../src/components/service/CropperFade.svelte'

  const { Story } = defineMeta({
    title: 'Primitives/CropperFade',
    component: CropperFade,
    tags: ['autodocs'],
    argTypes: {
      visible: { control: 'boolean' },
    },
    parameters: {
      docs: {
        description: {
          component: `
A wrapper that hides its children until \`visible\` flips true, then fades them in over **0.5s** via an opacity + visibility transition. The default cropper composition wraps its entire UI in a \`CropperFade\` so the boundary, image, and stencil don't pop in while the image is still loading.

**Use directly** if you need the same load-in fade for custom cropper compositions. Otherwise it's mostly an internal building block of \`CropperWrapper\`.
`,
        },
      },
    },
  })

  // Layout shim: CropperFade defaults to opacity:0 / visibility:hidden with a
  // 0.5s transition. The "Hidden" variant correctly renders nothing visible —
  // we add an outlined wrapper so you can see the region the fade occupies.
</script>

{#snippet box()}
  <div
    style="width:240px;height:140px;background:linear-gradient(135deg,#ff3e00,#40b3ff);border-radius:8px;display:flex;align-items:center;justify-content:center;color:#fff;font-family:sans-serif"
  >
    faded content
  </div>
{/snippet}

<Story name="Visible" args={{ visible: true }}>
  {#snippet template(args)}
    <CropperFade {...args}>
      {@render box()}
    </CropperFade>
  {/snippet}
</Story>

<Story name="Hidden" args={{ visible: false }}>
  {#snippet template(args)}
    <div style="position:relative;width:240px;height:140px;outline:1px dashed #999;font-family:sans-serif">
      <CropperFade {...args}>
        {@render box()}
      </CropperFade>
      <p style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;margin:0;color:#999;pointer-events:none">
        (faded out — toggle Controls)
      </p>
    </div>
  {/snippet}
</Story>

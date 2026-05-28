<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf'
  import FixedCropper from '../src/components/croppers/FixedCropper.svelte'

  const { Story } = defineMeta({
    title: 'Cropper/FixedCropper',
    component: FixedCropper,
    tags: ['autodocs'],
    parameters: {
      docs: {
        description: {
          component: `
A cropper with a **locked stencil size** — no resize handles. The user can only pan and zoom the image inside a fixed-size crop window. Powered by the engine's \`stencil-size\` extension (\`fixedStencil\` postProcess + \`fixedStencilConstraints\`).

\`sizeRestrictions\` and \`aspectRatio\` settings are not accepted (the stencil is already pinned to one size). Pass \`stencilSize\` as \`{ width, height }\` or as a function of the boundary.
`,
        },
      },
    },
  })
</script>

<Story name="Square 200x200">
  <div style="width:480px;height:320px;background:#222">
    <FixedCropper
      src="https://picsum.photos/seed/fixed-square/1200/800"
      stencilSize={{ width: 200, height: 200 }}
      style="height:100%"
    />
  </div>
</Story>

<Story name="Banner 16:9 (320x180)">
  <div style="width:480px;height:320px;background:#222">
    <FixedCropper
      src="https://picsum.photos/seed/fixed-banner/1200/800"
      stencilSize={{ width: 320, height: 180 }}
      style="height:100%"
    />
  </div>
</Story>

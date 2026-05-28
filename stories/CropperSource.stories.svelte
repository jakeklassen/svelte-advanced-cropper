<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf'
  import CropperSource from '../src/components/service/CropperSource.svelte'

  const { Story } = defineMeta({
    title: 'Boundary/CropperSource',
    component: CropperSource,
    tags: ['autodocs'],
    parameters: {
      docs: {
        description: {
          component: `
A **hidden source image** (1×1 px, \`visibility: hidden\`, \`opacity: 0\`) that lives inside the cropper DOM. Its purpose isn't to be seen — it's to keep the underlying \`<img>\` element alive across DOM transitions so the browser can hand off cached image data and \`crossorigin\` state to the canvas exporter.

The \`{#key src}\` block remounts the \`<img>\` whenever the source URL changes — forcing a clean image-decoding cycle. When \`src\` is null/undefined, **nothing renders**.

This is an internal building block of the cropper composition. Consumers rarely touch it directly.
`,
        },
      },
    },
  })
</script>

<Story name="Default (hidden 1x1 img)" args={{ src: 'https://picsum.photos/seed/source/800/600' }}>
  {#snippet template(args)}
    <div style="font-family:sans-serif;color:#333">
      <p>The CropperSource is rendered below — but it's <code>visibility: hidden; opacity: 0; width: 1px; height: 1px</code>.</p>
      <p style="color:#666">Inspect the DOM (DevTools) to confirm the <code>&lt;img&gt;</code> with class <code>advanced-cropper-source</code> is present.</p>
      <CropperSource {...args} />
    </div>
  {/snippet}
</Story>

<Story name="Null src (renders nothing)" args={{ src: null }}>
  {#snippet template(args)}
    <div style="font-family:sans-serif;color:#333">
      <p>With <code>src: null</code>, no <code>&lt;img&gt;</code> is emitted at all.</p>
      <CropperSource {...args} />
    </div>
  {/snippet}
</Story>

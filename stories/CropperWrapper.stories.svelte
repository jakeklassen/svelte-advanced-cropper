<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf'
  import CropperWrapper from '../src/components/service/CropperWrapper.svelte'

  const { Story } = defineMeta({
    title: 'Boundary/CropperWrapper',
    component: CropperWrapper,
    tags: ['autodocs'],
    parameters: {
      docs: {
        description: {
          component: `
The **outermost container** of a default cropper composition. Wraps everything inside a \`CropperFade\` so the cropper UI fades in only once the image has loaded.

Reads from a minimal cropper accessor (\`getState\`, \`isLoaded\`) to decide visibility. M5 replaces the prop with \`getCropperContext()\` so internal components stop prop-drilling \`cropper={cropper}\`.

\`AbstractCropper\` (M5) defaults to this; you'd swap it via the \`wrapperComponent\` prop on \`<Cropper>\` to inject your own outer chrome.
`,
        },
      },
    },
  })

  // Minimal fake cropper for the visual smoke test. Real engine wrapper is M5.
  const loadedCropper = {
    getState: () => ({ boundary: { width: 400, height: 240 } }) as any,
    isLoading: () => false,
    isLoaded: () => true,
  }
  const loadingCropper = {
    getState: () => null,
    isLoading: () => true,
    isLoaded: () => false,
  }
</script>

<Story name="Loaded (children visible)">
  <CropperWrapper cropper={loadedCropper} style="display:flex">
    <div
      style="background:#333;color:#fff;width:400px;height:240px;display:flex;align-items:center;justify-content:center;font-family:sans-serif"
    >
      cropper UI would render here
    </div>
  </CropperWrapper>
</Story>

<Story name="Loading (children hidden via CropperFade)">
  <div style="position:relative;width:400px;height:240px;outline:1px dashed #999">
    <CropperWrapper cropper={loadingCropper} style="display:flex">
      <div style="background:#ff3e00;color:#fff;width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-family:sans-serif">
        you shouldn't see this
      </div>
    </CropperWrapper>
    <p style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#999;pointer-events:none;font-family:sans-serif;margin:0">
      (fade is hidden — outlined region shows where the cropper would render)
    </p>
  </div>
</Story>

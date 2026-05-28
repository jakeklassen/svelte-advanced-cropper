<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf'
  import StretchableBoundary from '../src/components/service/StretchableBoundary.svelte'

  const { Story } = defineMeta({
    title: 'Boundary/StretchableBoundary',
    component: StretchableBoundary,
    tags: ['autodocs'],
    parameters: {
      docs: {
        description: {
          component: `
The **measured frame** of the cropper — a \`position: relative\` container whose internal stretcher gets sized to match the loaded image, then re-measured to feed the cropper engine an exact boundary size.

Exposes two imperative methods via Svelte 5 instance exports (consumers access via \`bind:this\`):

- **\`stretchTo(size): Promise<Size | null>\`** — stretches the stretcher to fit \`size\` (the image's natural dimensions), runs the size algorithm, and returns the resulting boundary size (or \`null\` if degenerate).
- **\`reset(): void\`** — clears the inline sizing so the boundary returns to natural flow.

M5's resetCropper sequence calls \`stretchTo(image)\` then waits on the promise before feeding the resulting size back to the engine.
`,
        },
      },
    },
  })
</script>

<script lang="ts">
  let boundary: ReturnType<typeof StretchableBoundary> | undefined = $state(undefined)
  let result = $state<string>('(none yet)')

  async function fit(w: number, h: number) {
    if (!boundary) return
    // @ts-expect-error svelte component instance methods are surfaced via bind:this
    const got = await boundary.stretchTo({ width: w, height: h })
    result = got ? `→ boundary { width: ${got.width}, height: ${got.height} }` : '→ null'
  }
  function reset() {
    // @ts-expect-error
    boundary?.reset()
    result = '(reset)'
  }
</script>

<Story name="Interactive: stretchTo / reset">
  <div style="font-family:sans-serif">
    <div style="margin-bottom:1em;display:flex;gap:0.5em;flex-wrap:wrap">
      <button onclick={() => fit(800, 600)}>stretchTo 4:3 (800×600)</button>
      <button onclick={() => fit(1920, 1080)}>stretchTo 16:9 (1920×1080)</button>
      <button onclick={() => fit(600, 800)}>stretchTo 3:4 (600×800)</button>
      <button onclick={reset}>reset</button>
    </div>
    <p style="color:#666;margin:0 0 0.5em">Result: <code>{result}</code></p>
    <div style="width:480px;height:320px;background:#222;outline:1px solid #444">
      <StretchableBoundary bind:this={boundary} style="background:#444;height:100%">
        <div
          style="background:linear-gradient(135deg,#ff3e00,#40b3ff);width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#fff"
        >
          boundary content
        </div>
      </StretchableBoundary>
    </div>
  </div>
</Story>

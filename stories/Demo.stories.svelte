<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf'
  import { ImageRestriction } from 'advanced-cropper'
  import Cropper from '../src/components/croppers/Cropper.svelte'
  import FixedCropper from '../src/components/croppers/FixedCropper.svelte'
  import CropperPreview from '../src/components/helpers/CropperPreview.svelte'
  import CircleStencil from '../src/components/stencils/CircleStencil.svelte'
  import type { CropperRef } from '../src/components/croppers/Cropper.types.js'

  const { Story } = defineMeta({
    // Title with no `/` → top-level entry. With a single story, Storybook
    // hoists it to a one-click leaf in the sidebar (no nested group).
    title: 'Demo',
    // No `tags: ['autodocs']` — the Docs page generator tries to render this
    // story's snippet-based body as React and emits `<Story /> is unrecognized`
    // warnings. The Canvas view IS the demo; a separate Docs page would just
    // embed the same content smaller with extra chrome.
    parameters: {
      layout: 'fullscreen',
    },
  })

  type Variant = 'default' | 'circle' | 'fixed-square' | 'fixed-banner'

  const variants: { key: Variant; label: string; desc: string }[] = [
    { key: 'default', label: 'Default', desc: 'Free-form rectangle' },
    { key: 'circle', label: 'Circle', desc: 'Locked 1:1 circle' },
    { key: 'fixed-square', label: 'Fixed Sq', desc: '200x200 locked' },
    { key: 'fixed-banner', label: 'Fixed 16:9', desc: '320x180 locked' },
  ]

  const aspectPresets: { label: string; value: number | undefined }[] = [
    { label: 'Free', value: undefined },
    { label: '1:1', value: 1 },
    { label: '4:3', value: 4 / 3 },
    { label: '16:9', value: 16 / 9 },
    { label: '3:4', value: 3 / 4 },
  ]

  const restrictionOptions = [
    {
      value: ImageRestriction.fitArea,
      label: 'fitArea (default)',
      hint: 'Whole image always fits the frame; black bars fill the rest. Zoom-out stops once the image fits.',
    },
    {
      value: ImageRestriction.fillArea,
      label: 'fillArea',
      hint: 'Image always covers the frame — no background ever shows. Zoom-out stops once the image fills.',
    },
    {
      value: ImageRestriction.stencil,
      label: 'stencil',
      hint: 'Only the crop box is locked to the image. Scroll to zoom out — the image shrinks and background shows all around it.',
    },
    {
      value: ImageRestriction.none,
      label: 'none',
      hint: 'No restrictions — pan/zoom freely; the crop box can even leave the image.',
    },
  ]

  type CatImage = { src: string; alt: string }
  const cats: CatImage[] = [
    { src: '/cats/cat-002.jpg', alt: 'cat 2 (1440 square)' },
    { src: '/cats/cat-003.jpg', alt: 'cat 3 (1024 square)' },
    { src: '/cats/cat-004.jpg', alt: 'cat 4 (1440 square)' },
    { src: '/cats/cat-001.jpg', alt: 'cat 1 (tall portrait)' },
    { src: '/cats/banana-cat.jpg', alt: 'banana cat' },
    { src: '/cats/filler-cat.jpg', alt: 'filler cat' },
  ]
</script>

<script lang="ts">
  let variant: Variant = $state('default')
  let src: string = $state(cats[0].src)
  let customSrc: string | null = $state(null)
  let cropperRef: CropperRef | undefined = $state(undefined)
  let previewRef: CropperPreview | undefined = $state(undefined)

  // Settings
  let aspectRatio: number | undefined = $state(undefined)
  let grid = $state(true)
  let scaleImage = $state(true)
  let imageRestriction: ImageRestriction = $state(ImageRestriction.fitArea)

  // Live cropped output
  let outputUrl: string | null = $state(null)
  let outputSize: { w: number; h: number } | null = $state(null)
  let exporting = $state(false)

  const activeSrc = $derived(customSrc ?? src)
  const variantMeta = $derived(variants.find((v) => v.key === variant))
  const restrictionHint = $derived(
    restrictionOptions.find((o) => o.value === imageRestriction)?.hint ?? '',
  )

  // Stencil props passed to the free-form variants. Aspect ratio nudges are
  // ignored by the fixed variants (size is locked).
  const stencilProps = $derived({ aspectRatio, grid })

  // `imageRestriction` is an engine setting, not a top-level component prop —
  // it has to be passed inside `settings`. (AbstractCropper destructures
  // `settings` and merges it into the engine props closure.)
  const cropperSettings = $derived({ imageRestriction })

  function pickCat(s: string) {
    if (customSrc) {
      URL.revokeObjectURL(customSrc)
      customSrc = null
    }
    src = s
  }

  function onFile(e: Event) {
    const input = e.currentTarget as HTMLInputElement
    if (!input.files?.[0]) return
    if (customSrc) URL.revokeObjectURL(customSrc)
    customSrc = URL.createObjectURL(input.files[0])
  }

  // The engine's getCanvas always returns a rectangular canvas — DrawOptions
  // has no mask field. For the Circle variant we post-process with a
  // destination-in arc clip so the exported PNG is actually a circle.
  function applyCircleMask(src: HTMLCanvasElement): HTMLCanvasElement {
    const out = document.createElement('canvas')
    out.width = src.width
    out.height = src.height
    const ctx = out.getContext('2d')
    if (!ctx) return src
    ctx.beginPath()
    ctx.arc(src.width / 2, src.height / 2, Math.min(src.width, src.height) / 2, 0, Math.PI * 2)
    ctx.closePath()
    ctx.clip()
    ctx.drawImage(src, 0, 0)
    return out
  }

  function exportCanvas() {
    if (!cropperRef) return
    exporting = true
    let canvas = cropperRef.getCanvas()
    if (canvas && variant === 'circle') canvas = applyCircleMask(canvas)
    if (canvas) {
      outputUrl = canvas.toDataURL('image/png')
      outputSize = { w: canvas.width, h: canvas.height }
    } else {
      outputUrl = null
      outputSize = null
    }
    exporting = false
  }

  function reset() {
    cropperRef?.reset()
    outputUrl = null
    outputSize = null
  }

  // Transforms — rotateImage takes a *relative* angle in degrees and
  // accumulates into state.transforms.rotate; flipImage(h, v) mirrors.
  function rotate(delta: number) {
    cropperRef?.rotateImage(delta)
  }
  function flipHorizontal() {
    cropperRef?.flipImage(true, false)
  }

  // Refresh the live preview whenever the cropper says state changed.
  function onUpdate() {
    previewRef?.refresh()
  }
</script>

<!--
  All demo markup lives inside the <Story> body at the bottom of this file
  so both Canvas and Docs views render it. State/handlers stay in the
  top-level <script> and are captured via closure.
-->
{#snippet demoMarkup()}
<div class="demo">
  <header class="demo__header">
    <h2>svelte-advanced-cropper demo</h2>
    <p>
      Pick a variant, choose a cat (or upload your own), and tweak settings. Drag the stencil
      and the image; scroll-wheel to zoom. Click <strong>Crop Photo</strong> to see
      the canvas export.
    </p>
  </header>

  <!-- Variant tabs -->
  <nav class="demo__tabs">
    {#each variants as v}
      <button
        class="demo__tab"
        class:demo__tab--active={variant === v.key}
        onclick={() => (variant = v.key)}
      >
        <strong>{v.label}</strong>
        <span>{v.desc}</span>
      </button>
    {/each}
  </nav>

  <div class="demo__body">
    <!-- Cropper canvas -->
    <div class="demo__cropper">
      {#key variant + activeSrc}
        {#if variant === 'default'}
          <Cropper
            bind:this={cropperRef as any}
            src={activeSrc}
            settings={cropperSettings}
            {stencilProps}
            backgroundWrapperProps={{ scaleImage }}
            {onUpdate}
            style="height:100%"
          />
        {:else if variant === 'circle'}
          <Cropper
            bind:this={cropperRef as any}
            src={activeSrc}
            settings={cropperSettings}
            stencilComponent={CircleStencil}
            stencilProps={{ grid }}
            backgroundWrapperProps={{ scaleImage }}
            {onUpdate}
            style="height:100%"
          />
        {:else if variant === 'fixed-square'}
          <FixedCropper
            bind:this={cropperRef as any}
            src={activeSrc}
            stencilSize={{ width: 240, height: 240 }}
            stencilProps={{ grid }}
            backgroundWrapperProps={{ scaleImage }}
            {onUpdate}
            style="height:100%"
          />
        {:else if variant === 'fixed-banner'}
          <FixedCropper
            bind:this={cropperRef as any}
            src={activeSrc}
            stencilSize={{ width: 384, height: 216 }}
            stencilProps={{ grid }}
            backgroundWrapperProps={{ scaleImage }}
            {onUpdate}
            style="height:100%"
          />
        {/if}
      {/key}
    </div>

    <!-- Side rail: settings + image picker + preview + output -->
    <aside class="demo__side">
      <section class="demo__settings">
        <h3>Settings</h3>

        {#if variant === 'default' || variant === 'circle'}
          <label class="demo__row">
            <span>Image restriction</span>
            <select bind:value={imageRestriction}>
              {#each restrictionOptions as opt}
                <option value={opt.value}>{opt.label}</option>
              {/each}
            </select>
            <small class="demo__hint">{restrictionHint}</small>
          </label>
        {/if}

        {#if variant === 'default'}
          <div class="demo__row">
            <span>Aspect ratio</span>
            <div class="demo__chips">
              {#each aspectPresets as preset}
                <button
                  class="demo__chip"
                  class:demo__chip--active={aspectRatio === preset.value}
                  onclick={() => (aspectRatio = preset.value)}
                >
                  {preset.label}
                </button>
              {/each}
            </div>
          </div>
        {/if}

        <label class="demo__row demo__row--inline">
          <input type="checkbox" bind:checked={grid} />
          <span>Show grid on interaction</span>
        </label>

        <label class="demo__row demo__row--inline">
          <input type="checkbox" bind:checked={scaleImage} />
          <span>Allow wheel/pinch zoom</span>
        </label>

        <div class="demo__row">
          <span>Transform image</span>
          <div class="demo__chips">
            <button class="demo__chip" onclick={() => rotate(-90)} title="Rotate left 90°">⟲ 90°</button>
            <button class="demo__chip" onclick={() => rotate(90)} title="Rotate right 90°">⟳ 90°</button>
            <button class="demo__chip" onclick={flipHorizontal} title="Flip horizontal">⇋ Flip</button>
          </div>
        </div>

        <div class="demo__row demo__actions">
          <button class="demo__btn demo__btn--primary" onclick={exportCanvas} disabled={exporting}>
            Crop Photo
          </button>
          <button class="demo__btn" onclick={reset}>Reset</button>
        </div>
      </section>

      <section class="demo__images">
        <h3>Image</h3>
        <div class="demo__thumbs">
          {#each cats as cat}
            <button
              class="demo__thumb"
              class:demo__thumb--active={!customSrc && src === cat.src}
              onclick={() => pickCat(cat.src)}
              title={cat.alt}
            >
              <img src={cat.src} alt={cat.alt} />
            </button>
          {/each}
          <label class="demo__thumb demo__thumb--upload" title="Upload">
            <input type="file" accept="image/*" onchange={onFile} />
            <span>＋</span>
          </label>
        </div>
      </section>

      <section class="demo__preview">
        <h3>Live preview</h3>
        <div class="demo__preview-frame">
          <CropperPreview
            bind:this={previewRef as any}
            cropper={cropperRef as any}
            style="height:100%"
          />
        </div>
      </section>

      {#if outputUrl}
        <section class="demo__output">
          <h3>Cropped output ({outputSize?.w}x{outputSize?.h})</h3>
          <img src={outputUrl} alt="cropped" />
        </section>
      {/if}
    </aside>
  </div>
</div>
{/snippet}

<style>
  .demo {
    font-family: ui-sans-serif, system-ui, sans-serif;
    color: #1a1a1a;
    padding: 1em;
    background: #f5f5f7;
    box-sizing: border-box;
    /* Constrain to viewport so the layout fits without scroll on
       reasonable laptop screens (~900px tall and up). */
    max-width: 1280px;
    margin: 0 auto;
  }
  .demo__header h2 {
    margin: 0 0 0.15em;
    font-size: 1.25em;
  }
  .demo__header p {
    margin: 0 0 0.75em;
    color: #555;
    max-width: 720px;
    font-size: 0.9em;
  }
  .demo__tabs {
    display: flex;
    gap: 0.4em;
    margin-bottom: 0.75em;
    flex-wrap: wrap;
  }
  .demo__tab {
    border: 1px solid #d4d4d8;
    background: #fff;
    padding: 0.6em 1em;
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    gap: 0.15em;
    min-width: 110px;
    text-align: left;
    transition: border-color 0.15s, background 0.15s;
  }
  .demo__tab:hover { border-color: #ff3e00; }
  .demo__tab strong { color: #ff3e00; }
  .demo__tab span { font-size: 0.8em; color: #666; }
  .demo__tab--active { border-color: #ff3e00; background: #fff5f1; }
  .demo__body {
    display: grid;
    /* minmax(0, 1fr) prevents the cropper column from blowing out width-wise
       when its content has intrinsic dimensions (the <img>). */
    grid-template-columns: minmax(0, 1fr) 300px;
    gap: 1em;
    align-items: start;
  }
  .demo__cropper {
    background: #1a1a1a;
    border-radius: 8px;
    /* Explicit height (not min-height) so the inner <Cropper style="height:100%">
       can actually resolve 100% to a real number. min-height leaves height: auto
       on the cropper which makes it grow to the image's natural aspect ratio. */
    height: 520px;
    overflow: hidden;
  }
  .demo__side {
    display: flex;
    flex-direction: column;
    gap: 0.75em;
  }
  .demo__side section {
    background: #fff;
    border: 1px solid #e4e4e7;
    border-radius: 8px;
    padding: 0.75em;
  }
  .demo__side h3 {
    margin: 0 0 0.5em;
    font-size: 0.75em;
    color: #555;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .demo__row {
    display: flex;
    flex-direction: column;
    gap: 0.4em;
    margin-bottom: 0.75em;
    font-size: 0.9em;
  }
  .demo__row:last-child { margin-bottom: 0; }
  .demo__row--inline {
    flex-direction: row;
    align-items: center;
    gap: 0.5em;
  }
  .demo__row > span { color: #555; font-size: 0.85em; }
  .demo__row select {
    padding: 0.4em;
    border: 1px solid #d4d4d8;
    border-radius: 4px;
    font-size: 0.9em;
  }
  .demo__hint {
    color: #777;
    font-size: 0.78em;
    line-height: 1.35;
  }
  .demo__chips { display: flex; gap: 0.25em; flex-wrap: wrap; }
  .demo__chip {
    padding: 0.3em 0.6em;
    border: 1px solid #d4d4d8;
    background: #fff;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.85em;
  }
  .demo__chip--active {
    background: #ff3e00;
    color: #fff;
    border-color: #ff3e00;
  }
  .demo__actions {
    flex-direction: row;
    gap: 0.5em;
    margin-top: 1em;
  }
  .demo__btn {
    flex: 1;
    padding: 0.6em;
    border: 1px solid #d4d4d8;
    background: #fff;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9em;
  }
  .demo__btn--primary {
    background: #ff3e00;
    color: #fff;
    border-color: #ff3e00;
    font-weight: 600;
  }
  .demo__btn--primary:disabled { opacity: 0.5; cursor: not-allowed; }
  .demo__thumbs {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.4em;
  }
  .demo__thumb {
    padding: 0;
    aspect-ratio: 1;
    border: 2px solid transparent;
    border-radius: 4px;
    overflow: hidden;
    background: #eee;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .demo__thumb img {
    width: 100%; height: 100%; object-fit: cover; display: block;
  }
  .demo__thumb--active { border-color: #ff3e00; }
  .demo__thumb--upload {
    background: #f4f4f5;
    color: #666;
    font-size: 1.4em;
    position: relative;
  }
  .demo__thumb--upload input {
    position: absolute;
    inset: 0;
    opacity: 0;
    cursor: pointer;
  }
  .demo__preview-frame {
    width: 100%;
    /* Tighter than 4:3 so the preview section doesn't dominate the side rail. */
    aspect-ratio: 16 / 9;
    background: #222;
    border-radius: 4px;
    overflow: hidden;
  }
  .demo__output img {
    width: 100%;
    border-radius: 4px;
    display: block;
  }
</style>

<Story name="The whole picture">
  {@render demoMarkup()}
</Story>

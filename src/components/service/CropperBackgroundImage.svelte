<script lang="ts">
  import type { ClassValue } from 'svelte/elements'
  import {
    type CropperImage,
    type CropperState,
    type CropperTransitions,
    getBackgroundStyle,
  } from 'advanced-cropper'
  import { tryGetCropperContext } from '../../context.js'

  interface DesiredCropperRef {
    getState: () => CropperState | null
    getTransitions: () => CropperTransitions
    getImage: () => CropperImage | null
  }

  interface Props {
    class?: ClassValue
    /** The cropper accessor. Optional — if omitted, falls back to `getCropperContext()`. */
    cropper?: DesiredCropperRef
    /** Cross-origin mode. `true` (default) → `'anonymous'`; pass a string for `'use-credentials'`. */
    crossOrigin?: 'anonymous' | 'use-credentials' | boolean
    style?: string
  }

  let { class: className, style, cropper: cropperProp, crossOrigin = true }: Props = $props()

  const cropperFromCtx = tryGetCropperContext<DesiredCropperRef>()
  const cropper = $derived(cropperProp ?? cropperFromCtx?.())

  // Recompute the image transform on every render. The engine's getBackgroundStyle
  // produces `transform`, `width`, `height`, `transition` CSS based on the image
  // + state + active transitions.
  // (Renamed `state` → `cropperState` — svelte-check treats the bare name `state`
  // as a potential store auto-subscribe target inside an expression context.)
  const cropperState = $derived(cropper?.getState() ?? null)
  const transitions = $derived(cropper?.getTransitions() ?? { active: false, duration: 0, timingFunction: 'ease' } as CropperTransitions)
  const image = $derived(cropper?.getImage() ?? null)
  const transformStyles = $derived(
    image && cropperState ? getBackgroundStyle(image, cropperState, transitions) : null,
  )
  const src = $derived(image?.src)
  const co = $derived(crossOrigin === true ? 'anonymous' : crossOrigin || undefined)

  // Serialise the engine's style object into a CSS string so it composes with
  // the consumer's `style` prop. Keys come from getBackgroundStyle as camelCase
  // (e.g. transformOrigin); convert to kebab-case for inline style.
  const transformStyleString = $derived(
    transformStyles
      ? Object.entries(transformStyles)
          .map(([k, v]) => `${k.replace(/([A-Z])/g, '-$1').toLowerCase()}:${v}`)
          .join(';')
      : '',
  )

  function preventDefault(e: Event) {
    e.preventDefault()
  }

  let imgEl: HTMLImageElement | undefined = $state()

  /** Get the underlying `<img>` element. Used by M5's CropperCanvas.draw(). */
  export function getElement(): HTMLImageElement | undefined {
    return imgEl
  }
</script>

{#if src}
  {#key src}
    <img
      bind:this={imgEl}
      class={['advanced-cropper-background-image', className]}
      {src}
      crossorigin={co}
      alt=""
      role="presentation"
      style={[transformStyleString, style].filter(Boolean).join(';')}
      onmousedown={preventDefault}
    />
  {/key}
{/if}

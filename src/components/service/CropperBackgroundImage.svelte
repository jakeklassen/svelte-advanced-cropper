<script lang="ts">
  import type { ClassValue } from 'svelte/elements'
  import {
    type CropperImage,
    type CropperState,
    type CropperTransitions,
    getBackgroundStyle,
  } from 'advanced-cropper'

  interface DesiredCropperRef {
    getState: () => CropperState | null
    getTransitions: () => CropperTransitions
    getImage: () => CropperImage | null
  }

  interface Props {
    class?: ClassValue
    /** The cropper accessor — needs `getState`, `getTransitions`, `getImage`. (M5 migrates this to context.) */
    cropper: DesiredCropperRef
    /** Cross-origin mode. `true` (default) → `'anonymous'`; pass a string for `'use-credentials'`. */
    crossOrigin?: 'anonymous' | 'use-credentials' | boolean
    style?: string
  }

  let { class: className, style, cropper, crossOrigin = true }: Props = $props()

  // Recompute the image transform on every render. The engine's getBackgroundStyle
  // produces `transform`, `width`, `height`, `transition` CSS based on the image
  // + state + active transitions.
  // (Renamed `state` → `cropperState` — svelte-check treats the bare name `state`
  // as a potential store auto-subscribe target inside an expression context.)
  const cropperState = $derived(cropper.getState())
  const transitions = $derived(cropper.getTransitions())
  const image = $derived(cropper.getImage())
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

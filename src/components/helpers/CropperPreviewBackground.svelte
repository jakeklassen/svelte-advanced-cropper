<script lang="ts">
  import type { ClassValue } from 'svelte/elements'
  import {
    type CropperImage,
    type CropperState,
    type CropperTransitions,
    type Size,
    getPreviewStyle,
  } from 'advanced-cropper'

  interface DesiredCropperRef {
    getState: () => CropperState | null
    getTransitions: () => CropperTransitions
    getImage: () => CropperImage | null
  }

  interface Props {
    class?: ClassValue
    /** The cropper accessor — needs `getState`, `getTransitions`, `getImage`. */
    cropper: DesiredCropperRef
    /** Cross-origin mode. `true` (default) → `'anonymous'`. */
    crossOrigin?: 'anonymous' | 'use-credentials' | boolean
    /** Target preview size. Without this the image renders untransformed. */
    size?: Size | null
    style?: string
  }

  let { class: className, cropper, crossOrigin = true, size, style }: Props = $props()

  const cropperState = $derived(cropper.getState())
  const transitions = $derived(cropper.getTransitions())
  const image = $derived(cropper.getImage())

  const transformStyles = $derived(
    size && image && cropperState?.coordinates
      ? getPreviewStyle(image, cropperState, size, transitions)
      : null,
  )
  const transformStyleString = $derived(
    transformStyles
      ? Object.entries(transformStyles)
          .map(([k, v]) => `${k.replace(/([A-Z])/g, '-$1').toLowerCase()}:${v}`)
          .join(';')
      : '',
  )

  const src = $derived(image?.src)
  const co = $derived(crossOrigin === true ? 'anonymous' : crossOrigin || undefined)

  function preventDefault(e: Event) {
    e.preventDefault()
  }
</script>

{#if src}
  {#key src}
    <img
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

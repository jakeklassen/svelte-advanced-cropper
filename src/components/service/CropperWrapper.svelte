<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { ClassValue } from 'svelte/elements'
  import type { CropperState } from 'advanced-cropper'
  import CropperFade from './CropperFade.svelte'
  import { tryGetCropperContext } from '../../context.js'

  interface DesiredCropperRef {
    getState: () => CropperState | null
    isLoading: () => boolean
    isLoaded: () => boolean
  }

  interface Props {
    /** The cropper accessor. Optional — if omitted, falls back to `getCropperContext()`. */
    cropper?: DesiredCropperRef
    class?: ClassValue
    style?: string
    children?: Snippet
    /** When true, the wrapper is rendered greyed-out / non-interactive. */
    disabled?: boolean
  }

  let { cropper: cropperProp, children, class: className, style }: Props = $props()

  const cropperFromCtx = tryGetCropperContext<DesiredCropperRef>()
  const cropper = $derived(cropperProp ?? cropperFromCtx?.())

  const state = $derived(cropper ? cropper.getState() : null)
  const loaded = $derived(cropper ? cropper.isLoaded() : false)
  // CropperFade accepts `unknown` for `visible`; we pass the state object itself
  // (truthy when the cropper has a state) AND the loaded flag.
  const visible = $derived(state && loaded)
</script>

<div class={[className, 'advanced-cropper-wrapper']} {style}>
  <CropperFade {visible} class="advanced-cropper-wrapper__fade">
    {@render children?.()}
  </CropperFade>
</div>

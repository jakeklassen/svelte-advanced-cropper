<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { ClassValue } from 'svelte/elements'
  import type { CropperState } from 'advanced-cropper'
  import CropperFade from './CropperFade.svelte'

  interface DesiredCropperRef {
    getState: () => CropperState | null
    isLoading: () => boolean
    isLoaded: () => boolean
  }

  interface Props {
    /** The cropper accessor — needs `getState` and `isLoaded`. (M5 migrates this to context.) */
    cropper?: DesiredCropperRef
    class?: ClassValue
    style?: string
    children?: Snippet
    /** When true, the wrapper is rendered greyed-out / non-interactive. (Currently no visual effect — implementation lands with M5's full composition.) */
    disabled?: boolean
  }

  let { cropper, children, class: className, style }: Props = $props()

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

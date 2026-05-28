<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { ClassValue } from 'svelte/elements'
  import CropperFade from '../service/CropperFade.svelte'

  interface DesiredCropperRef {
    isLoaded: () => boolean
  }

  interface Props {
    cropper?: DesiredCropperRef
    class?: ClassValue
    style?: string
    children?: Snippet
  }

  let { children, cropper, class: className, style }: Props = $props()
</script>

<div class={[className, 'cropper-preview-wrapper']} {style}>
  <CropperFade visible={cropper?.isLoaded()} class="cropper-preview-wrapper__fade">
    {@render children?.()}
  </CropperFade>
</div>

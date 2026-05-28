<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { ClassValue } from 'svelte/elements'
  import {
    type CropperTransitions,
    type ImageTransform,
    getOptions,
  } from 'advanced-cropper'
  import TransformableImage from './TransformableImage.svelte'

  interface DesiredCropperRef {
    transformImage: (transform: ImageTransform) => void
    transformImageEnd: () => void
    getTransitions: () => CropperTransitions
  }

  interface RotateImageOptions { touch?: boolean }
  interface ScaleImageOptions { touch?: boolean; wheel?: boolean | { ratio?: number } }
  interface MoveImageOptions { touch?: boolean; mouse?: boolean }

  interface Props {
    /** The cropper accessor — needs `transformImage`, `transformImageEnd`, `getTransitions`. (M5 migrates this to context.) */
    cropper: DesiredCropperRef
    /** Enable touch-rotate. Default false. */
    rotateImage?: boolean | RotateImageOptions
    /** Enable pinch-to-scale / wheel-to-scale. Default true. */
    scaleImage?: boolean | ScaleImageOptions
    /** Enable drag-to-move the image. Default true. */
    moveImage?: boolean | MoveImageOptions
    children?: Snippet
    class?: ClassValue
    style?: string
    /** Debounce for `transformImageEnd` after wheel events, in ms. */
    timeout?: number
    /** When true, all transform gestures are no-ops. */
    disabled?: boolean
  }

  let {
    scaleImage = true,
    moveImage = true,
    rotateImage = false,
    children,
    class: className,
    style,
    cropper,
    timeout,
    disabled,
  }: Props = $props()

  // The React port wraps these in useMemo (`useMoveImageOptions`, etc.) for
  // referential stability between renders. In Svelte 5 a `$derived` gives us
  // the same memoization without the hook indirection.
  const rotateImageOptions = $derived(
    getOptions(rotateImage, { touch: true }, { touch: false }),
  )
  const scaleImageOptions = $derived(
    getOptions(
      scaleImage,
      { touch: true, wheel: { ratio: 0.1 } },
      { touch: false, wheel: false },
    ),
  )
  const moveImageOptions = $derived(
    getOptions(moveImage, { touch: true, mouse: true }, { touch: false, mouse: false }),
  )

  const transitions = $derived(cropper.getTransitions())
</script>

<TransformableImage
  class={className}
  {style}
  onTransform={cropper.transformImage}
  onTransformEnd={cropper.transformImageEnd}
  touchMove={moveImageOptions.touch}
  mouseMove={moveImageOptions.mouse}
  touchScale={scaleImageOptions.touch}
  wheelScale={scaleImageOptions.wheel}
  touchRotate={rotateImageOptions.touch}
  disabled={transitions.active || disabled}
  preventDefault={!disabled}
  {timeout}
>
  {@render children?.()}
</TransformableImage>

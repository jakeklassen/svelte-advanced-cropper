<script lang="ts">
  import type { Component, Snippet } from 'svelte'
  import type { ClassValue } from 'svelte/elements'
  import {
    type CropperImage,
    type CropperState,
    type CropperTransitions,
    type Size,
    isGreater,
    ratio,
    stretchPreviewBoundary,
  } from 'advanced-cropper'
  import StretchableBoundary from '../service/StretchableBoundary.svelte'
  import CropperPreviewBackground from './CropperPreviewBackground.svelte'
  import CropperPreviewWrapper from './CropperPreviewWrapper.svelte'

  interface DesiredCropperRef {
    getState: () => CropperState | null
    getImage: () => CropperImage | null
    getTransitions: () => CropperTransitions
    isLoading: () => boolean
    isLoaded: () => boolean
  }

  interface Props {
    /** Live cropper reference. If omitted, falls back to the explicit state/image/transitions props. */
    cropper?: DesiredCropperRef
    /** Static state (used when no cropper ref is passed). Renamed from `state` (which shadows the `$state` rune in Svelte 5). */
    cropperState?: CropperState | null
    /** Static image (used when no cropper ref is passed). */
    image?: CropperImage | null
    /** Static transitions (used when no cropper ref is passed). */
    transitions?: CropperTransitions | null
    loading?: boolean
    loaded?: boolean
    class?: ClassValue
    contentClassName?: ClassValue
    backgroundClassName?: ClassValue
    boundaryClassName?: ClassValue
    style?: string
    /** Component override for the preview background. */
    backgroundComponent?: Component<any>
    /** Component override for the boundary. */
    boundaryComponent?: Component<any>
    /** Component override for the wrapper. */
    wrapperComponent?: Component<any>
    /** Optional snippet to render extra UI inside the preview content (e.g. labels). */
    children?: Snippet
  }

  let {
    cropper,
    cropperState = null,
    image = null,
    transitions = null,
    loaded = true,
    loading = false,
    class: className,
    contentClassName,
    backgroundClassName,
    boundaryClassName,
    style,
    backgroundComponent: BackgroundComponent = CropperPreviewBackground as Component<any>,
    boundaryComponent: BoundaryComponent = StretchableBoundary as Component<any>,
    wrapperComponent: WrapperComponent = CropperPreviewWrapper as Component<any>,
    children,
  }: Props = $props()

  // Internal instance set via update(cropper). Lets a consumer swap the
  // backing cropper imperatively without re-rendering with new props.
  let internalInstance = $state<DesiredCropperRef | null>(null)

  // The active instance is the explicit `cropper` prop > `internalInstance`
  // (set via update()) > a fabricated "static" instance from the legacy
  // state/image/transitions props.
  const instance = $derived<DesiredCropperRef>(
    cropper ??
      internalInstance ?? {
        getState: () => cropperState,
        getTransitions: () =>
          transitions ?? ({ active: false, duration: 0, timingFunction: 'ease' } as CropperTransitions),
        getImage: () => image,
        isLoaded: () => loaded,
        isLoading: () => loading,
      },
  )

  const coordinates = $derived(instance.getState()?.coordinates)
  const src = $derived(instance.getImage()?.src)

  let boundaryRef = $state<ReturnType<typeof StretchableBoundary> | undefined>(undefined)
  let size = $state<Size | null>(null)

  const contentStyle = $derived(size ? `width:${size.width}px;height:${size.height}px` : '')

  export async function refresh(): Promise<void> {
    if (!boundaryRef) return
    const coords = instance.getState()?.coordinates
    if (!coords) {
      size = null
      return
    }
    const stretched = await boundaryRef.stretchTo(coords)
    if (stretched && coords) {
      size = isGreater(ratio(coords), ratio(stretched))
        ? { width: stretched.width, height: stretched.width / ratio(coords) }
        : { width: stretched.height * ratio(coords), height: stretched.height }
    } else {
      size = null
    }
  }

  /** Imperative API: swap the backing cropper. Pass null to clear. */
  export function update(c?: DesiredCropperRef | null): void {
    internalInstance = c ?? null
    refresh()
  }

  // Re-stretch when the coords change. Also wire window resize to refresh.
  $effect(() => {
    void coordinates?.width
    void coordinates?.height
    refresh()
  })

  $effect(() => {
    const handler = () => refresh()
    window.addEventListener('resize', handler)
    window.addEventListener('orientationchange', handler)
    return () => {
      window.removeEventListener('resize', handler)
      window.removeEventListener('orientationchange', handler)
    }
  })
</script>

<WrapperComponent
  class={[className, 'advanced-cropper-preview']}
  cropper={instance}
  {style}
>
  <BoundaryComponent
    bind:this={boundaryRef as any}
    stretchAlgorithm={stretchPreviewBoundary}
    class={['advanced-cropper-preview__boundary', boundaryClassName]}
  >
    <div
      class={[contentClassName, 'advanced-cropper-preview__content']}
      style={contentStyle}
    >
      {#if instance}
        <BackgroundComponent
          cropper={instance}
          {size}
          class={[
            backgroundClassName,
            'advanced-cropper-preview__image',
            src && 'advanced-cropper-preview__image--visible',
          ]}
        />
      {/if}
      {@render children?.()}
    </div>
  </BoundaryComponent>
</WrapperComponent>

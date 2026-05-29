<!-- Types live in Cropper.types.ts (dts bundler can't extract interfaces
     from .svelte module scripts). -->

<script lang="ts">
  import type { StencilSize } from 'advanced-cropper/extensions/stencil-size'
  import AbstractCropper from '../AbstractCropper.svelte'
  import FixedCropper from './FixedCropper.svelte'
  import { hybridStencilAutoZoom } from '../../deprecated/hybridAutoZoom.js'
  import type { AbstractCropperProps, AbstractCropperRef } from '../AbstractCropper.types.js'

  // Inherit AbstractCropper's surface plus the two deprecated knobs from the
  // React port that we preserve with a console warning + redirect for
  // migration ergonomics.
  interface DeprecatedSettings {
    /** @deprecated Use the FixedCropper component instead — passing this prop redirects to FixedCropper. */
    stencilSize?: StencilSize
    /** @deprecated Use the `parameters.postProcess` field instead — this prop redirects to `hybridStencilAutoZoom`. */
    autoZoom?: boolean
  }

  type Props = AbstractCropperProps & DeprecatedSettings & {
    // Pass-throughs forwarded to AbstractCropper for full API parity.
    stencilComponent?: import('svelte').Component<any>
    stencil?: import('svelte').Snippet<[{ cropper: AbstractCropperRef; image: import('advanced-cropper').CropperImage | null }]>
    stencilProps?: Record<string, unknown>
    stencilConstraints?: (settings: any, stencilOptions: any) => Partial<import('../AbstractCropper.types.js').AbstractCropperSettings>
  }

  let { stencilSize, autoZoom, parameters: parametersProp, ...rest }: Props = $props()

  // Cache deprecation warnings so they fire once per unique message per session.
  const fired = new Set<string>()
  function warn(msg: string) {
    if (fired.has(msg)) return
    fired.add(msg)
    if (typeof process === 'undefined' || process.env?.NODE_ENV !== 'production') {
      console.warn(`Deprecation warning: ${msg}`)
    }
  }

  // Compute the effective parameters object once per render. If autoZoom is
  // truthy AND there's no user-supplied postProcess AND no stencilSize, we
  // inject hybridStencilAutoZoom as the postProcess. This matches the React
  // port's Cropper.tsx logic exactly.
  const parameters = $derived.by(() => {
    if (autoZoom === undefined) return parametersProp
    if (parametersProp?.postProcess || stencilSize) {
      warn(
        `prop 'autoZoom' is deprecated and will be removed; use 'parameters.postProcess' to pass your auto zoom function.`,
      )
      return parametersProp
    }
    warn(
      `prop 'autoZoom' is deprecated and will be removed; use 'parameters.postProcess'. Defaulting to 'hybridStencilAutoZoom'.`,
    )
    return {
      ...parametersProp,
      postProcess: hybridStencilAutoZoom,
    }
  })

  // Fire the stencilSize warning as a side effect of the prop being present.
  $effect(() => {
    if (stencilSize !== undefined) {
      warn(
        `prop 'stencilSize' on <Cropper> is deprecated; use <FixedCropper> instead. Redirecting to <FixedCropper>.`,
      )
    }
  })

  // Forward every AbstractCropperRef method so `bind:this={cropperRef}` on
  // <Cropper> hands the consumer the full imperative API directly — same
  // shape as binding on <AbstractCropper>. Without this, consumers would
  // have to reach through a `.getRef()` indirection and downstream
  // components like <CropperPreview cropper={cropperRef}> would break
  // (they read `cropper.getImage()` etc directly).
  let inner = $state<AbstractCropperRef | undefined>(undefined)

  // Reset/refresh return promises; the rest are sync.
  export const reset = () => inner?.reset() ?? Promise.resolve()
  export const refresh = () => inner?.refresh() ?? Promise.resolve()
  export const clear = () => inner?.clear()
  export const setImage = (img: import('advanced-cropper').CropperImage) => inner?.setImage(img)
  export const setCoordinates: AbstractCropperRef['setCoordinates'] = (...a: unknown[]) => (inner?.setCoordinates as any)?.(...a)
  export const setState: AbstractCropperRef['setState'] = (...a: unknown[]) => (inner?.setState as any)?.(...a)
  export const moveCoordinates: AbstractCropperRef['moveCoordinates'] = (...a: unknown[]) => (inner?.moveCoordinates as any)?.(...a)
  export const moveCoordinatesEnd: AbstractCropperRef['moveCoordinatesEnd'] = (...a: unknown[]) => (inner?.moveCoordinatesEnd as any)?.(...a)
  export const resizeCoordinates: AbstractCropperRef['resizeCoordinates'] = (...a: unknown[]) => (inner?.resizeCoordinates as any)?.(...a)
  export const resizeCoordinatesEnd: AbstractCropperRef['resizeCoordinatesEnd'] = (...a: unknown[]) => (inner?.resizeCoordinatesEnd as any)?.(...a)
  export const moveImage: AbstractCropperRef['moveImage'] = (...a: unknown[]) => (inner?.moveImage as any)?.(...a)
  export const flipImage: AbstractCropperRef['flipImage'] = (...a: unknown[]) => (inner?.flipImage as any)?.(...a)
  export const zoomImage: AbstractCropperRef['zoomImage'] = (...a: unknown[]) => (inner?.zoomImage as any)?.(...a)
  export const rotateImage: AbstractCropperRef['rotateImage'] = (...a: unknown[]) => (inner?.rotateImage as any)?.(...a)
  export const transformImage: AbstractCropperRef['transformImage'] = (...a: unknown[]) => (inner?.transformImage as any)?.(...a)
  export const transformImageEnd: AbstractCropperRef['transformImageEnd'] = (...a: unknown[]) => (inner?.transformImageEnd as any)?.(...a)
  export const reconcileState: AbstractCropperRef['reconcileState'] = (...a: unknown[]) => (inner?.reconcileState as any)?.(...a)
  export const hasInteractions = () => inner?.hasInteractions() ?? false
  export const getInteractions = () => inner?.getInteractions()
  export const getCoordinates: AbstractCropperRef['getCoordinates'] = (...a: unknown[]) => (inner?.getCoordinates as any)?.(...a)
  export const getVisibleArea = () => inner?.getVisibleArea()
  export const getTransforms = () => inner?.getTransforms()
  export const getStencilCoordinates = () => inner?.getStencilCoordinates()
  export const getDefaultState = () => inner?.getDefaultState() ?? null
  export const getCanvas = (opts?: import('advanced-cropper').DrawOptions) =>
    inner?.getCanvas(opts) ?? null
  export const getSettings = () => inner?.getSettings()
  export const getState = () => inner?.getState() ?? null
  export const getTransitions = () =>
    inner?.getTransitions() ?? ({ active: false, duration: 0, timingFunction: 'ease' } as import('advanced-cropper').CropperTransitions)
  export const getImage = () => inner?.getImage() ?? null
  export const isLoading = () => inner?.isLoading() ?? false
  export const isLoaded = () => inner?.isLoaded() ?? false
</script>

{#if stencilSize !== undefined}
  <FixedCropper {stencilSize} {...rest} {parameters} bind:this={inner as any} />
{:else}
  <AbstractCropper {...rest} {parameters} bind:this={inner} />
{/if}

<!-- Types live in FixedCropper.types.ts (dts bundler can't extract
     interfaces from .svelte module scripts). -->

<script lang="ts">
  import {
    aspectRatio,
    defaultSize,
    fixedStencil,
    fixedStencilConstraints,
    sizeRestrictions,
    type StencilSize,
  } from 'advanced-cropper/extensions/stencil-size'
  import { withDefaultSizeRestrictions } from 'advanced-cropper/defaults'
  import AbstractCropper from '../AbstractCropper.svelte'
  import type {
    AbstractCropperProps,
    AbstractCropperRef,
  } from '../AbstractCropper.types.js'

  // A FixedCropper has a single locked-in stencil size — no resize handles.
  // sizeRestrictions and aspectRatio settings would be ignored, so the React
  // port omits them from the prop surface.
  type Props = Omit<AbstractCropperProps, 'settings'> & {
    stencilSize: StencilSize
    settings?: Omit<NonNullable<AbstractCropperProps['settings']>, 'sizeRestrictions' | 'aspectRatio'>
    stencilComponent?: import('svelte').Component<any>
    stencil?: import('svelte').Snippet<
      [{ cropper: AbstractCropperRef; image: import('advanced-cropper').CropperImage | null }]
    >
    stencilProps?: Record<string, unknown>
  }

  let { stencilSize, settings, parameters: parametersProp, ...rest }: Props = $props()

  // Merge in the stencil-size extension's algorithms. fixedStencil clips the
  // stencil to the locked size; fixedStencilConstraints feeds the size to
  // the engine's constraint solver.
  const mergedSettings = $derived({
    defaultSize,
    aspectRatio,
    sizeRestrictions: withDefaultSizeRestrictions(sizeRestrictions),
    stencilSize,
    ...settings,
    transformImage: {
      ...(settings?.transformImage as Record<string, unknown> | undefined),
      adjustStencil: false,
    },
  })

  const mergedParameters = $derived({
    ...parametersProp,
    // `fixedStencil` types its `settings` to FixedStencilSettings (a narrower
    // shape than AbstractCropperSettings). At runtime the engine guarantees
    // the right settings shape is passed; the cast is safe.
    postProcess: parametersProp?.postProcess ?? (fixedStencil as any),
  })

  // Forward every AbstractCropperRef method — same rationale as Cropper.svelte.
  // bind:this on <FixedCropper> hands consumers the full imperative API directly.
  let inner = $state<AbstractCropperRef | undefined>(undefined)
  export const reset = () => inner?.reset() ?? Promise.resolve()
  export const refresh = () => inner?.refresh() ?? Promise.resolve()
  export const clear = () => inner?.clear()
  export const setImage = (img: import('advanced-cropper').CropperImage) => inner?.setImage(img)
  export const setCoordinates = (...a: unknown[]) => (inner?.setCoordinates as any)?.(...a)
  export const setState = (...a: unknown[]) => (inner?.setState as any)?.(...a)
  export const moveCoordinates = (...a: unknown[]) => (inner?.moveCoordinates as any)?.(...a)
  export const moveCoordinatesEnd = (...a: unknown[]) => (inner?.moveCoordinatesEnd as any)?.(...a)
  export const resizeCoordinates = (...a: unknown[]) => (inner?.resizeCoordinates as any)?.(...a)
  export const resizeCoordinatesEnd = (...a: unknown[]) => (inner?.resizeCoordinatesEnd as any)?.(...a)
  export const moveImage = (...a: unknown[]) => (inner?.moveImage as any)?.(...a)
  export const flipImage = (...a: unknown[]) => (inner?.flipImage as any)?.(...a)
  export const zoomImage = (...a: unknown[]) => (inner?.zoomImage as any)?.(...a)
  export const rotateImage = (...a: unknown[]) => (inner?.rotateImage as any)?.(...a)
  export const transformImage = (...a: unknown[]) => (inner?.transformImage as any)?.(...a)
  export const transformImageEnd = (...a: unknown[]) => (inner?.transformImageEnd as any)?.(...a)
  export const reconcileState = (...a: unknown[]) => (inner?.reconcileState as any)?.(...a)
  export const hasInteractions = () => inner?.hasInteractions() ?? false
  export const getInteractions = () => inner?.getInteractions()
  export const getCoordinates = (...a: unknown[]) => (inner?.getCoordinates as any)?.(...a)
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

<AbstractCropper
  {...rest}
  settings={mergedSettings as any}
  parameters={mergedParameters}
  stencilConstraints={fixedStencilConstraints as any}
  bind:this={inner}
/>

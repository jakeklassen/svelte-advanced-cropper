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

  let inner = $state<AbstractCropperRef | undefined>(undefined)
  export function getRef(): AbstractCropperRef | undefined {
    return inner
  }
</script>

<AbstractCropper
  {...rest}
  settings={mergedSettings as any}
  parameters={mergedParameters}
  stencilConstraints={fixedStencilConstraints as any}
  bind:this={inner}
/>

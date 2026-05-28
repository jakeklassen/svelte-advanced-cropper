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

  // Surface the imperative API at the wrapper level too so consumers can
  // `bind:this={cropperRef}` on <Cropper> the same way they would on
  // <AbstractCropper>.
  let inner = $state<AbstractCropperRef | undefined>(undefined)
  export function getRef(): AbstractCropperRef | undefined {
    return inner
  }
</script>

{#if stencilSize !== undefined}
  <FixedCropper {stencilSize} {...rest} {parameters} bind:this={inner as any} />
{:else}
  <AbstractCropper {...rest} {parameters} bind:this={inner} />
{/if}

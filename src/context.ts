import { getContext, setContext } from 'svelte'

/**
 * The cropper instance the M5 AbstractCropper exposes to its descendants via
 * Svelte context. Components that need to read engine state or call methods
 * (e.g. RectangleStencil's resize/move, CropperBackgroundImage's transform)
 * grab the cropper via `getCropperContext()` instead of receiving it as a prop.
 *
 * The actual shape is `AbstractCropperRef` from AbstractCropper.svelte, but
 * components typically declare a narrower `DesiredCropperRef` for the subset
 * of methods they read (structural typing).
 */
export type CropperContext = () => unknown

const CROPPER_CTX_KEY = Symbol('svelte-advanced-cropper:cropper')

/**
 * Called by AbstractCropper to publish the cropper instance to descendants.
 * Pass a getter — Svelte 5 reactivity is preserved when descendants invoke it,
 * so each render sees the latest cropper state.
 */
export function setCropperContext<T>(getter: () => T): void {
  setContext(CROPPER_CTX_KEY, getter)
}

/**
 * Called by descendants of AbstractCropper to read the live cropper instance.
 * Returns the getter; invoke it to grab the current value. Throws if no
 * AbstractCropper ancestor has called `setCropperContext`.
 *
 * Usage:
 * ```ts
 * const getCropper = getCropperContext<MyCropperShape>()
 * const cropper = $derived(getCropper())
 * ```
 */
export function getCropperContext<T>(): () => T {
  const getter = getContext<(() => T) | undefined>(CROPPER_CTX_KEY)
  if (!getter) {
    throw new Error(
      'getCropperContext() called outside of an <AbstractCropper> / <Cropper> / <FixedCropper>. ' +
        'Either pass the cropper as a prop or wrap the component in one of the cropper composers.',
    )
  }
  return getter
}

/**
 * Like `getCropperContext`, but returns `undefined` if no ancestor cropper
 * exists. Useful in M1–M4 components that still accept `cropper` as a prop
 * for backwards compatibility — they prefer the prop and fall back to context.
 */
export function tryGetCropperContext<T>(): (() => T) | undefined {
  return getContext<(() => T) | undefined>(CROPPER_CTX_KEY)
}

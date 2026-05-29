<script module lang="ts">
  // Types live in AbstractCropper.types.ts (interface exports from .svelte
  // module scripts can't be picked up by the dts bundler).
  export type {
    AbstractCropperProps,
    AbstractCropperRef,
    AbstractCropperSettings,
  } from './AbstractCropper.types.js'
</script>

<script lang="ts">
  import { type Component, type Snippet } from 'svelte'
  import {
    ImageRestriction,
    createDefaultSettings,
    defaultStencilConstraints,
  } from 'advanced-cropper'
  import type {
    AbstractCropperProps,
    AbstractCropperRef,
    AbstractCropperSettings,
  } from './AbstractCropper.types.js'
  import type { DrawOptions } from 'advanced-cropper'
  import CropperBackgroundImage from './service/CropperBackgroundImage.svelte'
  import CropperBackgroundWrapper from './service/CropperBackgroundWrapper.svelte'
  import CropperCanvas from './service/CropperCanvas.svelte'
  import CropperWrapper from './service/CropperWrapper.svelte'
  import StretchableBoundary from './service/StretchableBoundary.svelte'
  import RectangleStencil from './stencils/RectangleStencil.svelte'
  import { CropperImageLoader } from '../instance/CropperImageLoader.svelte'
  import { CropperInstance } from '../instance/CropperInstance.svelte'
  import { setCropperContext } from '../context.js'

  interface Props extends AbstractCropperProps {
    /** Custom stencil component. Defaults to RectangleStencil. */
    stencilComponent?: Component<any>
    /** Snippet override for the stencil. Takes precedence over `stencilComponent`. Receives `{ cropper, image }`. */
    stencil?: Snippet<[{ cropper: AbstractCropperRef; image: import('advanced-cropper').CropperImage | null }]>
    /** Extra props forwarded to the stencil component. */
    stencilProps?: Record<string, unknown>
    /** Constraints derived from stencil + props (defaults to engine's `defaultStencilConstraints`). */
    stencilConstraints?: (settings: any, stencilOptions: any) => Partial<AbstractCropperSettings>
  }

  let {
    src,
    settings = {},
    canvas = true,
    crossOrigin = true,
    checkOrientation = true,
    autoReconcileState = true,
    unloadTime = 500,
    disabled,
    class: className,
    style,
    boundaryClassName,
    backgroundClassName,
    onChange,
    onUpdate,
    onReady,
    onError,
    onTransitionsStart,
    onTransitionsEnd,
    onInteractionStart,
    onInteractionEnd,
    parameters = {},
    backgroundWrapperProps = {},
    stencilComponent: StencilComponent = RectangleStencil as Component<any>,
    stencil: stencilSnippet,
    stencilProps = {},
    stencilConstraints = defaultStencilConstraints,
  }: Props = $props()

  // ─── DOM refs ──────────────────────────────────────────────────────────
  let boundaryRef = $state<ReturnType<typeof StretchableBoundary> | undefined>(undefined)
  let backgroundImageRef = $state<ReturnType<typeof CropperBackgroundImage> | undefined>(undefined)
  let canvasRef = $state<ReturnType<typeof CropperCanvas> | undefined>(undefined)
  // The stencil instance shape varies per StencilComponent (RectangleStencil /
  // CircleStencil / custom). We read `getAspectRatio?` if present — structural
  // access keeps this loose without coupling AbstractCropper to one stencil API.
  let stencilInstance = $state<any>(undefined)

  // ─── Image loader ──────────────────────────────────────────────────────
  const imageLoader = new CropperImageLoader(() => ({
    src,
    crossOrigin,
    checkOrientation,
    unloadTime,
    canvas,
    onError: () => {
      onError?.(api)
    },
  }))

  // ─── Engine instance ───────────────────────────────────────────────────
  // The props closure is read by the engine on every internal action;
  // it captures the live values of all reactive inputs.
  const cropper = new CropperInstance(() => {
    const userSettings = {
      imageRestriction: ImageRestriction.fitArea,
      transformImage: { adjustStencil: true },
      ...settings,
    } as any

    const stencilOpts = {
      ...stencilProps,
      ...(stencilInstance ? { aspectRatio: stencilInstance.getAspectRatio?.() } : {}),
    }

    // Merge the stencil-derived constraints (aspectRatio, etc.) INTO the
    // settings first, then build the default-settings wrappers from that
    // merged object. Order matters: createDefaultSettings produces an
    // `aspectRatio` resolver from `params.aspectRatio`, so it must see the
    // constrained value. The React port does exactly this in
    // useCropperInstance (`{ ...extendedSettings, ...createDefaultSettings(extendedSettings) }`).
    // Passing `userSettings` here instead would rebuild aspectRatio from the
    // pre-constraint settings (undefined → free aspect), silently discarding
    // the stencil's constraint — which is what broke aspect-ratio chips and
    // let the CircleStencil resize into an oval.
    const constrained = stencilConstraints(userSettings, stencilOpts)
    const extendedSettings = {
      ...userSettings,
      ...constrained,
    }

    const merged = {
      ...extendedSettings,
      ...createDefaultSettings(extendedSettings),
    }

    return {
      settings: merged,
      transitions: true,
      ...parameters,
      // Engine callbacks
      onChange,
      onUpdate: () => {
        onUpdate?.(api)
      },
      onTransitionsStart,
      onTransitionsEnd,
      onInteractionStart,
      onInteractionEnd,
      // The engine calls this with itself; we return our public API instead
      // so onReady/onUpdate/onError consumers get the AbstractCropperRef shape.
      getInstance: () => api,
    } as any
  })

  // ─── Reset / refresh sequences ─────────────────────────────────────────
  // Port of the React resetCropper / refreshCropper. Auto-reconcile pauses
  // during the async dance so a mid-flight reconcile doesn't fight with us.
  let autoReconcilePaused = $state(false)

  async function resetCropper() {
    if (!boundaryRef) return
    autoReconcilePaused = true
    const image = imageLoader.getImage()
    const boundary = await boundaryRef.stretchTo(image)
    imageLoader.setImage(image)
    if (boundary && image) {
      cropper.reset(boundary, image)
    } else {
      cropper.clear()
    }
    if (cropper.data?.state) {
      onReady?.(api)
    }
    autoReconcilePaused = false
  }

  async function refreshCropper() {
    if (!boundaryRef) return
    autoReconcilePaused = true
    const image = imageLoader.getImage()
    const boundary = await boundaryRef.stretchTo(image)
    if (boundary && image) {
      const state = cropper.getState()
      if (state) {
        if (boundary.width !== state.boundary.width || boundary.height !== state.boundary.height) {
          cropper.setBoundary(boundary)
          cropper.reconcileState()
        }
      } else {
        cropper.reset(boundary, image)
      }
    } else {
      cropper.clear()
    }
    autoReconcilePaused = false
  }

  // ─── Reactive triggers ─────────────────────────────────────────────────
  // When the loaded image changes, run the reset sequence.
  let prevImage: import('advanced-cropper').CropperImage | null = null
  $effect(() => {
    const image = imageLoader.getImage()
    if (image !== prevImage) {
      prevImage = image
      // First-mount React parity: useUpdateEffect skips first run. Here we
      // achieve the same by triggering on actual *changes* from null/something.
      // resetCropper is safe to call on first mount with a fresh image too.
      resetCropper()
    }
  })

  // Window resize → refresh
  $effect(() => {
    const handler = () => refreshCropper()
    window.addEventListener('resize', handler)
    window.addEventListener('orientationchange', handler)
    return () => {
      window.removeEventListener('resize', handler)
      window.removeEventListener('orientationchange', handler)
    }
  })

  // Auto-reconcile when idle. The React port uses `useLayoutEffect` with no
  // dependency array so it runs after every render — meaning any change to
  // settings / stencilProps / parameters triggers a reconcile that lets the
  // engine pick up the new constraints (aspect ratio, imageRestriction, …).
  // In Svelte we re-create that behavior by *reading* those props inside the
  // effect so they become tracked deps. Without this, changing aspectRatio
  // or imageRestriction at runtime is a no-op — the engine never re-evaluates.
  $effect(() => {
    settings; stencilProps; parameters
    if (!autoReconcileState || autoReconcilePaused) return
    if (cropper.data?.state && !cropper.hasInteractions()) {
      cropper.reconcileState()
    }
  })

  // ─── Reactive derived state used in the template ──────────────────────
  const stateExists = $derived(!!cropper.data?.state)
  const currentImage = $derived(imageLoader.getImage())

  // ─── Public API (consumers access via bind:this={cropperRef}) ─────────
  // Forwarders just delegate to the engine instance methods.
  export function reset() {
    return resetCropper()
  }
  export function refresh() {
    return refreshCropper()
  }
  export function clear() {
    cropper.clear()
  }
  export function setImage(image: import('advanced-cropper').CropperImage) {
    imageLoader.setImage(image)
  }
  export const setCoordinates: AbstractCropperRef['setCoordinates'] = (...args: any[]) => (cropper.setCoordinates as any)(...args)
  export const setState: AbstractCropperRef['setState'] = (...args: any[]) => (cropper.setState as any)(...args)
  export const moveCoordinates: AbstractCropperRef['moveCoordinates'] = (...args: any[]) => (cropper.moveCoordinates as any)(...args)
  export const moveCoordinatesEnd: AbstractCropperRef['moveCoordinatesEnd'] = (...args: any[]) => (cropper.moveCoordinatesEnd as any)(...args)
  export const resizeCoordinates: AbstractCropperRef['resizeCoordinates'] = (...args: any[]) => (cropper.resizeCoordinates as any)(...args)
  export const resizeCoordinatesEnd: AbstractCropperRef['resizeCoordinatesEnd'] = (...args: any[]) => (cropper.resizeCoordinatesEnd as any)(...args)
  export const moveImage: AbstractCropperRef['moveImage'] = (...args: any[]) => (cropper.moveImage as any)(...args)
  export const flipImage: AbstractCropperRef['flipImage'] = (...args: any[]) => (cropper.flipImage as any)(...args)
  export const zoomImage: AbstractCropperRef['zoomImage'] = (...args: any[]) => (cropper.zoomImage as any)(...args)
  export const rotateImage: AbstractCropperRef['rotateImage'] = (...args: any[]) => (cropper.rotateImage as any)(...args)
  export const transformImage: AbstractCropperRef['transformImage'] = (...args: any[]) => (cropper.transformImage as any)(...args)
  export const transformImageEnd: AbstractCropperRef['transformImageEnd'] = (...args: any[]) => (cropper.transformImageEnd as any)(...args)
  export const reconcileState: AbstractCropperRef['reconcileState'] = (...args: any[]) => (cropper.reconcileState as any)(...args)
  export const hasInteractions = () => cropper.hasInteractions()
  export const getInteractions = () => cropper.getInteractions()
  export const getCoordinates: AbstractCropperRef['getCoordinates'] = (...args: any[]) => (cropper.getCoordinates as any)(...args)
  export const getVisibleArea = () => cropper.getVisibleArea()
  export const getTransforms = () => cropper.getTransforms()
  export const getStencilCoordinates = () => cropper.getStencilCoordinates()
  export const getSettings = () => cropper.getSettings()
  export const getState = () => cropper.getState()
  export const getTransitions = () => cropper.getTransitions()
  export function getDefaultState() {
    const state = cropper.getState()
    const image = imageLoader.getImage()
    if (state && image) return cropper.createDefaultState(state.boundary, image)
    return null
  }
  export function getCanvas(options?: DrawOptions): HTMLCanvasElement | null {
    const state = cropper.getState()
    const imgEl = backgroundImageRef?.getElement()
    if (imgEl && canvasRef && state) {
      return canvasRef.draw(state, imgEl, options)
    }
    return null
  }
  export function getImage() {
    return imageLoader.getImage()
  }
  export function isLoading() {
    return imageLoader.isLoading()
  }
  export function isLoaded() {
    return imageLoader.isLoaded()
  }

  // Build the public API object that descendants and consumers see.
  // Methods read live engine state — context publishes the cropper as a
  // getter so descendants pick up the latest version each render.
  const api: AbstractCropperRef = {
    reset,
    refresh,
    clear,
    setImage,
    setCoordinates,
    setState,
    moveCoordinates,
    moveCoordinatesEnd,
    resizeCoordinates,
    resizeCoordinatesEnd,
    moveImage,
    flipImage,
    zoomImage,
    rotateImage,
    transformImage,
    transformImageEnd,
    reconcileState,
    hasInteractions,
    getInteractions,
    getCoordinates,
    getVisibleArea,
    getTransforms,
    getStencilCoordinates,
    getDefaultState,
    getCanvas,
    getSettings,
    getState,
    getTransitions,
    getImage,
    isLoading,
    isLoaded,
  }

  // Publish to descendants. Use a getter so reads pick up the latest api
  // object (in case we ever reassign — currently we don't, but safer).
  setCropperContext(() => api)
</script>

<!-- 'advanced-cropper' class is load-bearing — the engine SCSS makes it
     `display: flex; flex-direction: column; max-height: 100%; overflow: hidden`
     which is what lets the boundary's `flex-grow: 1` fill the container.
     Without this, a cropper given an explicit parent height (e.g. 520px)
     overflows because the wrapper isn't a flex container. -->
<CropperWrapper cropper={api} class={['advanced-cropper', className]} {style}>
  <StretchableBoundary
    bind:this={boundaryRef}
    class={['advanced-cropper__boundary', boundaryClassName]}
  >
    <!-- 'advanced-cropper__background-wrapper' is load-bearing: the engine SCSS
         makes it `position: absolute; inset: 0` so the gesture container fills
         the whole boundary. Without it the TransformableImage div collapses to
         the image's box, so drag-to-move only registers on the image pixels and
         not the letterbox/dark regions — image panning appears dead. (Class is
         applied AFTER the spread so it always wins; any caller class merges in.) -->
    <CropperBackgroundWrapper
      cropper={api}
      {disabled}
      {...backgroundWrapperProps}
      class={['advanced-cropper__background-wrapper', (backgroundWrapperProps as Record<string, unknown>).class as import('svelte/elements').ClassValue]}
    >
      {#if stateExists}
        <CropperBackgroundImage
          bind:this={backgroundImageRef}
          cropper={api}
          {crossOrigin}
          class={['advanced-cropper__background', backgroundClassName]}
        />
      {/if}
      {#if stencilSnippet}
        {@render stencilSnippet({ cropper: api, image: currentImage })}
      {:else}
        <StencilComponent
          {...stencilProps}
          {disabled}
          bind:this={stencilInstance}
          cropper={api}
          image={currentImage}
        />
      {/if}
    </CropperBackgroundWrapper>
    {#if canvas}
      <CropperCanvas bind:this={canvasRef} />
    {/if}
  </StretchableBoundary>
</CropperWrapper>

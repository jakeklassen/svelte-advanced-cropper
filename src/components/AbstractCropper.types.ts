import type {
  AbstractCropperInstanceCallbacks,
  AbstractCropperInstanceParameters,
  Coordinates,
  CoordinatesTransform,
  CoreSettings,
  CropperImage,
  CropperInteractions,
  CropperState,
  CropperTransitions,
  DefaultSettings,
  DrawOptions,
  ImageTransform,
  InitializeSettings,
  ModifierSettings,
  MoveDirections,
  ResizeAnchor,
  Rotate,
  Scale,
  Transforms,
  VisibleArea,
} from 'advanced-cropper'
import type { ClassValue } from 'svelte/elements'

export type AbstractCropperSettings = DefaultSettings &
  CoreSettings &
  ModifierSettings &
  InitializeSettings

// Option bags accepted by the engine's mutating methods. Mirrors the
// (unexported) option interfaces on AbstractCropperInstance; kept local so the
// public types don't depend on the engine's internal module shape.
interface TransitionOptions {
  transitions?: boolean
}
interface InteractionOptions {
  interaction?: boolean
}
interface ImmediatelyOptions {
  immediately?: boolean
}
interface NormalizeOptions {
  normalize?: boolean
}
interface PostprocessOptions {
  postprocess?: boolean
}
/** Common option bag for image/coordinate transforms. */
type TransformOptions = InteractionOptions & ImmediatelyOptions & NormalizeOptions & TransitionOptions

/** Functional state updater accepted by `setState`. */
type StateModifier = (state: CropperState | null, settings: CoreSettings) => CropperState | null

/**
 * The public imperative API exposed via `bind:this` on `<AbstractCropper>`.
 * Mirrors the React port's `AbstractCropperRef` (the interface returned by
 * `useAbstractCropper`).
 */
export interface AbstractCropperRef {
  /** Re-run the full reset sequence (re-stretch boundary, recompute default state). */
  reset: () => Promise<void>
  /** Re-stretch the boundary and reconcile if its size changed. */
  refresh: () => Promise<void>
  clear: () => void
  setImage: (image: CropperImage) => void
  setCoordinates: (
    transforms: CoordinatesTransform | CoordinatesTransform[],
    options?: ImmediatelyOptions & TransitionOptions,
  ) => void
  setState: (
    modifier: CropperState | StateModifier | null,
    options?: TransitionOptions & ImmediatelyOptions & InteractionOptions & PostprocessOptions,
  ) => void
  moveCoordinates: (directions: Partial<MoveDirections>, options?: TransformOptions) => void
  moveCoordinatesEnd: (options?: ImmediatelyOptions & TransitionOptions) => void
  resizeCoordinates: (
    anchor: ResizeAnchor,
    directions: Partial<MoveDirections>,
    parameters?: unknown,
    options?: TransformOptions,
  ) => void
  resizeCoordinatesEnd: (options?: ImmediatelyOptions & TransitionOptions) => void
  moveImage: (left: number, top?: number, options?: TransformOptions) => void
  flipImage: (horizontal?: boolean, vertical?: boolean, options?: TransformOptions) => void
  zoomImage: (scale: Scale | number, options?: TransformOptions) => void
  rotateImage: (rotate: number | Rotate, options?: TransformOptions) => void
  transformImage: (transform: ImageTransform, options?: TransformOptions) => void
  transformImageEnd: (options?: ImmediatelyOptions & TransitionOptions) => void
  reconcileState: (options?: TransitionOptions) => void
  hasInteractions: () => boolean
  getInteractions: () => CropperInteractions
  getCoordinates: (options?: { round?: boolean }) => Coordinates | null
  getVisibleArea: () => VisibleArea | null
  getTransforms: () => Transforms
  getStencilCoordinates: () => Coordinates
  getDefaultState: () => CropperState | null
  getCanvas: (options?: DrawOptions) => HTMLCanvasElement | null
  getSettings: () => AbstractCropperSettings
  getImage: () => CropperImage | null
  getState: () => CropperState | null
  getTransitions: () => CropperTransitions
  isLoading: () => boolean
  isLoaded: () => boolean
}

export interface AbstractCropperProps {
  /** Image URL to load and crop. */
  src?: string | null
  /** Engine settings (passed to AbstractCropperInstance). */
  settings?: Partial<AbstractCropperSettings> & Record<string, unknown>
  /** Whether to mount a CropperCanvas (needed for getCanvas()). Default true. */
  canvas?: boolean
  /** `true` (default) → 'anonymous'. Required for canvas export of cross-origin images. */
  crossOrigin?: 'anonymous' | 'use-credentials' | boolean
  /** Check EXIF orientation when loading the image. Default true. */
  checkOrientation?: boolean
  /** Auto-reconcile the engine state when the cropper isn't being interacted with. Default true. */
  autoReconcileState?: boolean
  /** ms to wait before clearing the image when src becomes null/undefined (so it can fade out). Default 500. */
  unloadTime?: number
  /** Disable interactions; renders the cropper as-is. */
  disabled?: boolean
  class?: ClassValue
  style?: string
  boundaryClassName?: ClassValue
  backgroundClassName?: ClassValue

  /** Engine callbacks (proxied to AbstractCropperInstance). */
  onChange?: AbstractCropperInstanceCallbacks['onChange']
  onUpdate?: (cropper: AbstractCropperRef) => void
  onReady?: (cropper: AbstractCropperRef) => void
  onError?: (cropper: AbstractCropperRef) => void
  onTransitionsStart?: AbstractCropperInstanceCallbacks['onTransitionsStart']
  onTransitionsEnd?: AbstractCropperInstanceCallbacks['onTransitionsEnd']
  onInteractionStart?: AbstractCropperInstanceCallbacks['onInteractionStart']
  onInteractionEnd?: AbstractCropperInstanceCallbacks['onInteractionEnd']

  /** Extra parameters forwarded to the engine instance (postProcess, etc.). */
  parameters?: Partial<AbstractCropperInstanceParameters<AbstractCropperSettings>>

  /**
   * Pass-through props for the inner `CropperBackgroundWrapper` — escape
   * hatch for gesture toggles like `scaleImage`, `moveImage`, `rotateImage`
   * without needing to swap the wrapper component entirely.
   */
  backgroundWrapperProps?: Record<string, unknown>
}

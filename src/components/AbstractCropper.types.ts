import type {
  AbstractCropperInstanceCallbacks,
  AbstractCropperInstanceParameters,
  CoreSettings,
  CropperImage,
  CropperState,
  CropperTransitions,
  DefaultSettings,
  DrawOptions,
  InitializeSettings,
  ModifierSettings,
} from 'advanced-cropper'
import type { ClassValue } from 'svelte/elements'

export type AbstractCropperSettings = DefaultSettings &
  CoreSettings &
  ModifierSettings &
  InitializeSettings

/**
 * The public imperative API exposed via `bind:this` on `<AbstractCropper>`.
 * Mirrors the React port's `AbstractCropperRef` (the interface returned by
 * `useAbstractCropper`).
 */
export interface AbstractCropperRef {
  reset: () => Promise<void>
  refresh: () => Promise<void>
  clear: () => void
  setImage: (image: CropperImage) => void
  setCoordinates: (...args: unknown[]) => void
  setState: (...args: unknown[]) => void
  moveCoordinates: (...args: unknown[]) => void
  moveCoordinatesEnd: (...args: unknown[]) => void
  resizeCoordinates: (...args: unknown[]) => void
  resizeCoordinatesEnd: (...args: unknown[]) => void
  moveImage: (...args: unknown[]) => void
  flipImage: (...args: unknown[]) => void
  zoomImage: (...args: unknown[]) => void
  rotateImage: (...args: unknown[]) => void
  transformImage: (...args: unknown[]) => void
  transformImageEnd: (...args: unknown[]) => void
  reconcileState: (...args: unknown[]) => void
  hasInteractions: () => boolean
  getInteractions: () => unknown
  getCoordinates: (...args: unknown[]) => unknown
  getVisibleArea: () => unknown
  getTransforms: () => unknown
  getStencilCoordinates: () => unknown
  getDefaultState: () => CropperState | null
  getCanvas: (options?: DrawOptions) => HTMLCanvasElement | null
  getSettings: () => unknown
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
}

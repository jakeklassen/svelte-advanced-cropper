// ─── Top-level consumer components ────────────────────────────────────
export { default as Cropper } from './components/croppers/Cropper.svelte'
export type { CropperProps, CropperRef } from './components/croppers/Cropper.types.js'
export { default as FixedCropper } from './components/croppers/FixedCropper.svelte'
export type {
  FixedCropperSettings,
  FixedCropperRef,
} from './components/croppers/FixedCropper.types.js'
export { default as AbstractCropper } from './components/AbstractCropper.svelte'
export type {
  AbstractCropperProps,
  AbstractCropperRef,
  AbstractCropperSettings,
} from './components/AbstractCropper.types.js'

// ─── Stencils (M4) ────────────────────────────────────────────────────
export { default as RectangleStencil } from './components/stencils/RectangleStencil.svelte'
export { default as CircleStencil } from './components/stencils/CircleStencil.svelte'

// ─── Stencil sub-parts (M4) ───────────────────────────────────────────
export { default as BoundingBox } from './components/service/BoundingBox.svelte'
export type { HandlerProps, LineProps } from './components/service/BoundingBox.types.js'
export { default as SimpleHandler } from './components/handlers/SimpleHandler.svelte'
export { default as SimpleLine } from './components/lines/SimpleLine.svelte'

// ─── Service components ───────────────────────────────────────────────
export { default as CropperFade } from './components/service/CropperFade.svelte'
export { default as StencilOverlay } from './components/service/StencilOverlay.svelte'
export { default as StencilGrid } from './components/service/StencilGrid.svelte'
export { default as StencilWrapper } from './components/service/StencilWrapper.svelte'
export { default as HandlerWrapper } from './components/service/HandlerWrapper.svelte'
export { default as LineWrapper } from './components/service/LineWrapper.svelte'
export { default as ArtificialTransition } from './components/service/ArtificialTransition.svelte'
export { default as CropperWrapper } from './components/service/CropperWrapper.svelte'
export { default as CropperBackgroundWrapper } from './components/service/CropperBackgroundWrapper.svelte'
export { default as CropperBackgroundImage } from './components/service/CropperBackgroundImage.svelte'
export { default as CropperCanvas } from './components/service/CropperCanvas.svelte'
export { default as CropperSource } from './components/service/CropperSource.svelte'
export { default as StretchableBoundary } from './components/service/StretchableBoundary.svelte'

// ─── Gestures (M3) ────────────────────────────────────────────────────
export { default as DraggableElement } from './components/service/DraggableElement.svelte'
// DraggableArea is the React port's alias for DraggableElement.
export { default as DraggableArea } from './components/service/DraggableElement.svelte'
export {
  default as TransformableImage,
  TransformableImageEvent,
} from './components/service/TransformableImage.svelte'

// ─── Preview helpers (M6) ─────────────────────────────────────────────
export { default as CropperPreview } from './components/helpers/CropperPreview.svelte'
export { default as CropperPreviewBackground } from './components/helpers/CropperPreviewBackground.svelte'
export { default as CropperPreviewWrapper } from './components/helpers/CropperPreviewWrapper.svelte'

// ─── Engine integration (M5) ──────────────────────────────────────────
export { CropperInstance } from './instance/CropperInstance.svelte'
export { CropperImageLoader } from './instance/CropperImageLoader.svelte'
export {
  getCropperContext,
  setCropperContext,
  tryGetCropperContext,
  type CropperContext,
} from './context.js'

// ─── Deprecated (M6) ──────────────────────────────────────────────────
export {
  hybridStencilAutoZoom,
  hybridStencilAutoZoomAlgorithm,
} from './deprecated/hybridAutoZoom.js'

// ─── Engine re-exports ────────────────────────────────────────────────
// Match the React port: pass-through the engine's public API so consumers
// don't need to `pnpm add advanced-cropper` separately.
export * from 'advanced-cropper'
export * from 'advanced-cropper/defaults'
export * from 'advanced-cropper/algorithms'
export * from 'advanced-cropper/image'
export * from 'advanced-cropper/canvas'
export * from 'advanced-cropper/service'
export * from 'advanced-cropper/state'

export type { StencilSize } from 'advanced-cropper/extensions/stencil-size'

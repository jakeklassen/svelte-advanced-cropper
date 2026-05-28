// Primitives (M1)
export { default as CropperFade } from './components/service/CropperFade.svelte'
export { default as StencilOverlay } from './components/service/StencilOverlay.svelte'
export { default as StencilGrid } from './components/service/StencilGrid.svelte'
export { default as StencilWrapper } from './components/service/StencilWrapper.svelte'
export { default as HandlerWrapper } from './components/service/HandlerWrapper.svelte'
export { default as LineWrapper } from './components/service/LineWrapper.svelte'
export { default as SimpleHandler } from './components/handlers/SimpleHandler.svelte'
export { default as SimpleLine } from './components/lines/SimpleLine.svelte'

// Boundary layer (M2)
export { default as CropperSource } from './components/service/CropperSource.svelte'
export { default as CropperCanvas } from './components/service/CropperCanvas.svelte'
export { default as CropperBackgroundImage } from './components/service/CropperBackgroundImage.svelte'
export { default as CropperBackgroundWrapper } from './components/service/CropperBackgroundWrapper.svelte'
export { default as CropperWrapper } from './components/service/CropperWrapper.svelte'
export { default as StretchableBoundary } from './components/service/StretchableBoundary.svelte'

// Gestures (M3)
export { default as DraggableElement } from './components/service/DraggableElement.svelte'
// DraggableArea is the React port's alias for DraggableElement (1-LOC re-export).
export { default as DraggableArea } from './components/service/DraggableElement.svelte'
export { default as TransformableImage, TransformableImageEvent } from './components/service/TransformableImage.svelte'

// Stencils + BoundingBox (M4)
export { default as BoundingBox } from './components/service/BoundingBox.svelte'
export type { HandlerProps, LineProps } from './components/service/BoundingBox.types.js'
export { default as RectangleStencil } from './components/stencils/RectangleStencil.svelte'
export { default as CircleStencil } from './components/stencils/CircleStencil.svelte'

// Stub remaining for M6
export { default as ArtificialTransition } from './components/service/ArtificialTransition.svelte'

// Re-export the engine surface (decision 5, issue #1)
export * from 'advanced-cropper'

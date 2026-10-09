// Stencils
export {
	default as RectangleStencil,
	type RectangleStencilProps
} from './components/stencils/RectangleStencil.svelte';
export {
	default as CircleStencil,
	type CircleStencilProps
} from './components/stencils/CircleStencil.svelte';

// Service components
export {
	default as BoundingBox,
	type BoundingBoxProps,
	type HandlerClassNames,
	type LineClassNames
} from './components/service/BoundingBox.svelte';
export {
	default as CropperSource,
	type CropperSourceProps
} from './components/service/CropperSource.svelte';
export {
	default as StretchableBoundary,
	type StretchableBoundaryMethods,
	type StretchableBoundaryProps
} from './components/service/StretchableBoundary.svelte';
export {
	default as CropperWrapper,
	type CropperWrapperProps
} from './components/service/CropperWrapper.svelte';
export { default as StencilOverlay } from './components/service/StencilOverlay.svelte';
export { default as StencilWrapper } from './components/service/StencilWrapper.svelte';
export {
	default as StencilGrid,
	type StencilGridProps
} from './components/service/StencilGrid.svelte';
export {
	default as DraggableArea,
	type DraggableElementProps as DraggableAreaProps
} from './components/service/DraggableElement.svelte';
export {
	default as TransformableImage,
	type TransformableImageProps
} from './components/service/TransformableImage.svelte';
export { TransformableImageEvent } from './components/service/TransformableImageEvent';
export { default as CropperFade } from './components/service/CropperFade.svelte';
export {
	default as CropperBackgroundImage,
	type CropperBackgroundImageProps
} from './components/service/CropperBackgroundImage.svelte';
export {
	default as CropperBackgroundWrapper,
	type CropperBackgroundWrapperProps
} from './components/service/CropperBackgroundWrapper.svelte';
export {
	default as HandlerWrapper,
	type HandlerWrapperProps
} from './components/service/HandlerWrapper.svelte';
export {
	default as LineWrapper,
	type LineWrapperProps
} from './components/service/LineWrapper.svelte';

// Preview
export {
	default as CropperPreview,
	type CropperPreviewProps,
	type CropperPreviewInstance,
	type CropperPreviewSource
} from './components/helpers/CropperPreview.svelte';
export {
	default as CropperPreviewBackground,
	type CropperPreviewBackgroundProps
} from './components/helpers/CropperPreviewBackground.svelte';
export {
	default as CropperPreviewWrapper,
	type CropperPreviewWrapperProps
} from './components/helpers/CropperPreviewWrapper.svelte';

// Lines and handlers
export { default as SimpleLine } from './components/lines/SimpleLine.svelte';
export { default as SimpleHandler } from './components/handlers/SimpleHandler.svelte';

export type {
	CropperSettings,
	SettingsExtension,
	CropperSettingsInput,
	CropperProps,
	FixedCropperProps,
	CropperInstance,
	FixedCropperInstance,
	FixedCropperSettings,
	StencilConstraints,
	CropperCallback,
	CropperCallbacks,
	MoveImageOptions,
	ScaleImageOptions,
	RotateImageOptions
} from './types';
export { getCropperContext, type CropperContext } from './context/cropper';
export { default as Cropper } from './components/croppers/Cropper.svelte';
export { default as FixedCropper } from './components/croppers/FixedCropper.svelte';
export { styleToString } from './service/style';
export { fillLayoutBoundary } from './service/boundary';
export * from 'advanced-cropper';
export type { StencilOptions } from './types';
export type { StencilSize } from 'advanced-cropper/extensions/stencil-size';
export {
	normalizeMoveImageOptions,
	type NormalizedMoveImageOptions
} from './controllers/normalizeMoveImageOptions';
export {
	normalizeScaleImageOptions,
	type NormalizedScaleImageOptions
} from './controllers/normalizeScaleImageOptions';
export {
	normalizeRotateImageOptions,
	type NormalizedRotateImageOptions
} from './controllers/normalizeRotateImageOptions';

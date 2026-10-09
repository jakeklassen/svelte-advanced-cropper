// Croppers
export { default as Cropper } from './components/croppers/Cropper.svelte';
export { default as FixedCropper } from './components/croppers/FixedCropper.svelte';

// Stencils
export {
	default as RectangleStencil,
	type RectangleStencilProps
} from './components/stencils/RectangleStencil.svelte';
export {
	default as CircleStencil,
	type CircleStencilProps
} from './components/stencils/CircleStencil.svelte';

// Context
export { getCropperContext, type CropperContext } from './context/cropper';

// Stencil building blocks
export {
	default as BoundingBox,
	type BoundingBoxProps
} from './components/primitives/BoundingBox.svelte';
export { default as StencilOverlay } from './components/primitives/StencilOverlay.svelte';
export { default as StencilWrapper } from './components/primitives/StencilWrapper.svelte';
export {
	default as StencilGrid,
	type StencilGridProps
} from './components/primitives/StencilGrid.svelte';
export {
	default as HandlerWrapper,
	type HandlerWrapperProps
} from './components/primitives/HandlerWrapper.svelte';
export {
	default as LineWrapper,
	type LineWrapperProps
} from './components/primitives/LineWrapper.svelte';
export {
	default as SimpleHandler,
	type SimpleHandlerProps
} from './components/handlers/SimpleHandler.svelte';
export { default as SimpleLine, type SimpleLineProps } from './components/lines/SimpleLine.svelte';

// Layers
export {
	default as CropperSource,
	type CropperSourceProps
} from './components/layers/CropperSource.svelte';
export {
	default as StretchableBoundary,
	type StretchableBoundaryProps
} from './components/layers/StretchableBoundary.svelte';
export {
	default as CropperWrapper,
	type CropperWrapperProps
} from './components/layers/CropperWrapper.svelte';
export { default as CropperFade } from './components/layers/CropperFade.svelte';
export {
	default as CropperBackgroundImage,
	type CropperBackgroundImageProps
} from './components/layers/CropperBackgroundImage.svelte';
export {
	default as CropperBackgroundWrapper,
	type CropperBackgroundWrapperProps
} from './components/layers/CropperBackgroundWrapper.svelte';

// Gestures
export {
	default as DraggableArea,
	type DraggableAreaProps
} from './components/gestures/DraggableArea.svelte';
export {
	default as TransformableImage,
	type TransformableImageProps
} from './components/gestures/TransformableImage.svelte';
export { TransformableImageEvent } from './components/gestures/TransformableImageEvent';

// Preview
export {
	default as CropperPreview,
	type CropperPreviewProps,
	type CropperPreviewInstance,
	type CropperPreviewSource
} from './components/preview/CropperPreview.svelte';
export {
	default as CropperPreviewBackground,
	type CropperPreviewBackgroundProps
} from './components/preview/CropperPreviewBackground.svelte';
export {
	default as CropperPreviewWrapper,
	type CropperPreviewWrapperProps
} from './components/preview/CropperPreviewWrapper.svelte';

// Types
export type {
	CropperSettings,
	SettingsExtension,
	CropperSettingsInput,
	CropperProps,
	FixedCropperProps,
	CropperInstance,
	FixedCropperInstance,
	FixedCropperSettings,
	StencilOptions,
	StencilConstraints,
	CropperCallback,
	CropperCallbacks,
	MoveImageOptions,
	ScaleImageOptions,
	RotateImageOptions,
	PartProps,
	CrossOrigin,
	BoundaryHandle,
	RegisterBoundary,
	BackgroundElement,
	AttachBackgroundSource,
	CropperWrapperSnippetProps,
	CropperBoundarySnippetProps,
	CropperBackgroundWrapperSnippetProps,
	CropperBackgroundSnippetProps,
	CropperPreviewWrapperSnippetProps,
	CropperPreviewBoundarySnippetProps,
	CropperPreviewBackgroundSnippetProps,
	HandlerSnippetProps,
	LineSnippetProps,
	NativeMoveEvent
} from './types';

// Utilities
export { styleToString } from './service/style';
export { fillLayoutBoundary } from './service/boundary';
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

// Core re-export
export * from 'advanced-cropper';
export type { StencilSize } from 'advanced-cropper/extensions/stencil-size';

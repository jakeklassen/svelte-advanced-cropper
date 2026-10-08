// Public API. Mirrors react-advanced-cropper's src/index.ts; see docs/study/00-index.md
// for the React → Svelte mapping.

// Croppers
export {
	default as Cropper,
	type CropperProps,
	type CropperRef
} from './components/croppers/Cropper.svelte';
export {
	default as FixedCropper,
	type FixedCropperProps,
	type FixedCropperRef,
	type FixedCropperSettings
} from './components/croppers/FixedCropper.svelte';
// Not exported upstream, but `useAbstractCropper`'s types depend on it and it is the
// base for custom croppers.
export { default as AbstractCropper } from './components/AbstractCropper.svelte';
export type {
	AbstractCropperProps,
	AbstractCropperIntrinsicProps,
	AbstractCropperRef,
	AbstractCropperSettings,
	AbstractCropperSettingsProp
} from './components/AbstractCropper.types';

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
	type HandlerComponent,
	type HandlerComponentProps,
	type HandlerClassNames,
	type LineComponent,
	type LineComponentProps,
	type LineClassNames
} from './components/service/BoundingBox.svelte';
export {
	default as CropperCanvas,
	type CropperCanvasMethods
} from './components/service/CropperCanvas.svelte';
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
	default as DraggableElement,
	default as DraggableArea,
	type DraggableElementProps
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
	default as ArtificialTransition,
	type ArtificialTransitionProps
} from './components/service/ArtificialTransition.svelte';
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
	type CropperPreviewRef,
	type CropperPreviewDesiredCropperRef,
	type PreviewWrapperComponent,
	type PreviewBackgroundComponent
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

// Types
export * from './types';

// Hooks
export {
	useAbstractCropper,
	type AbstractCropperHookProps,
	type AbstractCropperRefs
} from './hooks/useAbstractCropper.svelte';
export {
	useCropperInstance,
	type CropperInstanceSettings,
	type CropperInstanceSettingsProp,
	type CropperStateHook
} from './hooks/useCropperInstance.svelte';
export {
	useCropperImage,
	type CropperImageHook,
	type CropperImageHookSettings
} from './hooks/useCropperImage.svelte';
export { useMoveImageOptions, type DefinedMoveImageOptions } from './hooks/useMoveImageOptions';
export { useScaleImageOptions, type DefinedScaleImageOptions } from './hooks/useScaleImageOptions';
export {
	useRotateImageOptions,
	type DefinedRotateImageOptions
} from './hooks/useRotateImageOptions';
export { useUpdateEffect } from './hooks/useUpdateEffect.svelte';
export { useWindowResize } from './hooks/useWindowResize.svelte';

// Svelte-specific helper: the core returns camelCase style objects (React's format);
// custom backgrounds use this to turn them into style strings.
export { styleToString } from './service/style';

// The default boundary size algorithm: the layout size, unaffected by CSS transforms.
export { fillLayoutBoundary } from './service/boundary';

// Instance
export { CropperInstance, type CropperInstanceProps } from './instance/CropperInstance.svelte';

// Core. Upstream also re-exports the core subpaths (`/defaults`, `/state`, ...) and
// lists a few utils explicitly to disambiguate them; the root entry already re-exports
// all of them, and importing only the root avoids loading the core twice under SSR.
export * from 'advanced-cropper';

export type { StencilSize } from 'advanced-cropper/extensions/stencil-size';

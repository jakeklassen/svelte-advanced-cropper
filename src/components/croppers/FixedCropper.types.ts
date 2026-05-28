import type { StencilSize } from 'advanced-cropper/extensions/stencil-size'

export interface FixedCropperSettings {
  stencilSize: StencilSize<FixedCropperSettings>
}

export type { AbstractCropperRef as FixedCropperRef } from '../AbstractCropper.types.js'

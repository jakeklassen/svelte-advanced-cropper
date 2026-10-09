import { createContext } from 'svelte';
import type { CropperImage } from 'advanced-cropper';
import type { CropperInstance, StencilOptions } from '../types';

export interface CropperContext {
	readonly cropper: CropperInstance;
	readonly disabled: boolean;
	readonly image: CropperImage | null;
	registerStencil(getOptions: () => StencilOptions): () => void;
}
const [readContext, provideCropperContext] = createContext<CropperContext>();
export { provideCropperContext };
export function getCropperContext(): CropperContext {
	try {
		return readContext();
	} catch {
		throw new Error('getCropperContext must be called inside a Cropper or FixedCropper.');
	}
}

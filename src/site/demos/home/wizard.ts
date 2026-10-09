import type { ImageRestriction } from 'svelte-advanced-cropper';

export interface WizardSettings {
	aspectRatio?: number;
	minAspectRatio?: number;
	maxAspectRatio?: number;
	imageRestriction?: ImageRestriction;
	stencilType?: 'rectangle' | 'circle';
	minWidth?: number;
	maxWidth?: number;
	minHeight?: number;
	maxHeight?: number;
	scaleImage?: boolean;
	grid?: boolean;
}

export type CropperKey = 'default-cropper' | 'mobile-cropper' | 'fixed-cropper';

/** Groups of settings a cropper supports in the settings panel. */
export type SettingsGroup =
	| 'aspectRatio'
	| 'imageRestriction'
	| 'stencil'
	| 'size'
	| 'scaleImage'
	| 'grid';

export interface CropperDescription {
	key: CropperKey;
	name: string;
	description: string;
	link?: { href: string; label: string };
	features: string[];
	settings: SettingsGroup[];
}

import type { Component, Snippet } from 'svelte';
import type { ClassValue } from 'svelte/elements';
import type {
	AbstractCropperIntrinsicProps,
	AbstractCropperRef,
	AbstractCropperSettings
} from './components/AbstractCropper.types';

export type ArbitraryProps = Record<string, any>;

// Upstream types these as `any` so that any stencil, boundary or background
// component can be passed. Here they are any Svelte component: they receive the
// documented props, but the props are not type-checked.
export type StencilComponent = Component<any, any, any>;

export interface CropperWrapperComponentProps {
	cropper: any;
	class?: ClassValue;
	style?: string;
	children?: Snippet;
	disabled?: boolean;
	/** @deprecated use `cropper.isLoading()` */
	loading?: boolean;
	/** @deprecated use `cropper.isLoaded()` */
	loaded?: boolean;
}

export type CropperWrapperComponent = Component<CropperWrapperComponentProps>;

export type CropperBoundaryComponent = Component<any, any, any>;

export type CropperBackgroundComponent = Component<any, any, any>;

export interface CropperBackgroundWrapperComponentProps {
	cropper: any;
	children?: Snippet;
	class?: ClassValue;
	style?: string;
	disabled?: boolean;
}

export type CropperBackgroundWrapperComponent = Component<CropperBackgroundWrapperComponentProps>;

export type StencilOptions = Record<string, unknown>;

export type StencilConstraints<Settings extends {}> = (
	settings: Settings,
	stencilOptions: StencilOptions
) => Partial<Settings>;

export interface ScaleImageOptions {
	touch?: boolean;
	wheel?:
		| boolean
		| {
				ratio?: number;
		  };
	adjustStencil?: boolean;
}

export interface RotateImageOptions {
	touch?: boolean;
}

export interface MoveImageOptions {
	touch?: boolean;
	mouse?: boolean;
}

export type CustomCropperProps<Extension extends SettingsExtension = {}> =
	AbstractCropperIntrinsicProps<ExtendedSettings<Extension>> &
		Partial<Pick<ExtendedSettings<Extension>, keyof AbstractCropperSettings>> &
		Omit<ExtendedSettings<Extension>, keyof AbstractCropperSettings>;

export type CustomCropperRef<Extension extends SettingsExtension = {}> = AbstractCropperRef<
	ExtendedSettings<Extension>
>;

export type ExtendedSettings<Extension extends {} = {}> = Extension & AbstractCropperSettings;

export type SettingsExtension = object;

import type { Component, Snippet } from 'svelte';
import type { ClassValue } from 'svelte/elements';
import type {
	AbstractCropperInstance,
	AbstractCropperInstanceParameters,
	AbstractCropperInstanceCallbacks,
	CoreSettings,
	DefaultSettings,
	DefaultSettingsParams,
	ModifierSettings,
	InitializeSettings,
	CropperImage,
	CropperState,
	CropperTransitions,
	DrawOptions,
	RawAspectRatio
} from 'advanced-cropper';
import type { BoundingBoxType } from 'advanced-cropper/extensions/fit-to-image';
import type { StencilSize } from 'advanced-cropper/extensions/stencil-size';
import type { StretchableBoundaryProps } from './components/service/StretchableBoundary.svelte';
import type { StretchableBoundaryMethods } from './components/service/methods';
import type { CropperBackgroundImageProps } from './components/service/CropperBackgroundImage.svelte';
import type { CropperBackgroundWrapperProps } from './components/service/CropperBackgroundWrapper.svelte';

export type SettingsExtension = object;
export type CropperSettings<E extends SettingsExtension = {}> = DefaultSettings &
	CoreSettings &
	ModifierSettings &
	InitializeSettings &
	E;
type BuiltinSettingsInput<E extends SettingsExtension> = Omit<
	Partial<CropperSettings>,
	keyof DefaultSettingsParams<CropperSettings<E>>
> &
	DefaultSettingsParams<CropperSettings<E>>;
export type CropperSettingsInput<E extends SettingsExtension = {}> = BuiltinSettingsInput<E> &
	Partial<E>;
type EngineMethods = AbstractCropperInstance<CropperSettings>;
export interface CropperInstance<E extends SettingsExtension = {}> {
	reset: () => Promise<void>;
	refresh: () => Promise<void>;
	clear: () => void;
	setCoordinates: EngineMethods['setCoordinates'];
	setState: EngineMethods['setState'];
	setImage: (image: CropperImage) => void;
	flipImage: EngineMethods['flipImage'];
	zoomImage: EngineMethods['zoomImage'];
	rotateImage: EngineMethods['rotateImage'];
	reconcileState: EngineMethods['reconcileState'];
	moveImage: EngineMethods['moveImage'];
	moveCoordinates: EngineMethods['moveCoordinates'];
	moveCoordinatesEnd: EngineMethods['moveCoordinatesEnd'];
	resizeCoordinates: EngineMethods['resizeCoordinates'];
	resizeCoordinatesEnd: EngineMethods['resizeCoordinatesEnd'];
	transformImage: EngineMethods['transformImage'];
	transformImageEnd: EngineMethods['transformImageEnd'];
	setVisibleArea: EngineMethods['setVisibleArea'];
	startTransitions: EngineMethods['startTransitions'];
	hasInteractions: EngineMethods['hasInteractions'];
	getInteractions: EngineMethods['getInteractions'];
	getCoordinates: EngineMethods['getCoordinates'];
	getVisibleArea: EngineMethods['getVisibleArea'];
	getTransforms: EngineMethods['getTransforms'];
	getStencilCoordinates: EngineMethods['getStencilCoordinates'];
	getDefaultState: () => CropperState | null;
	getCanvas: (options?: DrawOptions) => HTMLCanvasElement | null;
	getSettings: () => CropperSettings<E>;
	getImage: () => CropperImage | null;
	getState: () => CropperState | null;
	getTransitions: () => CropperTransitions;
	isLoading: () => boolean;
	isLoaded: () => boolean;
}
export interface StencilOptions {
	aspectRatio?: RawAspectRatio | (() => RawAspectRatio);
	boundingBox?: BoundingBoxType;
	[key: string]: unknown;
}
export type StencilConstraints<E extends SettingsExtension = {}> = (
	settings: CropperSettingsInput<E>,
	options: Readonly<StencilOptions>
) => Partial<CropperSettingsInput<E>>;
export type CropperCallback<E extends SettingsExtension = {}> = (
	cropper: CropperInstance<E>
) => void;
export interface CropperCallbacks<E extends SettingsExtension = {}> extends Omit<
	AbstractCropperInstanceCallbacks<CropperInstance<E>>,
	'getInstance'
> {
	onReady?: CropperCallback<E>;
	onError?: CropperCallback<E>;
}
export interface CropperSettingProps<E extends SettingsExtension = {}> {
	transformImage?: BuiltinSettingsInput<E>['transformImage'];
	moveCoordinates?: BuiltinSettingsInput<E>['moveCoordinates'];
	resizeCoordinates?: BuiltinSettingsInput<E>['resizeCoordinates'];
	defaultCoordinates?: BuiltinSettingsInput<E>['defaultCoordinates'];
	defaultVisibleArea?: BuiltinSettingsInput<E>['defaultVisibleArea'];
	areaPositionRestrictions?: BuiltinSettingsInput<E>['areaPositionRestrictions'];
	areaSizeRestrictions?: BuiltinSettingsInput<E>['areaSizeRestrictions'];
	sizeRestrictions?: BuiltinSettingsInput<E>['sizeRestrictions'];
	positionRestrictions?: BuiltinSettingsInput<E>['positionRestrictions'];
	aspectRatio?: BuiltinSettingsInput<E>['aspectRatio'];
	minWidth?: BuiltinSettingsInput<E>['minWidth'];
	minHeight?: BuiltinSettingsInput<E>['minHeight'];
	maxWidth?: BuiltinSettingsInput<E>['maxWidth'];
	maxHeight?: BuiltinSettingsInput<E>['maxHeight'];
	defaultSize?: BuiltinSettingsInput<E>['defaultSize'];
	defaultPosition?: BuiltinSettingsInput<E>['defaultPosition'];
	defaultTransforms?: BuiltinSettingsInput<E>['defaultTransforms'];
	imageRestriction?: BuiltinSettingsInput<E>['imageRestriction'];
	priority?: BuiltinSettingsInput<E>['priority'];
}
export const settingPropNames = {
	transformImage: true,
	moveCoordinates: true,
	resizeCoordinates: true,
	defaultCoordinates: true,
	defaultVisibleArea: true,
	areaPositionRestrictions: true,
	areaSizeRestrictions: true,
	sizeRestrictions: true,
	positionRestrictions: true,
	aspectRatio: true,
	minWidth: true,
	minHeight: true,
	maxWidth: true,
	maxHeight: true,
	defaultSize: true,
	defaultPosition: true,
	defaultTransforms: true,
	imageRestriction: true,
	priority: true
} satisfies Record<keyof CropperSettingProps, true>;
export interface CropperProps<E extends SettingsExtension = {}>
	extends
		CropperSettingProps<E>,
		AbstractCropperInstanceParameters<CropperSettings<E>>,
		CropperCallbacks<E> {
	settings?: E & { [K in keyof CropperSettingProps]?: never };
	src?: string | null;
	canvas?: boolean;
	checkOrientation?: boolean;
	crossOrigin?: boolean | 'anonymous' | 'use-credentials';
	unloadTime?: number;
	autoReconcileState?: boolean;
	disabled?: boolean;
	class?: ClassValue;
	style?: string;
	children?: Snippet;
	moveImage?: boolean | MoveImageOptions;
	scaleImage?: boolean | ScaleImageOptions;
	rotateImage?: boolean | RotateImageOptions;
	stencilConstraints?: StencilConstraints<E>;
	wrapperComponent?: CropperWrapperComponent;
	wrapperProps?: Partial<CropperWrapperComponentProps>;
	backgroundComponent?: Component<CropperBackgroundImageProps>;
	backgroundProps?: Partial<CropperBackgroundImageProps>;
	backgroundClassName?: ClassValue;
	backgroundWrapperComponent?: Component<CropperBackgroundWrapperProps>;
	backgroundWrapperProps?: Partial<CropperBackgroundWrapperProps>;
	backgroundWrapperClassName?: ClassValue;
	boundaryComponent?: Component<StretchableBoundaryProps, StretchableBoundaryMethods>;
	boundaryProps?: Partial<StretchableBoundaryProps>;
	boundaryClassName?: ClassValue;
}
export interface FixedCropperSettings {
	stencilSize: StencilSize<this>;
}
export type FixedCropperInstance<E extends SettingsExtension = {}> = CropperInstance<
	E & FixedCropperSettings
>;
export type FixedCropperProps<E extends SettingsExtension = {}> = Omit<
	CropperProps<E & FixedCropperSettings>,
	'settings' | 'aspectRatio' | 'sizeRestrictions'
> & {
	settings?: E & { [K in keyof CropperSettingProps | 'stencilSize']?: never };
	stencilSize: StencilSize<CropperSettings<E & FixedCropperSettings>>;
};
export interface CropperWrapperComponentProps {
	cropper: CropperInstance;
	class?: ClassValue;
	style?: string;
	children?: Snippet;
	disabled?: boolean;
}
export type CropperWrapperComponent = Component<CropperWrapperComponentProps>;
export interface CropperBackgroundWrapperComponentProps {
	cropper: CropperInstance;
	children?: Snippet;
	class?: ClassValue;
	style?: string;
	disabled?: boolean;
}
export type ArbitraryProps = Record<string, unknown>;
export interface ScaleImageOptions {
	touch?: boolean;
	wheel?:
		| boolean
		| {
				ratio?: number;
		  };
}

export interface RotateImageOptions {
	touch?: boolean;
}

export interface MoveImageOptions {
	touch?: boolean;
	mouse?: boolean;
}

export type CropperBoundaryComponent = Component<
	StretchableBoundaryProps,
	StretchableBoundaryMethods
>;

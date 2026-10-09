import type { Attachment } from 'svelte/attachments';
import type {
	BoundarySizeAlgorithm,
	BoundaryStretchAlgorithm,
	Size,
	OrdinalDirection,
	CardinalDirection,
	HorizontalCardinalDirection,
	VerticalCardinalDirection,
	MoveDirections,
	Coordinates,
	DefaultTransforms
} from 'advanced-cropper';
import type { NormalizedMoveImageOptions } from './controllers/normalizeMoveImageOptions';
import type { NormalizedScaleImageOptions } from './controllers/normalizeScaleImageOptions';
import type { NormalizedRotateImageOptions } from './controllers/normalizeRotateImageOptions';
import type { CropperPreviewSource } from './components/helpers/CropperPreview.svelte';

import type { Snippet } from 'svelte';
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

export type SettingsExtension = object;
export type CropperSettings<E extends SettingsExtension = {}> = DefaultSettings &
	CoreSettings &
	ModifierSettings &
	InitializeSettings &
	E;
type BuiltinSettingsInput<E extends SettingsExtension> = Omit<
	Partial<CropperSettings>,
	keyof DefaultSettingsParams<CropperSettings<E>> | 'defaultTransforms'
> &
	Omit<DefaultSettingsParams<CropperSettings<E>>, 'defaultCoordinates'> & {
		defaultTransforms?: DefaultTransforms<CropperSettings<E>>;
		defaultCoordinates?:
			| Partial<Coordinates>
			| null
			| CoordinateUpdate<E>[]
			| {
					update(
						state: CropperState,
						settings: CropperSettings<E>
					): CoordinateUpdate<E> | CoordinateUpdate<E>[];
			  }['update'];
	};
export type CropperSettingsInput<E extends SettingsExtension = {}> = BuiltinSettingsInput<E> &
	Partial<E>;
type CoordinateUpdate<E extends SettingsExtension> =
	| Partial<Coordinates>
	| null
	| ((state: CropperState, settings: CropperSettings<E>) => Partial<Coordinates> | null);
type EngineMethods = AbstractCropperInstance<CropperSettings>;
export interface CropperInstance<E extends SettingsExtension = {}> {
	reset: () => Promise<void>;
	refresh: () => Promise<void>;
	clear: () => void;
	setCoordinates: (
		transforms: CoordinateUpdate<E> | CoordinateUpdate<E>[],
		options?: Parameters<EngineMethods['setCoordinates']>[1]
	) => void;
	setState: (
		modifier:
			| CropperState
			| null
			| ((state: CropperState | null, settings: CropperSettings<E>) => CropperState | null),
		options?: Parameters<EngineMethods['setState']>[1]
	) => void;
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
	wrapper?: Snippet<[CropperWrapperSnippetProps<E>]>;
	boundary?: Snippet<[CropperBoundarySnippetProps<E>]>;
	backgroundWrapper?: Snippet<[CropperBackgroundWrapperSnippetProps<E>]>;
	background?: Snippet<[CropperBackgroundSnippetProps<E>]>;
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

export interface PartProps {
	class?: ClassValue;
	style?: string;
}
export type CrossOrigin = boolean | 'anonymous' | 'use-credentials';
export interface BoundaryHandle {
	stretchTo(size: Size | null): Promise<Size | null>;
	reset(): void;
}
export type RegisterBoundary = (boundary: BoundaryHandle) => () => void;
export type BackgroundElement = HTMLImageElement | HTMLCanvasElement;
export type AttachBackgroundSource = (ready?: Promise<void>) => Attachment<BackgroundElement>;
export interface CropperWrapperSnippetProps<E extends SettingsExtension = {}> extends PartProps {
	cropper: CropperInstance<E>;
	disabled: boolean;
	children: Snippet;
}
export interface CropperBoundarySnippetProps<
	E extends SettingsExtension = {}
> extends CropperWrapperSnippetProps<E> {
	registerBoundary: RegisterBoundary;
	sizeAlgorithm: BoundarySizeAlgorithm;
	stretchAlgorithm: BoundaryStretchAlgorithm;
}
export interface CropperBackgroundWrapperSnippetProps<
	E extends SettingsExtension = {}
> extends CropperWrapperSnippetProps<E> {
	moveImage: NormalizedMoveImageOptions;
	scaleImage: NormalizedScaleImageOptions;
	rotateImage: NormalizedRotateImageOptions;
}
export interface CropperBackgroundSnippetProps<E extends SettingsExtension = {}> extends PartProps {
	cropper: CropperInstance<E>;
	disabled: boolean;
	crossOrigin: CrossOrigin;
	attachSource: AttachBackgroundSource;
}
export interface CropperPreviewWrapperSnippetProps extends PartProps {
	preview: CropperPreviewSource;
	children: Snippet;
}
export interface CropperPreviewBoundarySnippetProps extends CropperPreviewWrapperSnippetProps {
	registerBoundary: RegisterBoundary;
	sizeAlgorithm: BoundarySizeAlgorithm;
	stretchAlgorithm: BoundaryStretchAlgorithm;
}
export interface CropperPreviewBackgroundSnippetProps extends PartProps {
	preview: CropperPreviewSource;
	size: Size | null;
	crossOrigin: CrossOrigin;
}
export type NativeMoveEvent = MouseEvent | TouchEvent;
export interface HandlerSnippetProps extends PartProps {
	position: OrdinalDirection;
	horizontalPosition: HorizontalCardinalDirection | null;
	verticalPosition: VerticalCardinalDirection | null;
	disabled: boolean;
	onMove: (shift: MoveDirections, event: NativeMoveEvent) => void;
	onMoveEnd: () => void;
}
export interface LineSnippetProps extends PartProps {
	position: CardinalDirection;
	disabled: boolean;
	onMove: (shift: MoveDirections, event: NativeMoveEvent) => void;
	onMoveEnd: () => void;
}

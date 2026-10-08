import type { ClassValue } from 'svelte/elements';
import type {
	CoreSettings,
	CropperImage,
	CropperState,
	CropperTransitions,
	DefaultSettings,
	DrawOptions,
	InitializeSettings,
	ModifierSettings
} from 'advanced-cropper';
import type {
	ArbitraryProps,
	CropperBackgroundComponent,
	CropperBackgroundWrapperComponent,
	CropperBoundaryComponent,
	CropperWrapperComponent,
	StencilComponent,
	StencilConstraints
} from '../types';
import type { AbstractCropperHookProps } from '../hooks/useAbstractCropper.svelte';
import type {
	CropperInstanceSettings,
	CropperInstanceSettingsProp,
	CropperStateHook
} from '../hooks/useCropperInstance.svelte';

export type AbstractCropperSettingsProp<Settings extends CropperInstanceSettings> =
	CropperInstanceSettingsProp<Settings>;

export type AbstractCropperSettings = DefaultSettings &
	CoreSettings &
	ModifierSettings &
	InitializeSettings;

export interface AbstractCropperRef<
	Settings extends AbstractCropperSettings = AbstractCropperSettings
> {
	reset: () => Promise<void>;
	refresh: () => Promise<void>;
	clear: () => void;
	setCoordinates: CropperStateHook['setCoordinates'];
	setState: CropperStateHook['setState'];
	setImage: (image: CropperImage) => void;
	flipImage: CropperStateHook['flipImage'];
	zoomImage: CropperStateHook['zoomImage'];
	rotateImage: CropperStateHook['rotateImage'];
	reconcileState: CropperStateHook['reconcileState'];
	moveImage: CropperStateHook['moveImage'];
	moveCoordinates: CropperStateHook['moveCoordinates'];
	moveCoordinatesEnd: CropperStateHook['moveCoordinatesEnd'];
	resizeCoordinates: CropperStateHook['resizeCoordinates'];
	resizeCoordinatesEnd: CropperStateHook['resizeCoordinatesEnd'];
	transformImage: CropperStateHook['transformImage'];
	transformImageEnd: CropperStateHook['transformImageEnd'];
	setVisibleArea: CropperStateHook['setVisibleArea'];
	startTransitions: CropperStateHook['startTransitions'];
	hasInteractions: CropperStateHook['hasInteractions'];
	getInteractions: CropperStateHook['getInteractions'];
	getCoordinates: CropperStateHook['getCoordinates'];
	getVisibleArea: CropperStateHook['getVisibleArea'];
	getTransforms: CropperStateHook['getTransforms'];
	getStencilCoordinates: CropperStateHook['getStencilCoordinates'];
	getDefaultState: () => CropperState | null;
	getCanvas: (options?: DrawOptions) => HTMLCanvasElement | null;
	getSettings: () => Settings;
	getImage: () => CropperImage | null;
	getState: () => CropperState | null;
	getTransitions: () => CropperTransitions;
	isLoading: () => boolean;
	isLoaded: () => boolean;
}

export interface AbstractCropperProps<Settings extends AbstractCropperSettings> extends Omit<
	AbstractCropperHookProps<Settings>,
	'settings'
> {
	backgroundComponent?: CropperBackgroundComponent;
	backgroundProps?: ArbitraryProps;
	backgroundClassName?: ClassValue;
	backgroundWrapperComponent?: CropperBackgroundWrapperComponent;
	backgroundWrapperProps?: ArbitraryProps;
	backgroundWrapperClassName?: ClassValue;
	wrapperComponent?: CropperWrapperComponent;
	wrapperProps?: ArbitraryProps;
	stencilComponent?: StencilComponent;
	stencilProps?: ArbitraryProps;
	stencilConstraints?: StencilConstraints<AbstractCropperSettingsProp<Settings>>;
	/** Upstream `className`. */
	class?: ClassValue;
	boundaryComponent?: CropperBoundaryComponent;
	boundaryProps?: ArbitraryProps;
	boundaryClassName?: ClassValue;
	style?: string;
	settings: CropperInstanceSettingsProp<Settings>;
	disabled?: boolean;
}

export type AbstractCropperIntrinsicProps<Settings extends AbstractCropperSettings> = Omit<
	AbstractCropperProps<Settings>,
	'settings'
>;

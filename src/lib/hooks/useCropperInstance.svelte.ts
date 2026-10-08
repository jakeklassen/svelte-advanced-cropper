import {
	ImageRestriction,
	createDefaultSettings,
	type AbstractCropperInstanceCallbacks,
	type AbstractCropperInstanceParameters,
	type AbstractCropperInstanceSettings,
	type DefaultSettings
} from 'advanced-cropper';
import { CropperInstance } from '../instance/CropperInstance.svelte';

export type CropperInstanceSettings = DefaultSettings & AbstractCropperInstanceSettings;

export type CropperInstanceSettingsProp<Settings extends CropperInstanceSettings> = Partial<
	Pick<Settings, keyof CropperInstanceSettings>
> &
	Omit<Settings, keyof CropperInstanceSettings>;

/**
 * Creates a reactive `CropperInstance`. `props` is read lazily every time the core
 * needs settings or callbacks, so it always sees the latest values. This replaces
 * upstream's `usePersistentFunction` + `useForceRerender` pair.
 */
export function useCropperInstance<Settings extends CropperInstanceSettings, Instance = unknown>(
	props: () => AbstractCropperInstanceParameters<Settings> &
		AbstractCropperInstanceCallbacks<Instance> & {
			settings?: CropperInstanceSettingsProp<Settings>;
		}
) {
	const getProps = () => {
		const { settings, ...parameters } = props();

		const extendedSettings = {
			imageRestriction: ImageRestriction.fitArea,
			transformImage: {
				adjustStencil: true
			},
			...settings
		};

		const extendedParameters = {
			transitions: true,
			...parameters
		};

		return {
			settings: {
				...extendedSettings,
				...createDefaultSettings<Settings>(extendedSettings)
			} as Settings,
			...extendedParameters
		};
	};

	return new CropperInstance<Settings, Instance>(getProps);
}

export type CropperStateHook = ReturnType<typeof useCropperInstance>;

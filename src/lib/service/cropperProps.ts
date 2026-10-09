import {
	settingPropNames,
	type CropperProps,
	type CropperSettingProps,
	type SettingsExtension
} from '../types';

function isSettingName(key: string): key is keyof CropperSettingProps {
	return Object.hasOwn(settingPropNames, key);
}

export function collectSettings<E extends SettingsExtension>(
	props: CropperProps<E>
): CropperSettingProps<E> {
	const settings: CropperSettingProps<E> = {};
	// The generic key preserves the correlation between each prop and its value.
	// oxlint-disable-next-line typescript/no-unnecessary-type-parameters
	function copy<K extends keyof CropperSettingProps<E>>(key: K) {
		if (props[key] !== undefined) {
			settings[key] = props[key];
		}
	}

	for (const key in settingPropNames) {
		if (isSettingName(key)) {
			copy(key);
		}
	}

	return settings;
}

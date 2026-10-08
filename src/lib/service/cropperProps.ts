import type { CoreSettings, DefaultSettings, ModifierSettings } from 'advanced-cropper';
import type { ExtendedSettings, SettingsExtension } from '../types';
import type { AbstractCropperIntrinsicProps } from '../components/AbstractCropper.types';

/** The flat cropper props that are core settings, routed into the `settings` object. */
export const settingPropNames = [
	'transformImage',
	'moveCoordinates',
	'resizeCoordinates',
	'defaultCoordinates',
	'defaultVisibleArea',
	'areaPositionRestrictions',
	'areaSizeRestrictions',
	'sizeRestrictions',
	'positionRestrictions',
	'aspectRatio',
	'minWidth',
	'minHeight',
	'maxWidth',
	'maxHeight',
	'defaultSize',
	'defaultPosition',
	'defaultTransforms',
	'imageRestriction',
	'priority'
];

/** Splits flat cropper props into core settings and the remaining component props. */
export function splitCropperProps<Extension extends SettingsExtension>(
	props: Record<string, unknown>,
	settingNames: string[] = settingPropNames
) {
	const settings: Record<string, unknown> = {};
	const componentProps: Record<string, unknown> = {};
	for (const [key, value] of Object.entries(props)) {
		if (settingNames.includes(key)) {
			settings[key] = value;
		} else {
			componentProps[key] = value;
		}
	}

	return { settings, props: componentProps } as unknown as {
		settings: Extension & Partial<DefaultSettings & CoreSettings & ModifierSettings>;
		props: AbstractCropperIntrinsicProps<ExtendedSettings<Extension>>;
	};
}

import type { CoreSettings, DefaultSettings, ModifierSettings } from 'advanced-cropper';
import type { ExtendedSettings, SettingsExtension } from '../types';
import type { AbstractCropperIntrinsicProps } from '../components/AbstractCropper.types';
import { defaultSettings } from '../service/constants';

type Props<Extension extends SettingsExtension> = AbstractCropperIntrinsicProps<
	ExtendedSettings<Extension>
>;

/** Splits flat cropper props into core settings and component props. */
export function useAbstractCropperProps<Extension extends SettingsExtension>(
	props: Record<string, unknown>,
	settings: string[] = defaultSettings
) {
	const result: { settings: Record<string, unknown>; props: Record<string, unknown> } = {
		settings: {},
		props: {}
	};

	for (const key of Object.keys(props)) {
		if (settings.includes(key)) {
			result.settings[key] = props[key];
		} else {
			result.props[key] = props[key];
		}
	}

	return result as unknown as {
		settings: Extension & Partial<DefaultSettings & CoreSettings & ModifierSettings>;
		props: Props<Extension>;
	};
}

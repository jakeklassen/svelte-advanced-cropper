import {
	createDefaultSettings,
	defaultStencilConstraints,
	ImageRestriction
} from 'advanced-cropper';
import type {
	CropperProps,
	CropperSettings,
	SettingsExtension,
	StencilOptions,
	CropperSettingsInput
} from '../types';
import { collectSettings } from '../service/cropperProps';

export function normalizeSettings<E extends SettingsExtension>(
	props: CropperProps<E>,
	options: StencilOptions
): CropperSettings<E> {
	const extension: Partial<E> = props.settings ?? {};
	const raw: CropperSettingsInput<E> = {
		imageRestriction: ImageRestriction.fitArea,
		...extension,
		...collectSettings(props),
		transformImage: { adjustStencil: true, ...props.transformImage }
	};
	const constrained = {
		...raw,
		...(props.stencilConstraints ?? defaultStencilConstraints)(raw, options)
	};

	return {
		...constrained,
		...createDefaultSettings<CropperSettings<E>>(constrained)
	} as CropperSettings<E>;
}

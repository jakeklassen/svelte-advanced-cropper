import {
	createDefaultSettings,
	defaultStencilConstraints,
	ImageRestriction,
	type CropperState
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

	const coordinates = constrained.defaultCoordinates;
	const defaultCoordinates =
		coordinates === undefined
			? undefined
			: (state: CropperState, settings: CropperSettings<E>) => {
					const updates =
						typeof coordinates === 'function' ? coordinates(state, settings) : coordinates;

					return (Array.isArray(updates) ? updates : [updates]).map((update) =>
						typeof update === 'function'
							? (current: CropperState) => update(current, settings)
							: update
					);
				};

	return {
		...constrained,
		...createDefaultSettings<CropperSettings<E>>({ ...constrained, defaultCoordinates })
	} as CropperSettings<E>;
}

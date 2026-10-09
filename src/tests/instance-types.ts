import type { CropperInstance, CropperProps, FixedCropperInstance } from '#lib';

interface PrintSettings {
	dpi: number;
	product: 'print';
}
export function verifyInstance(
	instance: CropperInstance<PrintSettings>,
	fixed: FixedCropperInstance<PrintSettings>
) {
	const dpi: number = instance.getSettings().dpi;
	const product: 'print' = fixed.getSettings().product;
	instance.setCoordinates({ width: dpi });
	instance.setCoordinates((state) => ({ width: (state.coordinates?.width ?? 0) / 2 }));
	instance.setCoordinates([{ width: 100 }, { left: 20 }]);
	// @ts-expect-error Extension settings retain their declared type.
	const invalid: string = instance.getSettings().dpi;
	// @ts-expect-error Coordinates must be numeric.
	instance.setCoordinates({ width: '100' });
	// @ts-expect-error Unknown coordinate fields are rejected.
	instance.setCoordinates({ banana: 10 });
	// @ts-expect-error A coordinate transform must return coordinates.
	instance.setCoordinates(() => 'wrong');
	// @ts-expect-error Built-in settings cannot be overridden through extensions.
	const settings: CropperProps<{ minWidth: string }> = { settings: { minWidth: 'wrong' } };

	return { dpi, product, invalid, settings };
}

export const printProps: CropperProps<PrintSettings> = {
	settings: { dpi: 300, product: 'print' },
	defaultCoordinates: (_state, settings) => {
		const dpi: number = settings.dpi;
		// @ts-expect-error Extension values remain numeric in coordinate defaults.
		const invalid: string = settings.dpi;
		void invalid;

		return [{ width: dpi }, (_current, currentSettings) => ({ height: currentSettings.dpi })];
	},
	defaultSize: (_state, settings) => ({ width: settings.dpi, height: settings.dpi }),
	defaultPosition: (_state, settings) => ({ left: settings.dpi, top: settings.dpi }),
	defaultVisibleArea: (_state, settings) => ({
		left: 0,
		top: 0,
		width: settings.dpi,
		height: settings.dpi
	}),
	aspectRatio: (_state, settings) => settings.dpi,
	sizeRestrictions: (_state, settings) => ({
		minWidth: settings.dpi,
		minHeight: 0,
		maxWidth: Infinity,
		maxHeight: Infinity
	}),
	defaultTransforms: (_state, settings) => {
		const dpi: number = settings.dpi;
		// @ts-expect-error Extension values are numeric.
		const invalid: string = settings.dpi;
		// @ts-expect-error Unknown settings are rejected.
		void settings.missing;
		void invalid;

		return { rotate: dpi };
	}
};
export function verifyCallbacks(
	instance: CropperInstance<PrintSettings>,
	fixed: FixedCropperInstance<PrintSettings>
) {
	instance.setCoordinates((_state, settings) => {
		const dpi: number = settings.dpi;
		// @ts-expect-error Extension values are numeric.
		const invalid: string = settings.dpi;
		void invalid;

		return { width: dpi };
	});
	instance.setState((state, settings) => {
		const dpi: number = settings.dpi;
		// @ts-expect-error Unknown settings are rejected.
		void settings.missing;
		void dpi;

		return state;
	});
	fixed.setCoordinates([(_state, settings) => ({ width: settings.dpi })]);
}

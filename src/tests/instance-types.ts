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

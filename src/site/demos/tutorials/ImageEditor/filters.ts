/** Each adjustment is in [-1, 1]; 0 leaves the image unchanged. */
export interface Adjustments {
	brightness: number;
	contrast: number;
	saturation: number;
	hue: number;
}

function getFilter({ brightness, contrast, saturation, hue }: Adjustments): string {
	return [
		`brightness(${100 + brightness * 100}%)`,
		`contrast(${100 + contrast * 100}%)`,
		`saturate(${100 + saturation * 100}%)`,
		`hue-rotate(${hue * 360}deg)`
	].join(' ');
}

// Chrome and Firefox support `CanvasRenderingContext2D.filter`. Safari only has it
// behind a feature flag, so it gets the per-pixel fallback below.
const filterSupported =
	typeof CanvasRenderingContext2D !== 'undefined' && 'filter' in CanvasRenderingContext2D.prototype;

/** Draws `image` into `canvas` at its natural size, with the adjustments applied. */
export function drawAdjustedImage(
	canvas: HTMLCanvasElement,
	image: HTMLImageElement,
	adjustments: Adjustments
) {
	const ctx = canvas.getContext('2d');
	if (!ctx) {
		return;
	}

	canvas.width = image.naturalWidth;
	canvas.height = image.naturalHeight;

	if (filterSupported) {
		ctx.filter = getFilter(adjustments);
		ctx.drawImage(image, 0, 0);
	} else {
		ctx.drawImage(image, 0, 0);
		applyAdjustments(ctx, canvas.width, canvas.height, adjustments);
	}
}

const clamp = (value: number) => Math.min(255, Math.max(0, value));

/** Multiplies a colour by a 3×3 matrix. */
function multiply(m: number[], [r, g, b]: number[]) {
	return [
		clamp(m[0] * r + m[1] * g + m[2] * b),
		clamp(m[3] * r + m[4] * g + m[5] * b),
		clamp(m[6] * r + m[7] * g + m[8] * b)
	];
}

/**
 * The same filters, computed by hand with the formulas from the CSS Filter Effects
 * spec, applied in the same order as `getFilter()`.
 */
function applyAdjustments(
	ctx: CanvasRenderingContext2D,
	width: number,
	height: number,
	{ brightness, contrast, saturation, hue }: Adjustments
) {
	if (!width || !height) {
		return;
	}

	const brightnessFactor = 1 + brightness;
	const contrastFactor = 1 + contrast;
	const saturationFactor = 1 + saturation;
	// prettier-ignore
	const saturate = [
		0.213 + 0.787 * saturationFactor, 0.715 - 0.715 * saturationFactor, 0.072 - 0.072 * saturationFactor,
		0.213 - 0.213 * saturationFactor, 0.715 + 0.285 * saturationFactor, 0.072 - 0.072 * saturationFactor,
		0.213 - 0.213 * saturationFactor, 0.715 - 0.715 * saturationFactor, 0.072 + 0.928 * saturationFactor
	];
	const cos = Math.cos(hue * 2 * Math.PI);
	const sin = Math.sin(hue * 2 * Math.PI);
	// prettier-ignore
	const rotate = [
		0.213 + cos * 0.787 - sin * 0.213, 0.715 - cos * 0.715 - sin * 0.715, 0.072 - cos * 0.072 + sin * 0.928,
		0.213 - cos * 0.213 + sin * 0.143, 0.715 + cos * 0.285 + sin * 0.14, 0.072 - cos * 0.072 - sin * 0.283,
		0.213 - cos * 0.213 - sin * 0.787, 0.715 - cos * 0.715 + sin * 0.715, 0.072 + cos * 0.928 + sin * 0.072
	];

	const imageData = ctx.getImageData(0, 0, width, height);
	const { data } = imageData;
	for (let i = 0; i < data.length; i += 4) {
		let rgb = [data[i], data[i + 1], data[i + 2]].map((value) =>
			clamp((clamp(value * brightnessFactor) - 127.5) * contrastFactor + 127.5)
		);
		rgb = multiply(rotate, multiply(saturate, rgb));
		data[i] = rgb[0];
		data[i + 1] = rgb[1];
		data[i + 2] = rgb[2];
	}

	ctx.putImageData(imageData, 0, 0);
}

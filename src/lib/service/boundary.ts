import type { Size } from 'advanced-cropper';

const toNumber = (value: string) => {
	const number = Number.parseFloat(value);

	return Number.isFinite(number) ? number : 0;
};

/**
 * The boundary's layout size: its border box, as `getBoundingClientRect()` reports it,
 * but without CSS transforms.
 *
 * The advanced-cropper core's `fillBoundary` measures with `getBoundingClientRect()`, which includes the
 * transforms of every ancestor. The cropper positions everything inside the boundary in
 * untransformed CSS pixels, so a scaled ancestor (a dialog that scales in, a scaled
 * container) made it size the crop area wrongly. The computed style is the layout size and
 * keeps sub-pixel precision, unlike `clientWidth`.
 */
export function fillLayoutBoundary(boundary: HTMLElement): Size {
	const style = getComputedStyle(boundary);
	let width = toNumber(style.width);
	let height = toNumber(style.height);
	if (style.boxSizing !== 'border-box') {
		width +=
			toNumber(style.paddingLeft) +
			toNumber(style.paddingRight) +
			toNumber(style.borderLeftWidth) +
			toNumber(style.borderRightWidth);
		height +=
			toNumber(style.paddingTop) +
			toNumber(style.paddingBottom) +
			toNumber(style.borderTopWidth) +
			toNumber(style.borderBottomWidth);
	}

	return { width, height };
}

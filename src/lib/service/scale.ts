import { isObject, type ImageTransform, type Point } from 'advanced-cropper';
import { fillLayoutBoundary } from './boundary';

/** How much an element is scaled on screen, horizontally and vertically. */
export interface ScreenScale {
	x: number;
	y: number;
}

/**
 * How much the CSS transforms of an element's ancestors scale it on screen: its on-screen
 * size divided by its layout size. 1 when nothing scales it.
 *
 * Pointer events report screen pixels, while the cropper positions everything in the
 * container's untransformed pixels, so gestures divide their distances by this. Only
 * scaling is handled; rotations and skews are not.
 */
export function screenScale(element: HTMLElement): ScreenScale {
	const { width, height } = element.getBoundingClientRect();
	const layout = fillLayoutBoundary(element);

	return {
		x: layout.width ? width / layout.width : 1,
		y: layout.height ? height / layout.height : 1
	};
}

function unscalePoint(point: Point, scale: ScreenScale): Point {
	return { left: point.left / scale.x, top: point.top / scale.y };
}

/**
 * Converts an image transform measured in screen pixels (a move distance, or the centre of a
 * zoom or rotation) into the container's own pixels. Zoom factors and angles don't depend on
 * the scale and pass through unchanged.
 */
export function unscaleImageTransform(
	transform: ImageTransform,
	scale: ScreenScale
): ImageTransform {
	if (scale.x === 1 && scale.y === 1) {
		return transform;
	}

	const { move, scale: zoom, rotate } = transform;
	const result: ImageTransform = { ...transform };
	if (move) {
		result.move = {
			left: move.left === undefined ? undefined : move.left / scale.x,
			top: move.top === undefined ? undefined : move.top / scale.y
		};
	}

	if (isObject(zoom) && zoom.center) {
		result.scale = { ...zoom, center: unscalePoint(zoom.center, scale) };
	}

	if (isObject(rotate) && rotate.center) {
		result.rotate = { ...rotate, center: unscalePoint(rotate.center, scale) };
	}

	return result;
}

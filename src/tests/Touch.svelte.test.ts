import { describe, expect, it } from 'vitest';
import { centerOf, getElement, mountCropper, nextFrame } from './fixtures';

function touch(target: Element, identifier: number, x: number, y: number) {
	return new Touch({ identifier, target, clientX: x, clientY: y });
}

function dispatchTouch(target: EventTarget, type: string, touches: Touch[]) {
	target.dispatchEvent(
		new TouchEvent(type, {
			bubbles: true,
			cancelable: true,
			touches: type === 'touchend' ? [] : touches,
			changedTouches: touches
		})
	);
}

describe('touch', () => {
	it('drags the stencil once past the activation distance', async () => {
		const { cropper, container } = await mountCropper({ transitions: false });
		// No transition: the core ignores moves while one is running.
		cropper().setCoordinates({ width: 150, height: 100 }, { transitions: false });
		await nextFrame();
		const area = getElement(container, '.advanced-cropper-rectangle-stencil__draggable-area');
		const { x, y } = centerOf(area);
		const start = cropper().getCoordinates();

		dispatchTouch(area, 'touchstart', [touch(area, 1, x, y)]);
		// The first move past the 30px activation distance only starts the drag.
		dispatchTouch(window, 'touchmove', [touch(area, 1, x + 40, y)]);
		expect(cropper().getCoordinates()).toEqual(start);
		// As upstream, the next move is measured from the original touch and damped by the
		// anchor; motion follows from the move after that.
		dispatchTouch(window, 'touchmove', [touch(area, 1, x + 60, y)]);
		dispatchTouch(window, 'touchmove', [touch(area, 1, x + 90, y)]);
		dispatchTouch(window, 'touchend', [touch(area, 1, x + 90, y)]);

		const after = cropper().getCoordinates();
		expect(after?.left).toBeGreaterThan(start?.left ?? 0);
	});

	it('zooms the image with a two-finger pinch', async () => {
		const { cropper, container } = await mountCropper({ transitions: false });
		const wrapper = getElement(container, '.advanced-cropper__background-wrapper');
		const { x, y } = centerOf(wrapper);
		const before = cropper().getVisibleArea()?.width ?? 0;

		// Two fingers 80px apart spread to 160px.
		dispatchTouch(wrapper, 'touchstart', [
			touch(wrapper, 1, x - 40, y),
			touch(wrapper, 2, x + 40, y)
		]);
		dispatchTouch(window, 'touchmove', [
			touch(wrapper, 1, x - 80, y),
			touch(wrapper, 2, x + 80, y)
		]);
		dispatchTouch(window, 'touchend', []);

		expect(cropper().getVisibleArea()?.width).toBeLessThan(before);
	});
});

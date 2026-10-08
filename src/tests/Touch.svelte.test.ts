import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Harness from './Harness.svelte';
import { createTestImage, nextFrame, waitFor } from './fixtures';
import type { CropperRef } from '#lib';

async function mountCropper(props: Record<string, unknown> = {}) {
	const onReady = vi.fn<(cropper: CropperRef) => void>();
	const screen = render(Harness, { src: createTestImage(), onReady, transitions: false, ...props });
	const cropper = (): CropperRef => screen.component.getCropper();
	await waitFor(() => onReady.mock.calls.length > 0);
	return { cropper, container: screen.container };
}

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
		const { cropper, container } = await mountCropper();
		// No transition: the core ignores moves while one is running.
		cropper().setCoordinates({ width: 150, height: 100 }, { transitions: false });
		await nextFrame();
		const area = container.querySelector('.advanced-cropper-rectangle-stencil__draggable-area');
		if (!area) throw new Error('missing draggable area');
		const box = area.getBoundingClientRect();
		const x = box.left + box.width / 2;
		const y = box.top + box.height / 2;
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
		const { cropper, container } = await mountCropper();
		const wrapper = container.querySelector('.advanced-cropper__background-wrapper');
		if (!wrapper) throw new Error('missing background wrapper');
		const box = wrapper.getBoundingClientRect();
		const cx = box.left + box.width / 2;
		const cy = box.top + box.height / 2;
		const before = cropper().getVisibleArea()?.width ?? 0;

		dispatchTouch(wrapper, 'touchstart', [
			touch(wrapper, 1, cx - 40, cy),
			touch(wrapper, 2, cx + 40, cy)
		]);
		dispatchTouch(window, 'touchmove', [
			touch(wrapper, 1, cx - 80, cy),
			touch(wrapper, 2, cx + 80, cy)
		]);
		dispatchTouch(window, 'touchend', []);

		expect(cropper().getVisibleArea()?.width).toBeLessThan(before);
	});
});

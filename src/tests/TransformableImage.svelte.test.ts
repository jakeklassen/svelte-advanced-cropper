import { expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { TransformableImage, type ImageTransform } from '#lib';
import { centerOf, drag, getElement } from './fixtures';

const dispatch = (element: EventTarget, type: string, touches: Touch[]) => {
	element.dispatchEvent(new TouchEvent(type, { bubbles: true, cancelable: true, touches }));
};

const combinations = [
	{ mouseMove: false, touchMove: false },
	{ mouseMove: false, touchMove: true },
	{ mouseMove: true, touchMove: false },
	{ mouseMove: true, touchMove: true }
];

for (const input of ['mouse', 'touch'] as const) {
	it.each(combinations)(
		`${input} movement with mouseMove=$mouseMove, touchMove=$touchMove`,
		async ({ mouseMove, touchMove }) => {
			const onTransform = vi.fn<(transform: ImageTransform) => void>();
			const screen = await render(TransformableImage, {
				mouseMove,
				touchMove,
				onTransform,
				class: 'gesture-target',
				style: 'width: 300px; height: 300px'
			});
			const target = getElement(screen.container, '.gesture-target');
			const start = centerOf(target);
			if (input === 'mouse') {
				drag(target, start, { x: 30, y: 20 });
			} else {
				const touch = (x: number, y: number) =>
					new Touch({ identifier: 1, target, clientX: x, clientY: y });
				dispatch(target, 'touchstart', [touch(start.x, start.y)]);
				dispatch(window, 'touchmove', [touch(start.x + 30, start.y + 20)]);
				dispatch(window, 'touchend', []);
			}

			const enabled = input === 'mouse' ? mouseMove : touchMove;
			expect(onTransform).toHaveBeenCalledTimes(enabled ? 1 : 0);
			expect(onTransform.mock.calls[0]?.[0].move).toEqual(
				enabled ? { left: -30, top: -20 } : undefined
			);
		}
	);
}

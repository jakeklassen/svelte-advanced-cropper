import { describe, expect, it } from 'vitest';
import { flushSync } from 'svelte';
import { centerOf, drag, getElement, mountCropper, nextFrame } from './fixtures';

// Inside a container scaled with a CSS transform, gestures must follow the pointer on
// screen: the cropper works in the container's untransformed pixels, the pointer in
// screen pixels. Each case also runs unscaled, as the baseline.
describe.each([1, 0.5])('gestures inside a container scaled to %s', (scale) => {
	it('moves the stencil as far as the pointer', async () => {
		const { cropper, container } = await mountCropper({ scale, transitions: false });
		// A small stencil in the middle, with room to move.
		cropper().setCoordinates(
			{ width: 200, height: 150, left: 300, top: 225 },
			{ transitions: false }
		);
		flushSync();
		await nextFrame();
		const stencil = getElement(container, '.advanced-cropper-stencil-wrapper');
		const area = getElement(container, '.advanced-cropper-rectangle-stencil__draggable-area');
		const before = stencil.getBoundingClientRect();

		drag(area, centerOf(area), { x: 40, y: 0 });
		await nextFrame();

		expect(stencil.getBoundingClientRect().left - before.left).toBeCloseTo(40, 0);
	});

	it('pans the image as far as the pointer', async () => {
		const { cropper, container } = await mountCropper({ scale, transitions: false });
		cropper().zoomImage(2, { transitions: false });
		flushSync();
		await nextFrame();
		const background = getElement(container, '.advanced-cropper-background-image');
		const wrapper = getElement(container, '.advanced-cropper__background-wrapper');
		const box = wrapper.getBoundingClientRect();
		const before = background.getBoundingClientRect();

		// Near the corner, away from the stencil.
		drag(wrapper, { x: box.left + 5, y: box.top + 5 }, { x: 30, y: 0 });
		await nextFrame();

		expect(background.getBoundingClientRect().left - before.left).toBeCloseTo(30, 0);
	});

	it('zooms the wheel around the point under the pointer', async () => {
		const { container } = await mountCropper({ scale, transitions: false });
		const background = getElement(container, '.advanced-cropper-background-image');
		const wrapper = getElement(container, '.advanced-cropper__background-wrapper');
		const box = wrapper.getBoundingClientRect();
		// Off-centre, so a misplaced zoom centre would visibly shift the image.
		const pointer = { x: box.left + box.width * 0.3, y: box.top + box.height * 0.4 };
		// Where the pointer sits on the image, as a fraction of the image's on-screen size.
		const fraction = () => {
			const image = background.getBoundingClientRect();

			return {
				x: (pointer.x - image.left) / image.width,
				y: (pointer.y - image.top) / image.height
			};
		};

		const before = fraction();

		wrapper.dispatchEvent(
			new WheelEvent('wheel', {
				bubbles: true,
				cancelable: true,
				deltaY: -100,
				clientX: pointer.x,
				clientY: pointer.y
			})
		);
		await nextFrame();

		const after = fraction();
		expect(after.x).toBeCloseTo(before.x, 2);
		expect(after.y).toBeCloseTo(before.y, 2);
	});
});

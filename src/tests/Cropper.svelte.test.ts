import { describe, expect, it, vi } from 'vitest';
import { flushSync } from 'svelte';
import { centerOf, drag, getElement, mountCropper, nextFrame, waitFor } from './fixtures';
import { FixedCropper, type CropperInstance } from '#lib';

describe('Cropper', () => {
	it('loads the image, creates a state and fires onReady after the reset', async () => {
		const { cropper, onReady, container } = await mountCropper();
		expect(onReady).toHaveBeenCalledTimes(1);
		const state = cropper().getState();
		expect(state?.imageSize).toEqual({ width: 800, height: 600 });
		expect(cropper().getCoordinates()?.width).toBeGreaterThan(0);
		expect(cropper().isLoaded()).toBe(true);
		expect(container.querySelector('.advanced-cropper-background-image')).not.toBeNull();
		expect(container.querySelector('.advanced-cropper-rectangle-stencil')).not.toBeNull();
	});

	it('renders the full upstream DOM structure', async () => {
		const { container } = await mountCropper();
		for (const selector of [
			'.advanced-cropper.advanced-cropper-wrapper',
			'.advanced-cropper-fade.advanced-cropper-fade--visible',
			'.advanced-cropper__boundary.advanced-cropper-boundary',
			'.advanced-cropper-boundary__stretcher',
			'.advanced-cropper__background-wrapper',
			'.advanced-cropper__background',
			'.advanced-cropper-stencil-wrapper.advanced-cropper-artificial-transition',
			'.advanced-cropper-bounding-box',
			'.advanced-cropper-bounding-box__handler-wrapper--east-north',
			'.advanced-cropper-bounding-box__line--west',
			'.advanced-cropper-simple-handler',
			'.advanced-cropper-simple-line',
			'.advanced-cropper-draggable-element',
			'.advanced-cropper-stencil-overlay',
			'.advanced-cropper-rectangle-stencil__preview',
			'canvas.advanced-cropper-canvas'
		]) {
			expect.soft(container.querySelector(selector)).not.toBeNull();
		}

		expect(container.querySelectorAll('.advanced-cropper-simple-handler')).toHaveLength(8);
		expect(container.querySelectorAll('.advanced-cropper-simple-line')).toHaveLength(4);
	});

	it('getCanvas works inside onReady', async () => {
		let canvas: HTMLCanvasElement | null = null;
		await mountCropper({
			onReady: (instance) => {
				canvas = instance.getCanvas();
			}
		});
		expect(canvas).not.toBeNull();
	});

	it('fires onReady again when an image is set imperatively', async () => {
		const { cropper, onReady } = await mountCropper();
		const image = cropper().getImage();
		if (!image) {
			throw new Error('no image');
		}

		cropper().setImage({ ...image });
		await waitFor(() => onReady.mock.calls.length === 2);
		expect(onReady).toHaveBeenCalledTimes(2);
	});

	it('draws the crop with getCanvas', async () => {
		const { cropper } = await mountCropper();
		const coordinates = cropper().getCoordinates();
		const canvas = cropper().getCanvas();
		expect(canvas?.width).toBe(Math.round(coordinates?.width ?? 0));
		expect(canvas?.height).toBe(Math.round(coordinates?.height ?? 0));
	});

	it('applies the aspect ratio from a child stencil and reacts to changes', async () => {
		const { screen, cropper } = await mountCropper({ ratio: 1 });
		const square = cropper().getCoordinates();
		expect(square?.width).toBeCloseTo(square?.height ?? 0, 0);

		await screen.rerender({ ratio: 16 / 9 });
		await waitFor(() => {
			const coordinates = cropper().getCoordinates();

			return coordinates && Math.abs(coordinates.width / coordinates.height - 16 / 9) < 0.02;
		});
	});

	it('keeps CircleStencil at 1:1', async () => {
		const { cropper, container } = await mountCropper({ circle: true });
		const coordinates = cropper().getCoordinates();
		expect(coordinates?.width).toBeCloseTo(coordinates?.height ?? 0, 0);
		expect(container.querySelector('.advanced-cropper-circle-stencil')).not.toBeNull();
		expect(container.querySelectorAll('.advanced-cropper-simple-handler')).toHaveLength(4);
	});

	it('setCoordinates, rotateImage, flipImage and zoomImage update the state', async () => {
		const { cropper } = await mountCropper({ transitions: false });
		cropper().setCoordinates({ width: 200, height: 100, left: 50, top: 60 });
		flushSync();
		expect(cropper().getCoordinates()).toMatchObject({
			width: 200,
			height: 100,
			left: 50,
			top: 60
		});

		cropper().rotateImage(90);
		cropper().rotateImage(90);
		expect(cropper().getTransforms().rotate).toBe(180);
		expect(cropper().getCanvas()).not.toBeNull();

		cropper().flipImage(true, false);
		expect(cropper().getTransforms().flip).toEqual({ horizontal: true, vertical: false });

		const before = cropper().getVisibleArea()?.width ?? 0;
		cropper().zoomImage(2);
		expect(cropper().getVisibleArea()?.width).toBeLessThan(before);
	});

	it('fires onChange with the cropper instance', async () => {
		const onChange = vi.fn<(cropper: CropperInstance) => void>();
		const { cropper } = await mountCropper({ onChange, transitions: false });
		onChange.mockClear();
		cropper().moveCoordinates({ left: 10, top: 0 });
		expect(onChange).toHaveBeenCalled();
		expect(typeof onChange.mock.calls[0][0].getCoordinates).toBe('function');
	});

	it('moves the stencil by dragging it, without moving the image', async () => {
		const { cropper, container } = await mountCropper({ transitions: false });
		const before = cropper().getCoordinates();
		const visibleArea = cropper().getVisibleArea();
		const area = getElement(
			container,
			'.advanced-cropper-draggable-element.advanced-cropper-rectangle-stencil__draggable-area'
		);

		// Halve the stencil so it has room to move. No transition: the core ignores moves while
		// one is running.
		cropper().setCoordinates(
			{ width: (before?.width ?? 0) / 2, height: (before?.height ?? 0) / 2 },
			{ transitions: false }
		);
		flushSync();
		await nextFrame();
		const halved = cropper().getCoordinates();
		drag(area, centerOf(area), { x: 20, y: 10 });
		const after = cropper().getCoordinates();
		expect(after?.left).toBeGreaterThan(halved?.left ?? 0);
		expect(after?.top).toBeGreaterThan(halved?.top ?? 0);
		expect(cropper().getVisibleArea()).toEqual(visibleArea);
	});

	it('pans the image by dragging the background', async () => {
		const { cropper, container } = await mountCropper({ transitions: false });
		cropper().zoomImage(2, { transitions: false });
		const before = cropper().getVisibleArea();
		const wrapper = getElement(container, '.advanced-cropper__background-wrapper');
		// Press near the corner, outside the stencil, so the drag reaches the image.
		const box = wrapper.getBoundingClientRect();
		drag(wrapper, { x: box.left + 5, y: box.top + 5 }, { x: 30, y: 30 });
		const after = cropper().getVisibleArea();
		expect(after?.left).not.toBe(before?.left);
	});

	it('zooms with the mouse wheel', async () => {
		const { cropper, container } = await mountCropper({ transitions: false });
		const before = cropper().getVisibleArea()?.width ?? 0;
		const wrapper = getElement(container, '.advanced-cropper__background-wrapper');
		const center = centerOf(wrapper);
		wrapper.dispatchEvent(
			new WheelEvent('wheel', {
				bubbles: true,
				cancelable: true,
				deltaY: -100,
				clientX: center.x,
				clientY: center.y
			})
		);
		expect(cropper().getVisibleArea()?.width).toBeLessThan(before);
	});

	it('resizes the stencil from a handler', async () => {
		const { cropper, container } = await mountCropper({ transitions: false });
		cropper().setCoordinates({ width: 200, height: 150 }, { transitions: false });
		flushSync();
		await nextFrame();
		const before = cropper().getCoordinates();
		const westHandler = getElement(
			container,
			'.advanced-cropper-bounding-box__handler-wrapper--west .advanced-cropper-draggable-element'
		);
		drag(westHandler, centerOf(westHandler), { x: -30, y: 0 });
		expect(cropper().getCoordinates()?.width).toBeGreaterThan(before?.width ?? 0);
	});

	it('marks a disabled stencil and ignores drags on it', async () => {
		const { cropper, container } = await mountCropper({ transitions: false, disabled: true });
		expect(container.querySelector('.advanced-cropper-rectangle-stencil--disabled')).not.toBeNull();
		const before = cropper().getCoordinates();
		const area = getElement(container, '.advanced-cropper-rectangle-stencil__draggable-area');
		const box = area.getBoundingClientRect();
		drag(area, { x: box.left + 10, y: box.top + 10 }, { x: 30, y: 30 });
		expect(cropper().getCoordinates()).toEqual(before);
	});
});

describe('transitions', () => {
	it('animates the stencil to new coordinates and settles on them', async () => {
		const onTransitionsEnd = vi.fn<(cropper: CropperInstance) => void>();
		const { cropper, container } = await mountCropper({ onTransitionsEnd });
		const stencil = getElement(container, '.advanced-cropper-stencil-wrapper', HTMLElement);
		cropper().setCoordinates({ width: 100, height: 100, left: 0, top: 0 }, { transitions: true });
		expect(cropper().getTransitions().active).toBe(true);
		await waitFor(() => onTransitionsEnd.mock.calls.length > 0);
		await nextFrame();
		const coordinates = cropper().getStencilCoordinates();
		expect(parseFloat(stencil.style.width)).toBeCloseTo(coordinates.width, 0);
		expect(cropper().getTransitions().active).toBe(false);
	});
});

describe('boundary size', () => {
	it('measures the layout size inside a scaled container', async () => {
		// A dialog that scales in, or any scaled ancestor: the on-screen size is 400×320.
		const { cropper } = await mountCropper({ scale: 0.8 });
		expect(cropper().getState()?.boundary).toEqual({ width: 500, height: 400 });
	});

	it('keeps sub-pixel sizes', async () => {
		const { cropper } = await mountCropper({ width: 500.5, height: 400.25 });
		expect(cropper().getState()?.boundary).toEqual({ width: 500.5, height: 400.25 });
	});
});

describe('FixedCropper', () => {
	it('locks the stencil size and lets the image move instead', async () => {
		const { cropper, container } = await mountCropper({
			component: FixedCropper,
			stencilSize: { width: 200, height: 100 },
			transitions: false
		});
		const stencil = getElement(container, '.advanced-cropper-stencil-wrapper', HTMLElement);
		expect(stencil.style.width).toBe('200px');
		expect(stencil.style.height).toBe('100px');
		const coordinates = cropper().getCoordinates();
		expect((coordinates?.width ?? 0) / (coordinates?.height ?? 1)).toBeCloseTo(2, 1);
	});
});

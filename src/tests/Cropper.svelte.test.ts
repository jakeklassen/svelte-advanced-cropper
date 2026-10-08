import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { flushSync } from 'svelte';
import Harness from './Harness.svelte';
import { createTestImage, nextFrame, waitFor } from './fixtures';
import { CircleStencil, FixedCropper, type CropperRef } from '#lib';

async function mountCropper(props: Record<string, unknown> = {}) {
	const onReady = vi.fn<(cropper: CropperRef) => void>();
	const screen = render(Harness, { src: createTestImage(), onReady, ...props });
	const cropper = (): CropperRef => screen.component.getCropper();
	await waitFor(() => onReady.mock.calls.length > 0);
	return { screen, cropper, onReady, container: screen.container };
}

function dispatchMouse(target: EventTarget, type: string, x: number, y: number) {
	target.dispatchEvent(
		new MouseEvent(type, {
			bubbles: true,
			cancelable: true,
			clientX: x,
			clientY: y,
			button: 0,
			buttons: 1
		})
	);
}

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
			onReady: (ref: CropperRef) => {
				canvas = ref.getCanvas();
			}
		}).catch(() => undefined);
		await waitFor(() => canvas);
		expect(canvas).not.toBeNull();
	});

	it('fires onReady again when an image is set imperatively', async () => {
		const { cropper, onReady } = await mountCropper();
		const image = cropper().getImage();
		if (!image) throw new Error('no image');
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

	it('applies the aspect ratio from stencilProps and reacts to changes', async () => {
		const { screen, cropper } = await mountCropper({ stencilProps: { aspectRatio: 1 } });
		const square = cropper().getCoordinates();
		expect(square?.width).toBeCloseTo(square?.height ?? 0, 0);

		await screen.rerender({ stencilProps: { aspectRatio: 16 / 9 } });
		await waitFor(() => {
			const c = cropper().getCoordinates();
			return c && Math.abs(c.width / c.height - 16 / 9) < 0.02;
		});
	});

	it('keeps CircleStencil at 1:1', async () => {
		const { cropper, container } = await mountCropper({ stencilComponent: CircleStencil });
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

	it('fires onChange with the cropper ref', async () => {
		const onChange = vi.fn<(cropper: CropperRef) => void>();
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
		const area = container.querySelector(
			'.advanced-cropper-draggable-element.advanced-cropper-rectangle-stencil__draggable-area'
		);
		expect(area).not.toBeNull();
		if (!area) return;
		cropper().setCoordinates({
			width: (before?.width ?? 0) / 2,
			height: (before?.height ?? 0) / 2
		});
		flushSync();
		await nextFrame();
		const start = cropper().getCoordinates();
		const box2 = area.getBoundingClientRect();
		const sx = box2.left + box2.width / 2;
		const sy = box2.top + box2.height / 2;
		dispatchMouse(area, 'mousedown', sx, sy);
		dispatchMouse(window, 'mousemove', sx + 20, sy + 10);
		dispatchMouse(window, 'mouseup', sx + 20, sy + 10);
		const after = cropper().getCoordinates();
		expect(after?.left).toBeGreaterThan(start?.left ?? 0);
		expect(after?.top).toBeGreaterThan(start?.top ?? 0);
		expect(cropper().getVisibleArea()).toEqual(visibleArea);
	});

	it('pans the image by dragging the background', async () => {
		const { cropper, container } = await mountCropper({ transitions: false });
		cropper().zoomImage(2, { transitions: false });
		const before = cropper().getVisibleArea();
		const wrapper = container.querySelector('.advanced-cropper__background-wrapper');
		if (!wrapper) throw new Error('missing background wrapper');
		const box = wrapper.getBoundingClientRect();
		const x = box.left + 5;
		const y = box.top + 5;
		dispatchMouse(wrapper, 'mousedown', x, y);
		dispatchMouse(window, 'mousemove', x + 30, y + 30);
		dispatchMouse(window, 'mouseup', x + 30, y + 30);
		const after = cropper().getVisibleArea();
		expect(after?.left).not.toBe(before?.left);
	});

	it('zooms with the mouse wheel', async () => {
		const { cropper, container } = await mountCropper({ transitions: false });
		const before = cropper().getVisibleArea()?.width ?? 0;
		const wrapper = container.querySelector('.advanced-cropper__background-wrapper');
		if (!wrapper) throw new Error('missing background wrapper');
		const box = wrapper.getBoundingClientRect();
		wrapper.dispatchEvent(
			new WheelEvent('wheel', {
				bubbles: true,
				cancelable: true,
				deltaY: -100,
				clientX: box.left + box.width / 2,
				clientY: box.top + box.height / 2
			})
		);
		expect(cropper().getVisibleArea()?.width).toBeLessThan(before);
	});

	it('resizes the stencil from a handler', async () => {
		const { cropper, container } = await mountCropper({ transitions: false });
		cropper().setCoordinates({ width: 200, height: 150 });
		flushSync();
		await nextFrame();
		const before = cropper().getCoordinates();
		const handler = container.querySelector(
			'.advanced-cropper-bounding-box__handler-wrapper--west .advanced-cropper-draggable-element'
		);
		if (!handler) throw new Error('missing west handler');
		const box = handler.getBoundingClientRect();
		const x = box.left + box.width / 2;
		const y = box.top + box.height / 2;
		dispatchMouse(handler, 'mousedown', x, y);
		dispatchMouse(window, 'mousemove', x - 30, y);
		dispatchMouse(window, 'mouseup', x - 30, y);
		expect(cropper().getCoordinates()?.width).toBeGreaterThan(before?.width ?? 0);
	});

	it('respects disabled', async () => {
		const { cropper, container } = await mountCropper({ transitions: false, disabled: true });
		expect(container.querySelector('.advanced-cropper-rectangle-stencil--disabled')).not.toBeNull();
		const before = cropper().getCoordinates();
		const area = container.querySelector('.advanced-cropper-rectangle-stencil__draggable-area');
		if (!area) throw new Error('missing draggable area');
		const box = area.getBoundingClientRect();
		dispatchMouse(area, 'mousedown', box.left + 10, box.top + 10);
		dispatchMouse(window, 'mousemove', box.left + 40, box.top + 40);
		dispatchMouse(window, 'mouseup', box.left + 40, box.top + 40);
		expect(cropper().getCoordinates()).toEqual(before);
	});
});

describe('FixedCropper', () => {
	it('locks the stencil size and lets the image move instead', async () => {
		const { cropper, container } = await mountCropper({
			component: FixedCropper,
			stencilSize: { width: 200, height: 100 },
			transitions: false
		});
		const stencil = container.querySelector<HTMLElement>('.advanced-cropper-stencil-wrapper');
		if (!stencil) throw new Error('missing stencil');
		expect(stencil.style.width).toBe('200px');
		expect(stencil.style.height).toBe('100px');
		const coordinates = cropper().getCoordinates();
		expect((coordinates?.width ?? 0) / (coordinates?.height ?? 1)).toBeCloseTo(2, 1);
	});
});

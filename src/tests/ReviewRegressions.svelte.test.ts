import { it, expect, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Harness from './Harness.svelte';
import { pendingStretches } from './AsyncBoundary.svelte';
import { createTestImage, waitFor, nextFrame, getElement, centerOf } from './fixtures';
import ObjectHarness from './ObjectHarness.svelte';
import { DraggableArea, HandlerWrapper, LineWrapper, TransformableImage } from '#lib';

it.each([
	['drag', '.advanced-cropper-rectangle-stencil__draggable-area'],
	['resize', '.advanced-cropper-handler-wrapper__draggable'],
	['line resize', '.advanced-cropper-line-wrapper'],
	['image drag', '.advanced-cropper__background-wrapper']
])('disable ends an in-progress %s exactly once', async (_name, selector) => {
	const ready = vi.fn<() => void>();
	const ended = vi.fn<() => void>();
	const screen = await render(Harness, {
		src: createTestImage(),
		onReady: ready,
		onInteractionEnd: ended,
		transitions: false
	});
	await waitFor(() => ready.mock.calls.length);
	const c = screen.component.getCropper();
	const el = getElement(screen.container, selector);
	const p = centerOf(el);
	el.dispatchEvent(
		new MouseEvent('mousedown', {
			bubbles: true,
			clientX: p.x,
			clientY: p.y,
			button: 0,
			buttons: 1
		})
	);
	window.dispatchEvent(
		new MouseEvent('mousemove', { bubbles: true, clientX: p.x + 15, clientY: p.y + 15 })
	);
	expect(c?.hasInteractions()).toBe(true);
	await screen.rerender({ disabled: true });
	expect(c?.hasInteractions()).toBe(false);
	expect(ended).toHaveBeenCalledTimes(1);
	window.dispatchEvent(new MouseEvent('mouseup'));
	expect(ended).toHaveBeenCalledTimes(1);
});
it('canvas=false zero boundary does not notify ready with null state', async () => {
	const ready = vi.fn<() => void>();
	const screen = await render(Harness, {
		src: createTestImage(),
		width: 0,
		height: 0,
		canvas: false,
		onReady: ready
	});
	await waitFor(() => screen.component.getCropper()?.isLoaded());
	await nextFrame();
	await nextFrame();
	expect(ready).not.toHaveBeenCalled();
	await screen.rerender({ width: 500, height: 400 });
	await screen.component.getCropper()?.refresh();
	await waitFor(() => ready.mock.calls.length === 1);
	expect(screen.component.getCropper()?.getCoordinates()).not.toBeNull();
	await screen.component.getCropper()?.refresh();
	await nextFrame();
	expect(ready).toHaveBeenCalledTimes(1);
});
it('superseded unresolved stretch does not block future stencil reconciliation', async () => {
	pendingStretches.length = 0;
	const ready = vi.fn<() => void>();
	const screen = await render(Harness, {
		src: createTestImage(),
		asyncBoundary: true,
		onReady: ready,
		ratio: 2,
		autoReconcileState: false
	});
	await waitFor(() => pendingStretches.length === 1);
	await screen.rerender({ asyncBoundary: false });
	await waitFor(() => ready.mock.calls.length);
	await screen.rerender({ ratio: 1 });
	await nextFrame();
	await nextFrame();
	const p = screen.component.getCropper()?.getCoordinates({ round: false });
	expect(p && p.width / p.height).toBeCloseTo(1);
});
it('setImage with canvas=false and no geometry does not notify ready', async () => {
	const ready = vi.fn<() => void>();
	const screen = await render(Harness, { canvas: false, onReady: ready });
	screen.component.getCropper()?.setImage({
		src: createTestImage(),
		width: 800,
		height: 600,
		revoke: false,
		arrayBuffer: null,
		transforms: { rotate: 0, flip: { horizontal: false, vertical: false } }
	});
	await nextFrame();
	await nextFrame();
	expect(ready).not.toHaveBeenCalled();
	const cropper = screen.component.getCropper();
	cropper?.setState({
		boundary: { width: 500, height: 400 },
		imageSize: { width: 800, height: 600 },
		transforms: { rotate: 0, flip: { horizontal: false, vertical: false } },
		visibleArea: { left: 0, top: 0, width: 800, height: 600 },
		coordinates: { left: 100, top: 100, width: 400, height: 300 }
	});
	await waitFor(() => ready.mock.calls.length === 1);
	await nextFrame();
	expect(ready).toHaveBeenCalledTimes(1);
});
it('stencil replacement retries a pending refresh', async () => {
	pendingStretches.length = 0;
	const ready = vi.fn<() => void>();
	const screen = await render(Harness, {
		src: createTestImage(),
		asyncBoundary: true,
		onReady: ready
	});
	await waitFor(() => pendingStretches.length === 1);
	pendingStretches[0]();
	await waitFor(() => ready.mock.calls.length);
	const c = screen.component.getCropper();
	c?.rotateImage(90, { transitions: false });
	c?.setCoordinates({ width: 200, height: 200 }, { transitions: false });
	const coordinates = c?.getCoordinates();
	const transforms = c?.getTransforms();
	await screen.rerender({ width: 700 });
	const refresh = c?.refresh();
	await waitFor(() => pendingStretches.length === 2);
	await screen.rerender({ circle: true });
	pendingStretches[1]();
	await refresh;
	for (const resolve of pendingStretches.slice(2)) {
		resolve();
	}

	await nextFrame();
	await nextFrame();
	expect(c?.getState()?.boundary.width).toBe(700);
	expect(c?.getCoordinates()).toEqual(coordinates);
	expect(c?.getTransforms()).toEqual(transforms);
});
it('reacts to custom fields of a registered state object', async () => {
	const ready = vi.fn<() => void>();
	const screen = await render(ObjectHarness, { src: createTestImage(), onReady: ready });
	await waitFor(() => ready.mock.calls.length);
	screen.component.setRatio(1);
	await nextFrame();
	await nextFrame();
	const p = screen.component.getCropper()?.getCoordinates({ round: false });
	expect(p && p.width / p.height).toBeCloseTo(1);
});

it.each([DraggableArea, HandlerWrapper, LineWrapper])(
	'removal completes an active movement exactly once',
	async (primitive) => {
		const ended = vi.fn<() => void>();
		const moved = vi.fn<() => void>();
		const screen = await render(primitive, { onMove: moved, onMoveEnd: ended });
		const element = getElement(screen.container, '.advanced-cropper-draggable-element');
		element.dispatchEvent(
			new MouseEvent('mousedown', { bubbles: true, button: 0, clientX: 10, clientY: 10 })
		);
		window.dispatchEvent(new MouseEvent('mousemove', { clientX: 20, clientY: 20 }));
		expect(moved).toHaveBeenCalledTimes(1);
		await screen.unmount();
		expect(ended).toHaveBeenCalledTimes(1);
		window.dispatchEvent(new MouseEvent('mouseup'));
		expect(ended).toHaveBeenCalledTimes(1);
	}
);
it('removal completes an image gesture exactly once', async () => {
	const ended = vi.fn<() => void>();
	const screen = await render(TransformableImage, {
		onTransformEnd: ended,
		class: 'image-gesture'
	});
	const element = getElement(screen.container, '.image-gesture');
	element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, buttons: 1 }));
	await screen.unmount();
	expect(ended).toHaveBeenCalledTimes(1);
	window.dispatchEvent(new MouseEvent('mouseup'));
	expect(ended).toHaveBeenCalledTimes(1);
});

it('stencil replacement ends the core drag exactly once', async () => {
	const ready = vi.fn<() => void>();
	const ended = vi.fn<() => void>();
	const screen = await render(Harness, {
		src: createTestImage(),
		onReady: ready,
		onMoveEnd: ended,
		transitions: false
	});
	await waitFor(() => ready.mock.calls.length === 1);
	ended.mockClear();
	const element = getElement(
		screen.container,
		'.advanced-cropper-rectangle-stencil__draggable-area'
	);
	const point = centerOf(element);
	element.dispatchEvent(
		new MouseEvent('mousedown', { bubbles: true, button: 0, clientX: point.x, clientY: point.y })
	);
	window.dispatchEvent(
		new MouseEvent('mousemove', { clientX: point.x + 20, clientY: point.y + 20 })
	);
	expect(screen.component.getCropper()?.hasInteractions()).toBe(true);
	await screen.rerender({ circle: true });
	expect(screen.component.getCropper()?.hasInteractions()).toBe(false);
	expect(ended).toHaveBeenCalledTimes(1);
	window.dispatchEvent(new MouseEvent('mouseup'));
	expect(ended).toHaveBeenCalledTimes(1);
});

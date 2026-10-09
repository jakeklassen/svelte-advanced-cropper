import { expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import {
	Cropper,
	StencilGrid,
	StretchableBoundary,
	TransformableImage,
	type RegisterBoundary
} from '#lib';
import ImageHarness from './ImageHarness.svelte';
import { createTestImage, delay, getElement, waitFor } from './fixtures';
import 'advanced-cropper/styles/StencilGrid.scss';

it('clears loaded immediately for setImage(null), without another load notification', async () => {
	const log: string[] = [];
	const screen = await render(ImageHarness, { src: createTestImage(), log });
	const loader = screen.component.getLoader();
	await waitFor(() => log.includes('load:false'));
	log.length = 0;
	loader.setImage(null);
	expect(loader.isLoaded()).toBe(false);
	expect(loader.getImage()).toBeNull();
	await delay(20);
	expect(log).toEqual([]);
});

it('retains the outgoing image while unloaded status drives its fade', async () => {
	const screen = await render(ImageHarness, { src: createTestImage(), log: [], unloadTime: 100 });
	const loader = screen.component.getLoader();
	await waitFor(() => loader.isLoaded());
	const image = loader.getImage();
	await screen.rerender({ src: null });
	expect(loader.isLoaded()).toBe(false);
	expect(loader.isLoading()).toBe(false);
	expect(loader.getImage()).toBe(image);
	await waitFor(() => loader.getImage() === null);
	expect(loader.isLoaded()).toBe(false);
});

it('reacts to automatic reconciliation being enabled and disabled after mount', async () => {
	const ready = vi.fn<() => void>();
	const screen = await render(Cropper, {
		src: createTestImage(),
		style: 'width: 500px; height: 400px',
		autoReconcileState: false,
		transitions: false,
		onReady: ready
	});
	await waitFor(() => ready.mock.calls.length);
	const cropper = () => screen.component;

	cropper().setCoordinates({ width: 200, height: 200 }, { transitions: false });
	await screen.rerender({ minWidth: 300 });
	expect(cropper().getCoordinates()?.width).toBe(200);
	await screen.rerender({ autoReconcileState: true });
	await waitFor(() => (cropper().getCoordinates()?.width ?? 0) >= 300);
	expect(cropper().getCoordinates()?.width).toBeGreaterThanOrEqual(300);
	await screen.rerender({ autoReconcileState: false });
	await screen.rerender({ minWidth: 400 });
	expect(cropper().getCoordinates()?.width).toBe(300);
	await cropper().reset();
	cropper().setCoordinates({ width: 400, height: 400 }, { transitions: false });
	await screen.rerender({ minWidth: 500 });
	expect(cropper().getCoordinates()?.width).toBe(400);
});

it('uses the current timeout for the next wheel event and cancels it on disable', async () => {
	const ended = vi.fn<() => void>();
	const screen = await render(TransformableImage, {
		class: 'wheel-target',
		timeout: 1000,
		onTransformEnd: ended
	});
	const target = getElement(screen.container, '.wheel-target');
	const wheel = () =>
		target.dispatchEvent(new WheelEvent('wheel', { deltaY: 10, cancelable: true }));
	wheel();
	await screen.rerender({ timeout: 20 });
	expect(ended).not.toHaveBeenCalled();
	wheel();
	await delay(80);
	expect(ended).toHaveBeenCalledTimes(1);
	wheel();
	await screen.rerender({ disabled: true });
	expect(ended).toHaveBeenCalledTimes(2);
	await delay(80);
	expect(ended).toHaveBeenCalledTimes(2);
});

it('replaces boundary registration in place and releases each owner exactly once', async () => {
	const log: string[] = [];
	const first: RegisterBoundary = () => {
		log.push('first');

		return () => {
			log.push('release first');
		};
	};

	const second: RegisterBoundary = () => {
		log.push('second');

		return () => {
			log.push('release second');
		};
	};

	const screen = await render(StretchableBoundary, { registerBoundary: first });
	const element = getElement(screen.container, '.advanced-cropper-boundary');
	expect(log).toEqual(['first']);
	await screen.rerender({ registerBoundary: second });
	expect(getElement(screen.container, '.advanced-cropper-boundary')).toBe(element);
	expect(log).toEqual(['first', 'release first', 'second']);
	await screen.rerender({ registerBoundary: undefined });
	expect(log).toEqual(['first', 'release first', 'second', 'release second']);
	await screen.rerender({ registerBoundary: first });
	await screen.unmount();
	expect(log).toEqual([
		'first',
		'release first',
		'second',
		'release second',
		'first',
		'release first'
	]);
});

it('keeps outgoing grid dimensions during the fade and uses new dimensions on return', async () => {
	const screen = await render(StencilGrid, { visible: true, rows: 3, columns: 3 });
	const cells = () => screen.container.querySelectorAll('.advanced-cropper-stencil-grid__cell');
	expect(cells()).toHaveLength(9);
	await screen.rerender({ visible: false, rows: 9, columns: 9 });
	expect(cells()).toHaveLength(9);
	await waitFor(() => cells().length === 0);
	expect(cells()).toHaveLength(0);
	await screen.rerender({ visible: true });
	expect(cells()).toHaveLength(81);
});

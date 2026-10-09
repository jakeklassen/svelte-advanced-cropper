import { expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import CustomizationHarness from './CustomizationHarness.svelte';
import { pendingDraws } from './CanvasBackground.svelte';
import { pendingStretches } from './AsyncBoundary.svelte';
import { createTestImage, nextFrame, waitFor, getElement, centerOf } from './fixtures';
import type { CropperInstance, NativeMoveEvent } from '#lib';

const modifiers = (values: string[]) => values.map((value) => `--${value}`);

function pixels(cropper: CropperInstance) {
	return Array.from(
		cropper.getCanvas({ width: 4 })?.getContext('2d')?.getImageData(0, 0, 1, 1).data ?? []
	);
}

it('waits for a filtered canvas and exports its pixels inside onReady', async () => {
	pendingDraws.length = 0;
	const exported: number[][] = [];
	const screen = await render(CustomizationHarness, {
		src: createTestImage(),
		customCanvas: true,
		onReady: (cropper) => exported.push(pixels(cropper))
	});
	await waitFor(() => pendingDraws.length === 1);
	expect(screen.component.getCropper()?.getCanvas()).toBeNull();
	expect(exported).toEqual([]);
	pendingDraws[0]();
	await waitFor(() => exported.length === 1);
	expect(exported).toEqual([[18, 171, 52, 255]]);
});

it('ignores stale source readiness and never exports a removed or undrawn source', async () => {
	pendingDraws.length = 0;
	const ready = vi.fn<(cropper: CropperInstance) => void>();
	const screen = await render(CustomizationHarness, {
		src: createTestImage(),
		customCanvas: true,
		onReady: ready
	});
	await waitFor(() => pendingDraws.length === 1);
	await screen.rerender({ sourceGeneration: 1 });
	await waitFor(() => pendingDraws.length === 2);
	pendingDraws[0]();
	await nextFrame();
	expect(ready).toHaveBeenCalledTimes(0);
	expect(screen.component.getCropper()?.getCanvas()).toBeNull();
	pendingDraws[1]();
	await waitFor(() => ready.mock.calls.length === 1);
	await screen.rerender({ emptyBackground: true });
	expect(screen.component.getCropper()?.getCanvas()).toBeNull();
	await screen.rerender({ emptyBackground: false });
	await waitFor(() => pendingDraws.length === 3);
	pendingDraws[2]();
	await nextFrame();
	expect(ready).toHaveBeenCalledTimes(1);
});

it('invalidates readiness when the image changes on the same canvas', async () => {
	pendingDraws.length = 0;
	const ready = vi.fn<(cropper: CropperInstance) => void>();
	const screen = await render(CustomizationHarness, {
		src: createTestImage(),
		customCanvas: true,
		onReady: ready
	});
	await waitFor(() => pendingDraws.length === 1);
	const canvas = screen.container.querySelector('canvas.advanced-cropper__background');
	const cropper = screen.component.getCropper();
	const image = cropper?.getImage();
	if (!image || !cropper) {
		throw new Error('No image');
	}

	cropper.setImage({ ...image });
	await waitFor(() => pendingDraws.length === 2);
	expect(screen.container.querySelector('canvas.advanced-cropper__background')).toBe(canvas);
	pendingDraws[0]();
	await nextFrame();
	expect(cropper.getCanvas()).toBeNull();
	expect(ready).toHaveBeenCalledTimes(0);
	pendingDraws[1]();
	await waitFor(() => ready.mock.calls.length === 1);
	expect(pixels(cropper)).toEqual([18, 171, 52, 255]);
});

it('restarts an asynchronous stretch when a snippet replaces the boundary', async () => {
	pendingStretches.length = 0;
	const ready = vi.fn<() => void>();
	const screen = await render(CustomizationHarness, {
		src: createTestImage(),
		asyncBoundary: true,
		onReady: ready
	});
	await waitFor(() => pendingStretches.length === 1);
	await screen.rerender({ boundaryGeneration: 1 });
	await waitFor(() => pendingStretches.length === 2);
	pendingStretches[0]();
	await nextFrame();
	expect(screen.component.getCropper()?.getState()).toBeNull();
	pendingStretches[1]();
	await waitFor(() => ready.mock.calls.length === 1);
	expect(screen.component.getCropper()?.getState()?.boundary).toEqual({ width: 500, height: 400 });
});

it('passes the fitted content size to preview backgrounds', async () => {
	const ready = vi.fn<() => void>();
	const screen = await render(CustomizationHarness, {
		src: createTestImage(),
		customPreview: true,
		onReady: ready
	});
	await waitFor(() => ready.mock.calls.length === 1);
	screen.component.getCropper()?.setCoordinates({ width: 400, height: 100 });
	const element = getElement(screen.container, '[data-testid="preview-size"]');
	await waitFor(() => Number(element.getAttribute('data-width')) === 200);
	await waitFor(() => Number(element.getAttribute('data-height')) === 50);
	expect(element.getAttribute('data-width')).toBe('200');
	expect(element.getAttribute('data-height')).toBe('50');
});

it('passes the native event through a handler snippet and preserves the Shift ratio lock', async () => {
	const ready = vi.fn<() => void>();
	const native = vi.fn<(event: NativeMoveEvent) => void>();
	const screen = await render(CustomizationHarness, {
		src: createTestImage(),
		onReady: ready,
		onNativeMove: native
	});
	await waitFor(() => ready.mock.calls.length === 1);
	const cropper = screen.component.getCropper();
	cropper?.setCoordinates({ width: 300, height: 200 }, { transitions: false });
	await nextFrame();
	const handler = getElement(
		screen.container,
		'.advanced-cropper-bounding-box__handler--east-south .advanced-cropper-handler-wrapper__draggable'
	);
	const { x, y } = centerOf(handler);
	handler.dispatchEvent(
		new MouseEvent('mousedown', { bubbles: true, clientX: x, clientY: y, button: 0 })
	);
	const event = new MouseEvent('mousemove', {
		bubbles: true,
		cancelable: true,
		clientX: x + 20,
		clientY: y + 3,
		shiftKey: true
	});
	window.dispatchEvent(event);
	window.dispatchEvent(new MouseEvent('mouseup'));
	expect(native).toHaveBeenCalledWith(event);
	const coordinates = cropper?.getCoordinates({ round: false });
	expect(coordinates && coordinates.width / coordinates.height).toBeCloseTo(1.5);
	expect(coordinates?.width).not.toBe(300);
});

it('supports the same layer snippets on FixedCropper', async () => {
	const ready = vi.fn<() => void>();
	const screen = await render(CustomizationHarness, {
		src: createTestImage(),
		fixed: true,
		onReady: ready
	});
	await waitFor(() => ready.mock.calls.length === 1);
	expect(screen.component.getCropper()?.getStencilCoordinates()).toMatchObject({
		width: 200,
		height: 100
	});
	expect(screen.component.getCropper()?.getCanvas()).not.toBeNull();
});

it('emits the complete stable class inventory for rectangle, circle, disabled controls and preview', async () => {
	const ready = vi.fn<() => void>();
	const screen = await render(CustomizationHarness, { src: createTestImage(), onReady: ready });
	await waitFor(() => ready.mock.calls.length === 1);
	const observed = new Set<string>();
	function collect() {
		for (const element of screen.container.querySelectorAll('[class]')) {
			for (const name of element.classList) {
				observed.add(name);
			}
		}
	}

	for (const circle of [false, true]) {
		await screen.rerender({ circle, disabled: false });
		await nextFrame();
		collect();
		for (const element of screen.container.querySelectorAll(
			'.advanced-cropper-draggable-element'
		)) {
			element.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
		}

		const cropper = screen.component.getCropper();
		cropper?.moveCoordinates({ left: 1, top: 1 });
		await nextFrame();
		collect();
		cropper?.moveCoordinatesEnd();
		cropper?.resizeCoordinates('eastSouth', { left: 1, top: 1 }, {});
		await nextFrame();
		collect();
		cropper?.resizeCoordinatesEnd();
		await screen.rerender({ disabled: true });
		await nextFrame();
		collect();
	}

	const expected = new Set<string>();
	function inventory(base: string, suffixes: string[] = []) {
		expected.add(base);
		for (const suffix of suffixes) {
			expected.add(base + suffix);
		}
	}

	const cardinal = ['north', 'east', 'south', 'west'];
	const directions = [...cardinal, 'east-north', 'east-south', 'west-north', 'west-south'];

	inventory('advanced-cropper', [
		'__boundary',
		'__background-wrapper',
		'__background',
		'--disabled'
	]);
	inventory('advanced-cropper-wrapper', ['__fade']);
	inventory('advanced-cropper-boundary', ['__stretcher', '__content']);
	for (const name of [
		'background-image',
		'canvas',
		'source',
		'artificial-transition',
		'stencil-wrapper',
		'stencil-overlay'
	]) {
		inventory(`advanced-cropper-${name}`);
	}

	inventory('advanced-cropper-draggable-element', ['--disabled']);
	inventory('advanced-cropper-fade', ['--visible']);
	inventory('advanced-cropper-stencil-grid', ['--visible', '__row', '__cell']);
	inventory('advanced-cropper-stencil-grid__cell', modifiers(['top', 'bottom', 'left', 'right']));
	for (const shape of ['rectangle', 'circle']) {
		inventory(`advanced-cropper-${shape}-stencil`, [
			'--movable',
			'--moving',
			'--resizable',
			'--resizing',
			'--disabled',
			'__bounding-box',
			'__draggable-area',
			'__overlay',
			'__preview',
			'__grid'
		]);
	}

	inventory('advanced-cropper-bounding-box', [
		'--disabled',
		'__lines',
		'__handlers',
		'__handler-wrapper',
		'__handler',
		'__line'
	]);
	inventory('advanced-cropper-bounding-box__handler-wrapper', modifiers(directions));
	inventory('advanced-cropper-bounding-box__handler', modifiers(directions));
	inventory('advanced-cropper-bounding-box__line', modifiers(cardinal));
	inventory('advanced-cropper-handler-wrapper', [
		...modifiers(directions),
		'--disabled',
		'--hover',
		'__draggable'
	]);
	inventory('advanced-cropper-line-wrapper', [
		...modifiers(cardinal),
		'--disabled',
		'--hover',
		'__content'
	]);
	inventory('advanced-cropper-line-wrapper__content', modifiers(cardinal));
	for (const suffix of ['handler', 'handler-wrapper']) {
		inventory(`advanced-cropper-simple-${suffix}`, [
			...modifiers(directions),
			'--disabled',
			'--hover'
		]);
	}

	for (const suffix of ['line', 'line-wrapper']) {
		inventory(`advanced-cropper-simple-${suffix}`, [
			...modifiers(cardinal),
			'--disabled',
			'--hover'
		]);
	}

	inventory('advanced-cropper-preview', ['__boundary', '__content', '__image']);
	inventory('advanced-cropper-preview__image', ['--visible']);
	inventory('cropper-preview-wrapper', ['__fade']);
	expect([...expected].filter((name) => !observed.has(name))).toEqual([]);
	expect(
		screen.container.querySelector('.custom-source')?.classList.contains('advanced-cropper-source')
	).toBe(true);
});

it('invalidates a pending preview stretch when its boundary is replaced', async () => {
	pendingStretches.length = 0;
	const ready = vi.fn<() => void>();
	const screen = await render(CustomizationHarness, {
		src: createTestImage(),
		customPreview: true,
		asyncPreview: true,
		onReady: ready
	});
	await waitFor(() => pendingStretches.length === 1 && ready.mock.calls.length === 1);
	await screen.rerender({ previewGeneration: 1 });
	await waitFor(() => pendingStretches.length === 2);
	const content = getElement(screen.container, '[data-testid="preview-size"]');
	pendingStretches[0]();
	await nextFrame();
	expect(content.getAttribute('data-width')).toBeNull();
	pendingStretches[1]();
	await waitFor(() => content.getAttribute('data-width'));
	expect(Number(content.getAttribute('data-width'))).toBeGreaterThan(0);
});

it('allows an intentionally empty source when canvas export is disabled', async () => {
	const ready = vi.fn<() => void>();
	const screen = await render(CustomizationHarness, {
		src: createTestImage(),
		emptyBackground: true,
		canvas: false,
		onReady: ready
	});
	await waitFor(() => ready.mock.calls.length === 1);
	expect(screen.component.getCropper()?.getCanvas()).toBeNull();
	expect(screen.component.getCropper()?.getState()).not.toBeNull();
});

it.each([false, true])('uses explicit visibility rules for circle=%s', async (circle) => {
	const ready = vi.fn<() => void>();
	const screen = await render(CustomizationHarness, {
		src: createTestImage(),
		circle,
		onReady: ready
	});
	await waitFor(() => ready.mock.calls.length === 1);
	const handlers = () =>
		screen.container.querySelectorAll('.advanced-cropper-bounding-box__handler');
	const lines = () => screen.container.querySelectorAll('.advanced-cropper-bounding-box__line');
	expect(handlers()).toHaveLength(circle ? 4 : 8);
	expect(lines()).toHaveLength(4);
	await screen.rerender({ handlers: true, lines: true, resizable: false });
	expect(handlers()).toHaveLength(8);
	expect(lines()).toHaveLength(4);
	expect(
		[...handlers()].every((element) =>
			element.classList.contains('advanced-cropper-handler-wrapper--disabled')
		)
	).toBe(true);
	await screen.rerender({ handlers: { eastNorth: true }, lines: { west: true } });
	expect(handlers()).toHaveLength(1);
	expect(lines()).toHaveLength(1);
	await screen.rerender({ handlers: {}, lines: {} });
	expect(handlers()).toHaveLength(0);
	expect(lines()).toHaveLength(0);
	await screen.rerender({ handlers: false, lines: false });
	expect(handlers()).toHaveLength(0);
	expect(lines()).toHaveLength(0);
});

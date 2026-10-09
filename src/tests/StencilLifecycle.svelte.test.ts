import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { createState, type CropperInstance } from '#lib';
import StencilHarness from './StencilHarness.svelte';
import InvalidStencilHarness from './InvalidStencilHarness.svelte';
import { createTestImage, waitFor, nextFrame } from './fixtures';

async function mount(mode: 'circle' | 'rectangle' | 'custom' | 'empty' | 'nested' = 'circle') {
	const onReady = vi.fn<() => void>();
	const screen = await render(StencilHarness, { src: createTestImage(), mode, onReady });
	await waitFor(() => onReady.mock.calls.length > 0);
	const cropper = screen.component.getCropper();
	if (!cropper) {
		throw new Error('Missing cropper');
	}

	return { screen, cropper, onReady };
}

function ratio(cropper: CropperInstance) {
	const coordinates = cropper.getCoordinates({ round: false });
	if (!coordinates) {
		throw new Error('Missing coordinates');
	}

	return coordinates.width / coordinates.height;
}

describe('stencil composition', () => {
	it('applies circle constraints at the first reset', async () => {
		const ratios: number[] = [];
		const onReady = vi.fn<() => void>();
		await render(StencilHarness, {
			src: createTestImage(),
			onReady,
			createStateAlgorithm: (options, settings) => {
				const state = createState(options, settings);
				if (!state.coordinates) {
					throw new Error('Missing coordinates');
				}

				ratios.push(state.coordinates.width / state.coordinates.height);

				return state;
			}
		});
		await waitFor(() => onReady.mock.calls.length > 0);
		expect(ratios).toEqual([1]);
	});
	it('reacts to custom stencil options even with automatic settings reconciliation disabled', async () => {
		const { screen, cropper, onReady } = await mount('custom');
		expect(ratio(cropper)).toBeCloseTo(2);
		await screen.rerender({ ratio: 1.5 });
		await waitFor(() => Math.abs(ratio(cropper) - 1.5) < 0.001);
		expect(onReady).toHaveBeenCalledTimes(1);
	});
	it('reconciles appearance, replacement and removal without resetting transforms or firing ready', async () => {
		const { screen, cropper, onReady } = await mount('empty');
		expect(screen.container.querySelector('.advanced-cropper-rectangle-stencil')).toBeNull();
		cropper.rotateImage(20, { transitions: false });
		await screen.rerender({ mode: 'circle' });
		await waitFor(() => Math.abs(ratio(cropper) - 1) < 0.001);
		expect(cropper.getTransforms().rotate).toBe(20);
		await screen.rerender({ mode: 'rectangle', ratio: 2 });
		await waitFor(() => Math.abs(ratio(cropper) - 2) < 0.001);
		await screen.rerender({ mode: 'empty' });
		await nextFrame();
		cropper.setCoordinates({ width: 150, height: 100 }, { transitions: false });
		expect(ratio(cropper)).toBeCloseTo(1.5);
		expect(cropper.getTransforms().rotate).toBe(20);
		expect(onReady).toHaveBeenCalledTimes(1);
	});
	it('isolates nested cropper contexts', async () => {
		const { screen, cropper } = await mount('nested');
		const nested = await waitFor(() => {
			const candidate = screen.component.getNested();

			return candidate?.getState() ? candidate : null;
		});
		expect(ratio(cropper)).toBeCloseTo(2);
		expect(ratio(nested)).toBeCloseTo(1);
	});
	it('inherits disabled and renders children inside the crop region', async () => {
		const { screen } = await mount();
		await screen.rerender({ disabled: true });
		expect(
			screen.container.querySelector('.advanced-cropper-circle-stencil--disabled')
		).not.toBeNull();
		expect(
			screen.container.querySelector(
				'.advanced-cropper-circle-stencil__draggable-area [data-testid="guide"]'
			)
		).not.toBeNull();
	});
	it('combines a non-square fixed size with circle constraints', async () => {
		const onReady = vi.fn<() => void>();
		const screen = await render(StencilHarness, { src: createTestImage(), fixed: true, onReady });
		await waitFor(() => onReady.mock.calls.length > 0);
		const cropper = screen.component.getCropper();
		if (!cropper) {
			throw new Error('Missing cropper');
		}

		expect(ratio(cropper)).toBeCloseTo(1);
		expect(cropper.getSettings().transformImage?.adjustStencil).toBe(false);
	});
});

it('rejects multiple live stencil registrations in the browser', async () => {
	const screen = await render(InvalidStencilHarness);
	expect(screen.container.textContent).toContain('at most one registered stencil');
});
it('reports missing context in the browser', async () => {
	const screen = await render(InvalidStencilHarness, { missing: true });
	expect(screen.container.textContent).toContain('inside a Cropper or FixedCropper');
});

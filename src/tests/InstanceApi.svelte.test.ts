import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { Cropper, FixedCropper, type CropperInstance } from '#lib';
import { cropperInstanceMethods } from './instanceMethods';
import AsyncBoundary, { pendingStretches } from './AsyncBoundary.svelte';
import EffectHarness from './EffectHarness.svelte';
import Harness from './Harness.svelte';
import { createTestImage, mountCropper, nextFrame, waitFor } from './fixtures';

describe('cropper instance', () => {
	it.each([
		['Cropper', Cropper, {}],
		['FixedCropper', FixedCropper, { stencilSize: { width: 200, height: 100 } }]
	])('%s exposes every instance method through bind:this', async (_name, component, props) => {
		const { cropper } = await mountCropper({ component, ...props });
		const missing = cropperInstanceMethods.filter(
			(method) => typeof cropper()[method] !== 'function'
		);
		expect(missing).toEqual([]);
	});

	it('fires onReady once for several setImage calls in a row', async () => {
		const { cropper, onReady } = await mountCropper();
		const image = cropper().getImage();
		if (!image) {
			throw new Error('no image');
		}

		const first = { ...image };
		const second = { ...image };
		cropper().setImage(first);
		cropper().setImage(second);
		cropper().setImage(first);
		await nextFrame();
		await nextFrame();
		expect(onReady).toHaveBeenCalledTimes(2);
	});

	it('fires onReady once, with a state, when overlapping resets finish out of order', async () => {
		pendingStretches.length = 0;
		const readyWithState: boolean[] = [];
		const screen = await render(Harness, {
			src: createTestImage(),
			boundaryComponent: AsyncBoundary,
			onReady: (ref: CropperInstance) => readyWithState.push(ref.getState() !== null)
		});
		const cropper = () => screen.component.getCropper();
		// The image has loaded and its reset is waiting for the boundary.
		await waitFor(() => pendingStretches.length === 1);
		void cropper()?.reset();
		expect(pendingStretches).toHaveLength(2);

		// The newer reset finishes first, then the superseded one.
		const [older, newer] = pendingStretches;
		newer();
		older();
		await waitFor(() => readyWithState.length > 0);
		await nextFrame();
		expect(readyWithState).toEqual([true]);
	});

	it('can be driven from a $effect without the effect depending on cropper state', async () => {
		const onReady = vi.fn<() => void>();
		const onEffectRun = vi.fn<() => void>();
		await render(EffectHarness, { src: createTestImage(), onReady, onEffectRun });
		await waitFor(() => onReady.mock.calls.length > 0);
		await nextFrame();
		await nextFrame();
		// Once when the state first appears; setCoordinates and refresh must not re-run it.
		expect(onEffectRun).toHaveBeenCalledTimes(1);
	});
});

it('restarts a pending initial reset when its stencil is replaced', async () => {
	pendingStretches.length = 0;
	const ready = vi.fn<() => void>();
	const screen = await render(Harness, {
		src: createTestImage(),
		circle: true,
		boundaryComponent: AsyncBoundary,
		onReady: ready
	});
	await waitFor(() => pendingStretches.length === 1);
	await screen.rerender({ circle: false, ratio: 2 });
	await waitFor(() => pendingStretches.length === 2);
	pendingStretches[0]();
	await nextFrame();
	expect(screen.component.getCropper()?.getState()).toBeNull();
	pendingStretches[1]();
	await waitFor(() => ready.mock.calls.length === 1);
	const coordinates = screen.component.getCropper()?.getCoordinates({ round: false });
	expect(coordinates && coordinates.width / coordinates.height).toBeCloseTo(2);
});

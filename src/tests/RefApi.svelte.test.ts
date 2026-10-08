import { describe, expect, it, vi } from 'vitest';
import type { Component } from 'svelte';
import { render } from 'vitest-browser-svelte';
import { AbstractCropper, Cropper, FixedCropper, type CropperRef } from '#lib';
import { cropperRefMethods } from '#lib/service/ref.ts';
import EffectHarness from './EffectHarness.svelte';
import Harness from './Harness.svelte';
import { createTestImage, nextFrame, waitFor } from './fixtures';

async function mount(component: Component<any, any, any>, props: Record<string, unknown> = {}) {
	const onReady = vi.fn<(cropper: CropperRef) => void>();
	const screen = await render(Harness, { component, src: createTestImage(), onReady, ...props });
	await waitFor(() => onReady.mock.calls.length > 0);

	return { cropper: (): CropperRef => screen.component.getCropper(), onReady };
}

describe('cropper ref', () => {
	it.each([
		['AbstractCropper', AbstractCropper, { settings: {} }],
		['Cropper', Cropper, {}],
		['FixedCropper', FixedCropper, { stencilSize: { width: 200, height: 100 } }]
	])('%s exposes every ref method through bind:this', async (_name, component, props) => {
		const { cropper } = await mount(component, props);
		const missing = cropperRefMethods.filter((method) => typeof cropper()[method] !== 'function');
		expect(missing).toEqual([]);
	});

	it('fires onReady once for several setImage calls in a row', async () => {
		const { cropper, onReady } = await mount(Cropper);
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

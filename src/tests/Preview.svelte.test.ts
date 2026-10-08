import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import PreviewHarness from './PreviewHarness.svelte';
import AdapterPreviewHarness from './AdapterPreviewHarness.svelte';
import { createTestImage, nextFrame, waitFor } from './fixtures';
import type { CropperRef } from '#lib';

describe('CropperPreview', () => {
	it('mirrors the cropper image and resizes with the coordinates', async () => {
		const onReady = vi.fn<(cropper: CropperRef) => void>();
		const screen = render(PreviewHarness, { src: createTestImage(), onReady });
		await waitFor(() => onReady.mock.calls.length > 0);
		const preview = screen.container.querySelector('.test-preview');
		const image = await waitFor(() =>
			preview?.querySelector<HTMLImageElement>('.advanced-cropper-preview__image--visible')
		);
		expect(image.src).toContain('data:image/png');

		const content = preview?.querySelector<HTMLElement>('.advanced-cropper-preview__content');
		const cropper = screen.component.getCropper();
		cropper?.setCoordinates({ width: 400, height: 100 });
		await nextFrame();
		await waitFor(() => content?.style.width && content.style.height);
		const width = parseFloat(content?.style.width ?? '0');
		const height = parseFloat(content?.style.height ?? '0');
		expect(width / height).toBeCloseTo(4, 0);
	});

	it('re-reads a non-reactive cropper object on refresh()', async () => {
		const onReady = vi.fn<(cropper: CropperRef) => void>();
		const source = render(PreviewHarness, { src: createTestImage(), onReady });
		await waitFor(() => onReady.mock.calls.length > 0);
		const real = source.component.getCropper();
		if (!real) throw new Error('no cropper');

		// A plain object whose getters Svelte cannot track.
		let ready = false;
		const adapter = {
			getState: () => (ready ? real.getState() : null),
			getImage: () => (ready ? real.getImage() : null),
			getTransitions: () => null,
			isLoaded: () => ready,
			isLoading: () => false
		};
		const screen = render(AdapterPreviewHarness, { adapter });
		const visible = () =>
			screen.container.querySelector('.adapter-preview .advanced-cropper-preview__image--visible');
		await nextFrame();
		expect(visible()).toBeNull();

		ready = true;
		screen.component.refresh();
		await waitFor(() => visible());
		expect(visible()).not.toBeNull();
	});
});

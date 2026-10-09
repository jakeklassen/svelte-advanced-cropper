import { expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { tick } from 'svelte';
import type { CropperInstance } from '#lib';
import ImageSourceHarness from './ImageSourceHarness.svelte';
import { createTestImage, mountCropper, nextFrame, waitFor } from './fixtures';

function centerPixel(cropper: CropperInstance) {
	const canvas = cropper.getCanvas();

	return Array.from(
		canvas
			?.getContext('2d')
			?.getImageData(Math.floor(canvas.width / 2), Math.floor(canvas.height / 2), 1, 1).data ?? []
	);
}

it('exports the right pixels inside onReady without awaiting decode', async () => {
	const decode = vi
		.spyOn(HTMLImageElement.prototype, 'decode')
		.mockImplementation(() => new Promise<void>(() => {}));
	try {
		const exported: number[][] = [];
		const { onReady } = await mountCropper({
			onReady: (cropper) => exported.push(centerPixel(cropper))
		});
		expect(onReady).toHaveBeenCalledTimes(1);
		expect(exported).toEqual([[255, 255, 255, 255]]);
		expect(decode).not.toHaveBeenCalled();
	} finally {
		decode.mockRestore();
	}
});

it('waits for load when the attached image is incomplete and exports its pixels', async () => {
	const exported: number[][] = [];
	const completeAtAttachment: boolean[] = [];
	await render(ImageSourceHarness, {
		src: createTestImage(),
		onReady: (cropper) => exported.push(centerPixel(cropper)),
		attachImage(element, attachSource) {
			element.src = createTestImage(801, 601);
			completeAtAttachment.push(element.complete);

			return attachSource()(element);
		}
	});
	await waitFor(() => exported.length === 1);
	expect(completeAtAttachment).toEqual([false]);
	expect(exported).toEqual([[255, 255, 255, 255]]);
});

it.each([false, true])(
	'waits for image processing readiness and rechecks loading (changed source: %s)',
	async (changeSource) => {
		const element = new Image();
		await new Promise<void>((resolve) => {
			element.addEventListener('load', () => resolve(), { once: true });
			element.src = createTestImage();
		});
		const processing = Promise.withResolvers<void>();
		const exported: number[][] = [];
		const screen = await render(ImageSourceHarness, {
			src: createTestImage(),
			onReady: (cropper) => exported.push(centerPixel(cropper)),
			attachImage: (_element, attachSource) => attachSource(processing.promise)(element)
		});
		await waitFor(() => screen.component.getCropper()?.getState());
		await nextFrame();
		expect(exported).toEqual([]);
		expect(screen.component.getCropper()?.getCanvas()).toBeNull();

		if (changeSource) {
			element.src = createTestImage(801, 601);
		}

		// Hold the replacement's load event until after processing has finished.
		const complete = changeSource
			? vi.spyOn(element, 'complete', 'get').mockReturnValue(false)
			: undefined;
		try {
			processing.resolve();
			await processing.promise;
			await tick();
			if (!changeSource) {
				await waitFor(() => exported.length === 1);
			}

			expect(exported).toEqual(changeSource ? [] : [[255, 255, 255, 255]]);
			expect(Boolean(screen.component.getCropper()?.getCanvas())).toBe(!changeSource);
		} finally {
			complete?.mockRestore();
		}

		await waitFor(() => exported.length === 1);
		expect(exported).toEqual([[255, 255, 255, 255]]);
	}
);

it.each(['reject', 'detach'] as const)(
	'keeps a pending image source unready after %s',
	async (outcome) => {
		const element = new Image();
		await new Promise<void>((resolve) => {
			element.addEventListener('load', () => resolve(), { once: true });
			element.src = createTestImage();
		});
		const processing = Promise.withResolvers<void>();
		const ready = vi.fn<(cropper: CropperInstance) => void>();
		const screen = await render(ImageSourceHarness, {
			src: createTestImage(),
			onReady: ready,
			attachImage: (_element, attachSource) => attachSource(processing.promise)(element)
		});
		await waitFor(() => screen.component.getCropper()?.getState());
		await nextFrame();
		expect(ready).not.toHaveBeenCalled();
		expect(screen.component.getCropper()?.getCanvas()).toBeNull();
		const added = vi.spyOn(element, 'addEventListener');
		if (outcome === 'detach') {
			await screen.unmount();
			processing.resolve();
		} else {
			processing.reject(new Error('Processing failed'));
		}

		await nextFrame();
		expect(ready).not.toHaveBeenCalled();
		expect(added).not.toHaveBeenCalled();
	}
);

it('cleans up a failed image and allows a replacement image to become ready', async () => {
	const ready = vi.fn<(cropper: CropperInstance) => void>();
	let failed: HTMLImageElement | undefined;
	let removed: (() => string[]) | undefined;
	const screen = await render(ImageSourceHarness, {
		src: createTestImage(),
		onReady: ready,
		attachImage(element, attachSource) {
			element.src = 'data:image/png;base64,broken';
			failed = element;
			const removeListener = vi.spyOn(element, 'removeEventListener');
			removed = () => removeListener.mock.calls.map(([name]) => name);

			return attachSource()(element);
		}
	});
	await waitFor(() => failed?.complete);
	await nextFrame();
	expect(ready).not.toHaveBeenCalled();
	expect(screen.component.getCropper()?.getCanvas()).toBeNull();
	expect(removed?.()).toEqual(['load', 'error']);
	await screen.rerender({
		attachImage(element, attachSource) {
			element.src = createTestImage();

			return attachSource()(element);
		}
	});
	await waitFor(() => ready.mock.calls.length === 1);
	expect(centerPixel(ready.mock.calls[0][0])).toEqual([255, 255, 255, 255]);
});

it('does not wait for another event from an already broken image', async () => {
	const broken = new Image();
	await new Promise<void>((resolve) => {
		broken.addEventListener('error', () => resolve(), { once: true });
		broken.src = 'data:image/png;base64,broken';
	});
	const added = vi.spyOn(broken, 'addEventListener');
	const ready = vi.fn<(cropper: CropperInstance) => void>();
	const screen = await render(ImageSourceHarness, {
		src: createTestImage(),
		onReady: ready,
		attachImage: (_element, attachSource) => attachSource()(broken)
	});
	await waitFor(() => screen.component.getCropper()?.getState());
	await screen.component.getCropper()?.refresh();
	expect(broken.complete).toBe(true);
	expect(broken.naturalWidth).toBe(0);
	expect(added).not.toHaveBeenCalled();
	expect(ready).not.toHaveBeenCalled();
	expect(screen.component.getCropper()?.getCanvas()).toBeNull();
});

it('removes pending listeners on detach and ignores stale image loads', async () => {
	const ready = vi.fn<(cropper: CropperInstance) => void>();
	const images = await Promise.all(
		[0, 1].map(async () => {
			const image = new Image();
			await new Promise<void>((resolve) => {
				image.addEventListener('load', () => resolve(), { once: true });
				image.src = createTestImage();
			});

			return image;
		})
	);
	const pending: { load: () => void; removed: () => string[] }[] = [];
	const screen = await render(ImageSourceHarness, {
		src: createTestImage(),
		onReady: ready,
		attachImage(_element, attachSource) {
			const element = images[pending.length];
			// Hold readiness until the test dispatches this generation's load event.
			const complete = vi.spyOn(element, 'complete', 'get').mockReturnValue(false);
			const removed = vi.spyOn(element, 'removeEventListener');
			const cleanup = attachSource()(element);
			complete.mockRestore();
			pending.push({
				load: () => element.dispatchEvent(new Event('load')),
				removed: () => removed.mock.calls.map(([name]) => name)
			});

			return cleanup;
		}
	});
	await waitFor(() => pending.length === 1 && screen.component.getCropper()?.getState());
	const cropper = screen.component.getCropper();
	const image = cropper?.getImage();
	if (!cropper || !image) {
		throw new Error('No cropper image');
	}

	cropper.setImage({ ...image });
	await tick();
	await waitFor(() => pending.length === 2);
	expect(pending[0].removed()).toEqual(['load', 'error']);
	pending[0].load();
	await nextFrame();
	expect(ready).not.toHaveBeenCalled();
	expect(cropper.getCanvas()).toBeNull();
	await screen.unmount();
	expect(pending[1].removed()).toEqual(['load', 'error']);
	pending[1].load();
	await nextFrame();
	expect(ready).not.toHaveBeenCalled();
});

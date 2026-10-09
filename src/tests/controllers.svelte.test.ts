import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { flushSync } from 'svelte';
import ImageHarness from './ImageHarness.svelte';
import UpdateEffectHarness from './UpdateEffectHarness.svelte';
import ResizeListenerHarness from './ResizeListenerHarness.svelte';
import { createTestImage, delay, waitFor } from './fixtures';

describe('ImageLoader', () => {
	it('fires loading callbacks in upstream order, onLoad after loading ends', async () => {
		const log: string[] = [];
		await render(ImageHarness, { src: createTestImage(), log });
		await waitFor(() => log.some((entry) => entry.startsWith('load')));
		// `end` fires while isLoading() is still true (upstream clears it after the callback);
		// `load` fires afterwards, once loading has finished.
		expect(log).toEqual(['start', 'end:true', 'load:false']);
	});

	it('accepts an updater function in setImage', async () => {
		const log: string[] = [];
		const screen = await render(ImageHarness, { src: createTestImage(), log });
		const loader = () => screen.component.getLoader();
		await waitFor(() => loader().getImage());
		const first = loader().getImage();
		loader().setImage((previous) => (previous ? { ...previous, width: 1 } : null));
		expect(loader().getImage()?.width).toBe(1);
		expect(loader().getImage()?.src).toBe(first?.src);
	});

	it('does not report a set image as loaded while a new src is loading', async () => {
		const log: string[] = [];
		const screen = await render(ImageHarness, { src: createTestImage(800, 600), log });
		const loader = () => screen.component.getLoader();
		await waitFor(() => loader().isLoaded());
		const image = loader().getImage();
		if (!image) {
			throw new Error('no image');
		}

		log.length = 0;
		// Both changes land in the same effect flush: the new src's load must win.
		screen.component.setImageAndSrc({ ...image }, createTestImage(400, 300));
		await delay(0);
		expect(loader().isLoaded()).toBe(false);
		expect(loader().isLoading()).toBe(true);
		expect(log).toEqual(['start']);
	});

	it('keeps the latest image when src changes quickly (A → B → A)', async () => {
		const log: string[] = [];
		const a = createTestImage(800, 600);
		const b = createTestImage(400, 300);
		const screen = await render(ImageHarness, { src: a, log });
		await screen.rerender({ src: b });
		await screen.rerender({ src: a });
		const loader = () => screen.component.getLoader();
		await waitFor(() => loader().isLoaded());
		// Give a stale load of B the chance to land and (wrongly) replace A.
		await delay(50);
		expect(loader().getImage()?.width).toBe(800);
		expect(loader().isLoading()).toBe(false);
	});

	it('clears loading when src is removed mid-load', async () => {
		const log: string[] = [];
		const screen = await render(ImageHarness, { src: createTestImage(), log });
		await screen.rerender({ src: null });
		const loader = () => screen.component.getLoader();
		expect(loader().isLoading()).toBe(false);
		// Give the cancelled load the chance to finish and (wrongly) set an image.
		await delay(50);
		expect(loader().getImage()).toBeNull();
	});

	it('fires onLoad once for the latest of several images', async () => {
		const log: string[] = [];
		const screen = await render(ImageHarness, { src: createTestImage(), log });
		const loader = () => screen.component.getLoader();
		await waitFor(() => log.some((entry) => entry.startsWith('load')));
		const image = loader().getImage();
		if (!image) {
			throw new Error('no image');
		}

		log.length = 0;

		loader().setImage({ ...image, width: 1 });
		loader().setImage({ ...image, width: 2 });
		// Let both setImage calls settle, so a stray onLoad for the first one would be logged.
		await delay(20);
		expect(log).toEqual(['load:false']);
		expect(loader().getImage()?.width).toBe(2);

		// Setting the same image again does not fire onLoad.
		const current = loader().getImage();
		loader().setImage(current);
		// Leave time for an onLoad that should not come.
		await delay(20);
		expect(log).toEqual(['load:false']);
	});
});

describe('scalar change effects', () => {
	it('skips the mount run and runs only when a dependency changes', async () => {
		const log: string[] = [];
		const screen = await render(UpdateEffectHarness, { log });
		flushSync();
		expect(log).toEqual([]);

		// A tracked object changes, but the dependency value does not.
		screen.component.setOther(2);
		flushSync();
		expect(log).toEqual([]);

		screen.component.setValue(2);
		flushSync();
		expect(log).toEqual(['run:2']);

		screen.component.setValue(3);
		flushSync();
		expect(log).toEqual(['run:2', 'cleanup', 'run:3']);
	});
});

it('compares the first effect against values captured during initialization and cleans up once', async () => {
	const log: string[] = [];
	const screen = await render(UpdateEffectHarness, { log, changeOnMount: true });
	flushSync();
	expect(log).toEqual(['run:2']);
	await screen.unmount();
	expect(log).toEqual(['run:2', 'cleanup']);
});

it('listens to resize and orientationchange without forwarding events or retaining listeners', async () => {
	const calls: unknown[][] = [];
	const screen = await render(ResizeListenerHarness, { callback: (...args) => calls.push(args) });
	expect(calls).toEqual([]);
	window.dispatchEvent(new Event('resize'));
	window.dispatchEvent(new Event('orientationchange'));
	expect(calls).toEqual([[], []]);
	await screen.unmount();
	window.dispatchEvent(new Event('resize'));
	window.dispatchEvent(new Event('orientationchange'));
	expect(calls).toHaveLength(2);
});

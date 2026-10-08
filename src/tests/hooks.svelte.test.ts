import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import ImageHarness from './ImageHarness.svelte';
import { createTestImage, waitFor } from './fixtures';

describe('useCropperImage', () => {
	it('fires loading callbacks in upstream order, onLoad after loading ends', async () => {
		const log: string[] = [];
		render(ImageHarness, { src: createTestImage(), log });
		await waitFor(() => log.some((entry) => entry.startsWith('load')));
		// `end` fires while isLoading() is still true (upstream clears it after the callback);
		// `load` fires afterwards, once loading has finished.
		expect(log).toEqual(['start', 'end:true', 'load:false']);
	});

	it('accepts an updater function in setImage', async () => {
		const log: string[] = [];
		const screen = render(ImageHarness, { src: createTestImage(), log });
		const hook = () => screen.component.getHook();
		await waitFor(() => hook().getImage());
		const first = hook().getImage();
		hook().setImage((previous) => (previous ? { ...previous, width: 1 } : null));
		expect(hook().getImage()?.width).toBe(1);
		expect(hook().getImage()?.src).toBe(first?.src);
	});

	it('keeps the latest image when src changes quickly (A → B → A)', async () => {
		const log: string[] = [];
		const a = createTestImage(800, 600);
		const b = createTestImage(400, 300);
		const screen = render(ImageHarness, { src: a, log });
		await screen.rerender({ src: b });
		await screen.rerender({ src: a });
		const hook = () => screen.component.getHook();
		await waitFor(() => hook().isLoaded());
		await new Promise((resolve) => setTimeout(resolve, 50));
		expect(hook().getImage()?.width).toBe(800);
		expect(hook().isLoading()).toBe(false);
	});

	it('clears loading when src is removed mid-load', async () => {
		const log: string[] = [];
		const screen = render(ImageHarness, { src: createTestImage(), log });
		await screen.rerender({ src: null });
		const hook = () => screen.component.getHook();
		expect(hook().isLoading()).toBe(false);
		await new Promise((resolve) => setTimeout(resolve, 50));
		expect(hook().getImage()).toBeNull();
	});
});

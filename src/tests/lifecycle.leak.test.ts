import 'advanced-cropper/styles/index.scss';
import { describe, expect, it } from 'vitest';
import { cdp } from 'vitest/browser';
import { mount, unmount } from 'svelte';
import { render } from 'vitest-browser-svelte';
import { Cropper, type CropperInstance } from '#lib';
import { createTestImage, delay, waitFor } from './fixtures';
import Harness from './Harness.svelte';
import photo from './images/exif-orientation-6-quadrants.jpg?url';

// Cycles before the first reading: the engine's code caches and Svelte's template cache
// fill up during the first mounts, which looks like growth but levels off.
const WARM_UP_CYCLES = 300;
const MEASURED_CYCLES = 200;
// Warmed-up runs grow by about 0.6 KiB per cycle; a retained cropper costs over 5 KiB.
const MAX_GROWTH_PER_CYCLE_BYTES = 2048;
// The counters include the Vitest runner page, whose own DOM moves by a node or two. A
// leaked cropper keeps at least one node per cycle, so hundreds over the measured cycles.
const NODE_JITTER = 5;

async function mountAndUnmount(target: HTMLElement, src: string) {
	const { promise: ready, resolve } = Promise.withResolvers<void>();
	const cropper = mount(Cropper, { target, props: { src, onReady: () => resolve() } });
	await ready;
	await unmount(cropper);
}

async function readMemory() {
	const session = cdp();
	// Twice: the first collection can leave objects that only become unreachable after it.
	await session.send('HeapProfiler.collectGarbage');
	await session.send('HeapProfiler.collectGarbage');
	const { usedSize } = await session.send('Runtime.getHeapUsage');
	const { nodes, jsEventListeners } = await session.send('Memory.getDOMCounters');

	return { heap: usedSize, nodes, listeners: jsEventListeners };
}

// Only the weak marker escapes this call; the test must not keep the buffer alive.
const imageBytes = (cropper: CropperInstance | undefined) => {
	const buffer = cropper?.getImage()?.arrayBuffer;
	if (!buffer) {
		throw new Error('The orientation-enabled image load must retain source bytes');
	}

	return new WeakRef(buffer);
};

describe('Cropper lifecycle', () => {
	it('releases image bytes after unloading while still mounted', async () => {
		let ready = false;
		const screen = await render(Harness, {
			src: photo,
			unloadTime: 0,
			onReady: () => {
				ready = true;
			}
		});
		await waitFor(() => ready);
		const bytes = imageBytes(screen.component.getCropper());
		await screen.rerender({ src: null });
		await waitFor(() => screen.component.getCropper()?.getImage() === null);
		await waitFor(() => screen.component.getCropper()?.getState() === null);
		await readMemory();
		expect(bytes.deref()).toBeUndefined();
		expect(screen.component.getCropper()).toBeDefined();
	});

	it('releases everything it creates when unmounted', async () => {
		const target = document.createElement('div');
		target.style.width = '500px';
		target.style.height = '400px';
		document.body.append(target);
		const src = createTestImage();

		const runCycles = async (count: number) => {
			for (let cycle = 0; cycle < count; cycle++) {
				await mountAndUnmount(target, src);
			}

			// Let the image loader's unload timer (500 ms after the last unmount) run out.
			await delay(700);
		};

		await runCycles(WARM_UP_CYCLES);
		const before = await readMemory();
		await runCycles(MEASURED_CYCLES);
		const after = await readMemory();
		target.remove();

		// Detached DOM or a listener left behind by every cycle shows up here.
		expect(after.nodes - before.nodes).toBeLessThanOrEqual(NODE_JITTER);
		expect(after.listeners).toBe(before.listeners);
		expect(after.heap - before.heap).toBeLessThan(MEASURED_CYCLES * MAX_GROWTH_PER_CYCLE_BYTES);
	});
});

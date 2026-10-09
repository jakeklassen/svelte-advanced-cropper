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
const MEASURED_BATCHES = 3;
const GC_SAMPLES = 3;
// Budget per cycle, applied to the median batch growth rather than one noisy pair.
// The scratch retained-instance experiment must exceed this without synthetic padding.
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

function median(values: number[]) {
	const middle = values.toSorted((a, b) => a - b)[Math.floor(values.length / 2)];
	if (middle === undefined) {
		throw new Error('Memory measurements must not be empty');
	}

	return middle;
}

async function settledMemory() {
	const samples: Awaited<ReturnType<typeof readMemory>>[] = [];
	for (let sample = 0; sample < GC_SAMPLES; sample++) {
		await delay(50);
		samples.push(await readMemory());
	}

	return {
		heap: median(samples.map((sample) => sample.heap)),
		nodes: median(samples.map((sample) => sample.nodes)),
		listeners: median(samples.map((sample) => sample.listeners)),
		samples
	};
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

		try {
			await runCycles(WARM_UP_CYCLES);
			const before = await settledMemory();
			const checkpoints = [before];
			const growth: number[] = [];
			let previous = before;
			for (let batch = 0; batch < MEASURED_BATCHES; batch++) {
				await runCycles(MEASURED_CYCLES);
				const after = await settledMemory();
				growth.push(after.heap - previous.heap);
				checkpoints.push(after);
				previous = after;
			}

			// One-off runner/JIT allocations can affect a batch; persistent retention
			// grows across batches. Log all samples for calibration, including failures.
			const medianGrowth = median(growth);
			console.log('Lifecycle memory:', JSON.stringify({ checkpoints, growth, medianGrowth }));
			expect.soft(medianGrowth).toBeLessThan(MEASURED_CYCLES * MAX_GROWTH_PER_CYCLE_BYTES);
			for (const after of checkpoints.slice(1)) {
				// Detached DOM and listeners must remain bounded across every batch.
				expect.soft(after.nodes - before.nodes).toBeLessThanOrEqual(NODE_JITTER);
				expect.soft(after.listeners).toBe(before.listeners);
			}
		} finally {
			target.remove();
		}
	});
});

import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { tick } from 'svelte';
import PendingCropper from './PendingCropper.svelte';
import { pendingRefits } from './refitPending.ts';

vi.mock('svelte-advanced-cropper', () => ({
	Cropper: PendingCropper,
	ImageRestriction: { fitArea: 'fitArea' },
	Priority: { visibleArea: 'visibleArea' }
}));
vi.mock('#site/paths.ts', () => ({ image: (name: string) => name }));

const { default: RefitExample } = await import('../../site/demos/gotchas/RefitExample.svelte');

beforeEach(() => {
	pendingRefits.applied = 0;
	pendingRefits.completions = [];
});

afterEach(() => {
	for (const complete of pendingRefits.completions) {
		complete();
	}
});

async function finishRefreshes() {
	for (const complete of pendingRefits.completions.splice(0)) {
		complete();
	}

	await tick();
}

test('refit applies the fitted area after a current refresh', async () => {
	const screen = await render(RefitExample);
	await expect.poll(() => pendingRefits.completions.length).toBeGreaterThan(0);
	await finishRefreshes();
	expect(pendingRefits.applied).toBeGreaterThan(0);
	await screen.unmount();
});

test('changing strategy invalidates a pending refit', async () => {
	const screen = await render(RefitExample);
	await expect.poll(() => pendingRefits.completions.length).toBeGreaterThan(0);
	await screen.getByRole('radio', { name: 'Do nothing' }).click();
	await finishRefreshes();
	expect(pendingRefits.applied).toBe(0);
	await screen.unmount();
});

test('destroying the demo invalidates a pending refit', async () => {
	const screen = await render(RefitExample);
	await expect.poll(() => pendingRefits.completions.length).toBeGreaterThan(0);
	await screen.unmount();
	await finishRefreshes();
	expect(pendingRefits.applied).toBe(0);
});

import { expect, test, type Page } from '@playwright/test';

interface UploadTracking {
	created: string[];
	revoked: string[];
	release?: () => void;
}

declare global {
	interface Window {
		uploadTracking: UploadTracking;
	}
}

async function trackUploads(page: Page) {
	await page.evaluate(() => {
		const created: string[] = [];
		const revoked: string[] = [];
		const create = URL.createObjectURL.bind(URL);
		const revoke = URL.revokeObjectURL.bind(URL);
		window.uploadTracking = { created, revoked };
		URL.createObjectURL = (blob) => {
			const url = create(blob);
			created.push(url);

			return url;
		};

		URL.revokeObjectURL = (url) => {
			revoked.push(url);
			revoke(url);
		};
	});
}

async function navigateAway(page: Page) {
	// Use a client navigation so destruction runs without discarding the URL ledger.
	await page.locator('a[href="/docs/intro"]').first().click();
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Introduction');
}

for (const [name, path, selector] of [
	['restrictions', '/docs/guides/defaults-and-restrictions', '.custom-restrictions-example'],
	['transforms', '/docs/guides/defaults-and-restrictions', '.default-transforms-example'],
	['load', '/docs/guides/load-images', '.load-image-example'],
	['preview', '/docs/guides/preview-and-export', '.preview-result-example'],
	['HEIC upload', '/docs/guides/load-images', '.heic-upload-example__pick'],
	['wizard', '/', '.croppers-wizard']
]) {
	test(`${name}: uploads release URLs on replacement and destruction`, async ({ page }) => {
		await page.goto(path);
		const input = page.locator(`${selector} input[type="file"]`);
		await trackUploads(page);
		await input.setInputFiles('static/img/images/calico-cat.jpg');
		await expect
			.poll(() => page.evaluate(() => window.uploadTracking.created.length))
			.toBeGreaterThan(0);
		const first = await page.evaluate(() => window.uploadTracking.created[0]);
		await expect(input).toHaveValue('');
		await input.setInputFiles('static/img/images/calico-cat.jpg');
		await expect
			.poll(() => page.evaluate((url) => window.uploadTracking.revoked.includes(url), first))
			.toBe(true);
		await navigateAway(page);
		await expect
			.poll(() =>
				page.evaluate(() =>
					window.uploadTracking.created.every((url) => window.uploadTracking.revoked.includes(url))
				)
			)
			.toBe(true);
	});
}

async function startPendingUpload(page: Page, selector: string) {
	await trackUploads(page);
	await page.locator(selector).evaluate((element) => {
		if (!(element instanceof HTMLInputElement)) {
			throw new Error('Expected a file input');
		}

		// Pause byte preparation at the same await used by conversion, without a decoder fixture.
		const file = new File(['pending photo'], 'pending.jpg', { type: 'image/jpeg' });
		file.arrayBuffer = () =>
			new Promise<ArrayBuffer>((resolve) => {
				window.uploadTracking.release = () => resolve(new ArrayBuffer(16));
			});
		const files = new DataTransfer();
		files.items.add(file);
		element.files = files.files;
		element.dispatchEvent(new Event('change', { bubbles: true }));
	});
	await expect
		.poll(() => page.evaluate(() => typeof window.uploadTracking.release))
		.toBe('function');
}

for (const [name, path, selector] of [
	['HEIC upload', '/docs/guides/load-images', '.heic-upload-example__pick input'],
	['wizard', '/', '.croppers-wizard input[type="file"]']
]) {
	test(`${name}: a prepared URL arriving after destruction is revoked`, async ({ page }) => {
		await page.goto(path);
		await startPendingUpload(page, selector);
		await navigateAway(page);
		await page.evaluate(() => window.uploadTracking.release?.());
		await expect.poll(() => page.evaluate(() => window.uploadTracking.created.length)).toBe(1);
		expect(await page.evaluate(() => window.uploadTracking.revoked)).toEqual(
			await page.evaluate(() => window.uploadTracking.created)
		);
	});
}

test('wizard: a preset wins over pending upload preparation', async ({ page }) => {
	await page.goto('/');
	await startPendingUpload(page, '.croppers-wizard input[type="file"]');
	await page.locator('.croppers-wizard .image').nth(1).click();
	await page.evaluate(() => window.uploadTracking.release?.());
	await expect.poll(() => page.evaluate(() => window.uploadTracking.created.length)).toBe(1);
	expect(await page.evaluate(() => window.uploadTracking.revoked)).toEqual(
		await page.evaluate(() => window.uploadTracking.created)
	);
	await expect(page.locator('.croppers-wizard .advanced-cropper-background-image')).toHaveAttribute(
		'src',
		/yosemite-river/
	);
});

test('resize algorithm responds to container-only width and height changes', async ({ page }) => {
	await page.goto('/docs/algorithms/resize-algorithm');
	const demo = page.locator('.resize-algorithm');
	const boundary = demo.locator('.resize-algorithm__boundary');
	await expect(boundary).toHaveCSS('height', '400px');
	await demo.evaluate((element) => {
		element.style.width = '70px';
		element.style.height = '60px';
	});
	await expect(boundary).toHaveCSS('width', '70px');
	await expect(boundary).toHaveCSS('height', '60px');
	const box = await demo.locator('.resize-algorithm__stencil').boundingBox();
	const area = await boundary.boundingBox();
	if (!box || !area) {
		throw new Error('Expected a visible box and boundary');
	}

	expect(box.width).toBeCloseTo(box.height);
	expect(box.x).toBeGreaterThanOrEqual(area.x);
	expect(box.y).toBeGreaterThanOrEqual(area.y);
	expect(box.x + box.width).toBeLessThanOrEqual(area.x + area.width + 1);
	expect(box.y + box.height).toBeLessThanOrEqual(area.y + area.height + 1);
});

test('synchronous uploads revoke even URLs replaced before Svelte updates', async ({ page }) => {
	await page.goto('/docs/guides/defaults-and-restrictions');
	await trackUploads(page);
	const result = await page
		.locator('.custom-restrictions-example input[type="file"]')
		.evaluate((element) => {
			if (!(element instanceof HTMLInputElement)) {
				throw new Error('Expected a file input');
			}

			for (const name of ['first.jpg', 'second.jpg']) {
				const files = new DataTransfer();
				files.items.add(new File(['photo'], name, { type: 'image/jpeg' }));
				element.files = files.files;
				element.dispatchEvent(new Event('change', { bubbles: true }));
			}

			return window.uploadTracking;
		});
	expect(result.created).toHaveLength(2);
	expect(result.revoked).toEqual([result.created[0]]);
});

test('clearing an uploaded image releases its URL immediately', async ({ page }) => {
	await page.goto('/docs/guides/load-images');
	await trackUploads(page);
	await page
		.locator('.load-image-example input[type="file"]')
		.setInputFiles('static/img/images/calico-cat.jpg');
	await expect
		.poll(() => page.evaluate(() => window.uploadTracking.created.length))
		.toBeGreaterThan(0);
	const url = await page.evaluate(() => window.uploadTracking.created[0]);
	await page.getByRole('button', { name: 'Reset Image' }).click();
	expect(await page.evaluate((value) => window.uploadTracking.revoked.includes(value), url)).toBe(
		true
	);
});

test('selecting a wizard preset releases the current uploaded URL', async ({ page }) => {
	await page.goto('/');
	await trackUploads(page);
	await page
		.locator('.croppers-wizard input[type="file"]')
		.setInputFiles('static/img/images/calico-cat.jpg');
	await expect
		.poll(() => page.evaluate(() => window.uploadTracking.created.length))
		.toBeGreaterThan(0);
	const url = await page.evaluate(() => window.uploadTracking.created[0]);
	await page.locator('.croppers-wizard .image').nth(1).click();
	expect(await page.evaluate((value) => window.uploadTracking.revoked.includes(value), url)).toBe(
		true
	);
	await expect(page.locator('.croppers-wizard .advanced-cropper-background-image')).toHaveAttribute(
		'src',
		/yosemite-river/
	);
});

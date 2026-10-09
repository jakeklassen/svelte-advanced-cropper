import { expect, test } from '@playwright/test';
import { readdir } from 'node:fs/promises';
import { pages } from '../src/site/nav.ts';

test('navigation lists every docs route exactly once', async () => {
	const files = await readdir('src/routes/docs', { recursive: true });
	const routes = files
		.filter((file) => file.endsWith('/+page.svx') || file.endsWith('/+page.svelte'))
		.map((file) => `/docs/${file.replace(/\/\+page\.(svx|svelte)$/, '')}`)
		.toSorted();
	const destinations = pages.map(({ href }) => href);

	expect(new Set(destinations).size).toBe(destinations.length);
	expect(destinations.toSorted()).toEqual(routes);
	for (const destination of destinations) {
		expect(destination).toMatch(/^\/docs\/[a-z0-9-]+(?:\/[a-z0-9-]+)*$/);
	}
});

// Every docs page: renders its title, throws no errors, and every cropper on it loads.
for (const { title, href } of [{ title: 'Home', href: '/' }, ...pages]) {
	test(`${title} (${href})`, async ({ page }) => {
		const errors: string[] = [];
		page.on('pageerror', (error) => errors.push(error.message));
		page.on('console', (message) => {
			if (message.type() === 'error') {
				errors.push(message.text());
			}
		});

		await page.goto(href);
		await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
		if (href !== '/') {
			await expect(
				page
					.getByRole('navigation', { name: 'Documentation', exact: true })
					.locator('[aria-current="page"]')
			).toHaveAttribute('href', new RegExp(`${href}/?$`));
		}

		// The file picker deliberately starts empty and must offer an upload action.
		const upload = page.locator('.load-image-example');
		if ((await upload.count()) > 0) {
			await expect(upload.getByRole('button', { name: 'Upload image', exact: true })).toBeVisible();
		}

		const croppers = page.locator(
			'.advanced-cropper-boundary:not(.load-image-example__cropper .advanced-cropper-boundary)'
		);
		const count = await croppers.count();
		for (let index = 0; index < count; index++) {
			const cropper = croppers.nth(index);
			if (!(await cropper.isVisible())) {
				continue;
			}

			const background = cropper
				.locator('.advanced-cropper__background, .advanced-cropper-preview__image')
				.first();
			await expect(background).toBeAttached({ timeout: 10_000 });
			await expect
				.poll(() =>
					background.evaluate((element) => {
						if (element instanceof HTMLImageElement) {
							return element.complete && element.naturalWidth > 0;
						}

						return element instanceof HTMLCanvasElement && element.width > 0 && element.height > 0;
					})
				)
				.toBe(true);
		}

		expect(errors).toEqual([]);
	});
}

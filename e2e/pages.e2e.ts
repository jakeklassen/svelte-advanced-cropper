import { expect, test } from '@playwright/test';
import { pages } from '../src/site/nav.ts';

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

		const croppers = page.locator('.advanced-cropper-boundary');
		const count = await croppers.count();
		for (let index = 0; index < count; index++) {
			const cropper = croppers.nth(index);
			if (!(await cropper.isVisible())) {
				continue;
			}

			// A loaded cropper has a background image or a custom background element.
			await expect(
				cropper.locator('.advanced-cropper__background, .advanced-cropper-preview__image').first()
			).toBeAttached({ timeout: 10_000 });
		}

		expect(errors).toEqual([]);
	});
}

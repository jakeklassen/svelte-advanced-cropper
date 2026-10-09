import { expect, test } from '@playwright/test';

const routes = [
	'/docs/composition/stencil-context',
	'/docs/tutorials/absolute-zoom',
	'/docs/intro',
	'/docs/reference/image-primitives',
	'/docs/reference/types-and-utilities',
	'/docs/migration/from-0-1'
];

for (const theme of ['light', 'dark']) {
	for (const route of routes) {
		test(`375px prose stays within the viewport: ${theme} ${route}`, async ({ page }) => {
			await page.setViewportSize({ width: 375, height: 812 });
			await page.addInitScript((value) => localStorage.setItem('theme', value), theme);
			await page.goto(route);
			await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
			await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
			await page.evaluate(() => document.fonts.ready);
			const dimensions = await page.evaluate(() => ({
				viewport: document.documentElement.clientWidth,
				document: document.documentElement.scrollWidth
			}));

			expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport);
		});
	}
}

import { expect, test } from '@playwright/test';

test('home page renders the hero and a working cropper', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByRole('heading', { level: 1 })).toHaveText(
		'Build the cropper your design needs'
	);
	// The wizard's default cropper loads its image and shows a stencil.
	await expect(page.locator('.advanced-cropper-rectangle-stencil').first()).toBeVisible();
});

test('docs pages render with navigation', async ({ page }) => {
	await page.goto('/docs/intro');
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Getting started');
	await expect(page.locator('.advanced-cropper-background-image').first()).toBeVisible();
	await page.getByRole('link', { name: 'Recipes', exact: true }).first().click();
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Recipes');
});

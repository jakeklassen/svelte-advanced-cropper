import { expect, test } from '@playwright/test';
import { pages } from '../src/site/nav.ts';

const routes = [
	'/docs/composition/stencil-context',
	'/docs/tutorials/absolute-zoom',
	'/docs/intro',
	...pages.filter((page) => page.href.startsWith('/docs/reference/')).map((page) => page.href)
];

for (const fonts of ['default', 'wide']) {
	for (const theme of ['light', 'dark']) {
		for (const route of routes) {
			test(`375px prose stays within the viewport: ${fonts} ${theme} ${route}`, async ({
				page
			}) => {
				await page.setViewportSize({ width: 375, height: 812 });
				await page.addInitScript((value) => localStorage.setItem('theme', value), theme);
				await page.goto(route);
				await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
				await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
				if (fonts === 'wide') {
					await page.addStyleTag({
						content: `:root {
						--font-sans: 'DejaVu Sans', sans-serif;
						--font-mono: 'DejaVu Sans Mono', 'Liberation Mono', monospace;
					}`
					});
				}

				await page.evaluate(() => document.fonts.ready);
				const dimensions = await page.evaluate(() => {
					const viewport = document.documentElement.clientWidth;
					const offenders: string[] = [];
					for (const element of document.querySelectorAll('body *')) {
						const box = element.getBoundingClientRect();
						if (!box.width || !box.height) {
							continue;
						}

						// A block's box can fit while its unbroken text extends beyond it.
						let right = Math.max(box.right, box.left + element.scrollWidth);
						let ancestor: Element | null = element;
						while (ancestor) {
							if (getComputedStyle(ancestor).overflowX !== 'visible') {
								right = Math.min(right, ancestor.getBoundingClientRect().right);
							}

							ancestor = ancestor.parentElement;
						}

						if (right <= viewport) {
							continue;
						}

						const parts: string[] = [];
						let current: Element | null = element;
						while (current) {
							if (current.id) {
								parts.unshift(`#${CSS.escape(current.id)}`);
								break;
							}

							const parent: Element | null = current.parentElement;
							const position = parent ? [...parent.children].indexOf(current) + 1 : 1;
							parts.unshift(`${current.localName}:nth-child(${position})`);
							current = parent;
						}

						offenders.push(
							`${parts.join(' > ')}: width=${box.width.toFixed(2)}px, scrollWidth=${element.scrollWidth}px, right=${right.toFixed(2)}px`
						);
					}

					return { viewport, document: document.documentElement.scrollWidth, offenders };
				});

				expect(
					dimensions.document,
					`Document width ${dimensions.document}px exceeds viewport ${dimensions.viewport}px on ${route} (${theme}, ${fonts} fonts).\nElements extending beyond the viewport:\n${dimensions.offenders.join('\n')}`
				).toBeLessThanOrEqual(dimensions.viewport);
			});
		}
	}
}

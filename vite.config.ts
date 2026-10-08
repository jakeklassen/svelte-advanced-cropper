import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { svelte, vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { mdsvex } from 'mdsvex';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import type { Plugin } from 'vite';
import { highlight, highlighter } from './src/site/highlight.ts';
import { rehypeBasePath, rehypeHeadingIds } from './src/site/markdown.ts';
import { coreScssDeprecations } from './scripts/sass.ts';

const base = (process.env.BASE_PATH ?? '') as '' | `/${string}`;
// STRICT_LINKS=1 (CI, deploys) fails the build on broken internal links and anchors.
const brokenLinkHandling = process.env.STRICT_LINKS ? 'fail' : 'warn';

/**
 * `import source from './Demo.svelte?highlight'` gives `{ code, html }`: the file's
 * source and its Shiki-highlighted HTML, computed at build time so the docs can show
 * each demo's real code without shipping a highlighter.
 */
function highlightImports(): Plugin {
	const suffix = '?highlight';
	const prefix = '\0highlight:';

	return {
		name: 'highlight-imports',
		enforce: 'pre',
		async resolveId(source, importer) {
			if (!source.endsWith(suffix)) {
				return null;
			}

			const resolved = await this.resolve(source.slice(0, -suffix.length), importer, {
				skipSelf: true
			});

			// A virtual id, so that no other plugin (e.g. the Svelte compiler) handles it.
			return resolved && `${prefix}${resolved.id}.js`;
		},
		async load(id) {
			if (!id.startsWith(prefix)) {
				return null;
			}

			const file = id.slice(prefix.length, -'.js'.length);
			this.addWatchFile(file);
			const code = await readFile(file, 'utf8');
			// The extension names the language; `highlight` falls back to plain text for unknown ones.
			const lang = file.split('.').pop() ?? 'text';

			return `export default ${JSON.stringify({ code, html: highlight(code, lang) })};`;
		}
	};
}

// The library's tests need only Svelte, not the docs site. Without SvelteKit the test
// server starts faster, and a request for a missing file gets a plain 404 instead of booting
// the site's server renderer (about 10 seconds the first time).
const libraryTestConfig = {
	plugins: [svelte({ compilerOptions: { runes: true } })],
	css: { preprocessorOptions: { scss: { silenceDeprecations: coreScssDeprecations } } }
};

export default defineConfig({
	resolve: {
		// Demos import the package by name, so the source shown in the docs is what users write.
		alias: {
			'svelte-advanced-cropper': fileURLToPath(new URL('./src/lib/index.ts', import.meta.url))
		}
	},
	plugins: [
		highlightImports(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},

			extensions: ['.svelte', '.svx'],
			// mdsvex must run first: it turns code fences into escaped HTML, so `<style>` text
			// inside docs code samples is not mistaken for a real style block.
			preprocess: [
				mdsvex({
					extensions: ['.svx'],
					highlight: { highlighter },
					rehypePlugins: [rehypeHeadingIds, rehypeBasePath(base)]
				}),
				vitePreprocess()
			],
			// The docs site is fully prerendered for GitHub Pages.
			adapter: adapter({ fallback: '404.html' }),
			prerender: {
				handleHttpError: brokenLinkHandling,
				handleMissingId: brokenLinkHandling
			},
			paths: { base }
		})
	],
	css: {
		preprocessorOptions: {
			scss: { silenceDeprecations: coreScssDeprecations }
		}
	},
	test: {
		expect: { requireAssertions: true },
		projects: [
			{
				// Inline projects inherit this file (SvelteKit and all) unless told not to.
				extends: false,
				...libraryTestConfig,
				test: {
					name: 'client',
					browser: {
						enabled: true,
						provider: playwright(),
						instances: [{ browser: 'chromium', headless: true }]
					},
					include: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			},

			{
				// Inline projects inherit this file (SvelteKit and all) unless told not to.
				extends: false,
				...libraryTestConfig,
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}', 'src/**/*.leak.test.ts']
				}
			},

			// Memory checks read browser-wide counters (heap, DOM nodes, listeners), so they run
			// alone, after the other projects have finished.
			{
				// Inline projects inherit this file (SvelteKit and all) unless told not to.
				extends: false,
				...libraryTestConfig,
				test: {
					name: 'leak',
					browser: {
						enabled: true,
						provider: playwright(),
						instances: [{ browser: 'chromium', headless: true }]
					},
					include: ['src/**/*.leak.test.ts'],
					fileParallelism: false,
					sequence: { groupOrder: 1 },
					testTimeout: 120_000
				}
			}
		]
	}
});

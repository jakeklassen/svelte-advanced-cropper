import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { mdsvex } from 'mdsvex';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import type { Plugin } from 'vite';
import { highlight, highlighter } from './src/site/highlight.ts';
import { rehypeBasePath, rehypeHeadingIds } from './src/site/markdown.ts';

const base = (process.env.BASE_PATH ?? '') as '' | `/${string}`;

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
			if (!source.endsWith(suffix)) return null;
			const resolved = await this.resolve(source.slice(0, -suffix.length), importer, {
				skipSelf: true
			});
			// A virtual id, so that no other plugin (e.g. the Svelte compiler) handles it.
			return resolved && `${prefix}${resolved.id}.js`;
		},
		async load(id) {
			if (!id.startsWith(prefix)) return null;
			const file = id.slice(prefix.length, -'.js'.length);
			this.addWatchFile(file);
			const code = await readFile(file, 'utf8');
			const extension = file.split('.').pop() ?? 'text';
			const lang =
				{ svelte: 'svelte', ts: 'ts', js: 'js', css: 'css', scss: 'scss' }[extension] ?? 'text';
			return `export default ${JSON.stringify({ code, html: highlight(code, lang) })};`;
		}
	};
}

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
			// STRICT_LINKS=1 (CI, deploys) fails the build on broken internal links and anchors.
			prerender: {
				handleHttpError: process.env.STRICT_LINKS ? 'fail' : 'warn',
				handleMissingId: process.env.STRICT_LINKS ? 'fail' : 'warn'
			},
			paths: { base }
		})
	],
	css: {
		preprocessorOptions: {
			// The advanced-cropper core SCSS still uses `@import` and global color functions.
			scss: { silenceDeprecations: ['import', 'global-builtin', 'color-functions'] }
		}
	},
	test: {
		expect: { requireAssertions: true },
		// Remove once src/lib has tests; until then an empty run should not fail.
		passWithNoTests: true,
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'client',
					browser: {
						enabled: true,
						provider: playwright(),
						instances: [{ browser: 'chromium', headless: true }]
					},
					include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
					exclude: ['src/lib/server/**']
				}
			},

			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	}
});

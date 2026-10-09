// Compiles the advanced-cropper core SCSS into the stylesheets this package ships,
// Output layout:
//   dist/style.css          base styles + default theme
//   dist/themes/<name>.css  each theme, plus the .scss source for customisation
// Run after svelte-package (it clears dist/).
import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import autoprefixer from 'autoprefixer';
import postcss from 'postcss';
import { compile } from 'sass';
import { coreScssDeprecations } from './sass.ts';

const require = createRequire(import.meta.url);
const coreDir = dirname(require.resolve('advanced-cropper/package.json'));
const distDir = join(import.meta.dirname, '..', 'dist');
const themes = ['compact', 'classic', 'bubble', 'corners', 'default'];

// Upstream runs Autoprefixer over the compiled CSS (browserslist defaults).
const prefixer = postcss([autoprefixer]);

function compileScss(file: string): string {
	const { css } = compile(file, { silenceDeprecations: coreScssDeprecations });

	return prefixer.process(css, { from: file }).css;
}

const baseCss = compileScss(join(coreDir, 'styles/index.scss'));
const defaultThemeCss = compileScss(join(coreDir, 'themes/default.scss'));
writeFileSync(join(distDir, 'style.css'), `${baseCss}\n${defaultThemeCss}\n`);

mkdirSync(join(distDir, 'themes'), { recursive: true });
for (const theme of themes) {
	const scssFile = join(coreDir, 'themes', `${theme}.scss`);
	writeFileSync(join(distDir, 'themes', `${theme}.css`), compileScss(scssFile));
	copyFileSync(scssFile, join(distDir, 'themes', `${theme}.scss`));
}

console.log(`Wrote dist/style.css and ${themes.length} themes`);

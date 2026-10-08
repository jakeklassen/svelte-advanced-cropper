// Compiles the advanced-cropper core SCSS into the stylesheets this package ships,
// matching react-advanced-cropper's dist layout:
//   dist/style.css          base styles + default theme
//   dist/themes/<name>.css  each theme, plus the .scss source for customisation
// Run after svelte-package (it clears dist/).
import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { compile, type Options } from 'sass';

const require = createRequire(import.meta.url);
const core = dirname(require.resolve('advanced-cropper/package.json'));
const out = join(import.meta.dirname, '..', 'dist');
const themes = ['compact', 'classic', 'bubble', 'corners', 'default'];

// The core still uses `@import` and global color functions; those are its concern.
const options: Options<'sync'> = {
	silenceDeprecations: ['import', 'global-builtin', 'color-functions']
};
const build = (file: string) => compile(file, options).css;

writeFileSync(
	join(out, 'style.css'),
	`${build(join(core, 'styles/index.scss'))}\n${build(join(core, 'themes/default.scss'))}\n`
);

mkdirSync(join(out, 'themes'), { recursive: true });
for (const theme of themes) {
	const source = join(core, 'themes', `${theme}.scss`);
	writeFileSync(join(out, 'themes', `${theme}.css`), build(source));
	copyFileSync(source, join(out, 'themes', `${theme}.scss`));
}

console.log(`Wrote dist/style.css and ${themes.length} themes`);

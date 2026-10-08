import type { DeprecationOrId } from 'sass';

/**
 * Sass deprecations raised by the advanced-cropper core SCSS, which still uses `@import` and
 * global color functions. Those are the core's concern, so both the docs site (vite.config.ts)
 * and the packaged stylesheets (build-styles.ts) silence them.
 */
export const coreScssDeprecations: DeprecationOrId[] = [
	'import',
	'global-builtin',
	'color-functions'
];

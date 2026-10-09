export interface NavLink {
	title: string;
	href: string;
}

export interface NavGroup {
	title: string;
	items: NavLink[];
}

export type NavEntry = NavLink | NavGroup;

export function isGroup(entry: NavEntry): entry is NavGroup {
	return 'items' in entry;
}

/** Docs sidebar grouped by user task. */
export const nav: NavEntry[] = [
	{
		title: 'Getting started',
		items: [{ title: 'Introduction', href: '/docs/intro' }]
	},
	{
		title: 'Guides',
		items: [
			{ title: 'Choose a cropper', href: '/docs/guides/cropper-types' },
			{ title: 'Stencils and aspect ratios', href: '/docs/guides/stencils' },
			{ title: 'Read and change the crop', href: '/docs/guides/crop-state' },
			{ title: 'Load images', href: '/docs/guides/load-images' },
			{ title: 'Preview and export', href: '/docs/guides/preview-and-export' },
			{ title: 'Move, zoom, rotate, and flip', href: '/docs/guides/image-transforms' },
			{ title: 'Defaults and restrictions', href: '/docs/guides/defaults-and-restrictions' },
			{ title: 'Themes', href: '/docs/guides/themes' },
			{ title: 'Styling', href: '/docs/guides/styling' },
			{ title: 'Layout and lifecycle', href: '/docs/guides/layout-and-lifecycle' },
			{ title: 'Gestures and page scrolling', href: '/docs/guides/gestures' },
			{ title: 'Cross-origin images', href: '/docs/guides/cross-origin' },
			{ title: 'Troubleshooting', href: '/docs/guides/gotchas' }
		]
	},
	{
		title: 'Composition',
		items: [
			{ title: 'Compose a cropper', href: '/docs/composition/overview' },
			{ title: 'Replace layers with snippets', href: '/docs/composition/layers' },
			{ title: 'Build a stencil with context', href: '/docs/composition/stencil-context' },
			{ title: 'Customize previews', href: '/docs/composition/previews' }
		]
	},
	{
		title: 'Tutorials',
		items: [
			{ title: 'Custom stencil', href: '/docs/tutorials/custom-stencil' },
			{ title: 'Absolute zoom', href: '/docs/tutorials/absolute-zoom' },
			{ title: 'Image editor', href: '/docs/tutorials/image-editor' },
			{ title: 'Print guides', href: '/docs/tutorials/print-guides' }
		]
	},
	{
		title: 'Examples',
		items: [{ title: 'Showcase', href: '/docs/showcase' }]
	},
	{
		title: 'API reference',
		items: [
			{ title: 'Cropper', href: '/docs/reference/cropper' },
			{ title: 'FixedCropper', href: '/docs/reference/fixed-cropper' },
			{ title: 'RectangleStencil', href: '/docs/reference/rectangle-stencil' },
			{ title: 'CircleStencil', href: '/docs/reference/circle-stencil' },
			{ title: 'CropperPreview', href: '/docs/reference/cropper-preview' },
			{ title: 'Cropper instance', href: '/docs/reference/cropper-instance' },
			{ title: 'Snippet contracts', href: '/docs/reference/snippets' },
			{ title: 'Stencil context', href: '/docs/reference/stencil-context' },
			{ title: 'Stencil building blocks', href: '/docs/reference/stencil-primitives' },
			{ title: 'Image and layout building blocks', href: '/docs/reference/image-primitives' },
			{
				title: 'Gesture and transition building blocks',
				href: '/docs/reference/interaction-primitives'
			},
			{ title: 'Styling contract', href: '/docs/reference/styling' },
			{ title: 'Types and utilities', href: '/docs/reference/types-and-utilities' }
		]
	},
	{
		title: 'Core',
		items: [
			{ title: 'State and coordinate spaces', href: '/docs/core/state' },
			{ title: 'Settings and defaults', href: '/docs/core/settings' },
			{ title: 'State modifiers', href: '/docs/core/modifiers' },
			{ title: 'Utilities', href: '/docs/core/utilities' },
			{ title: 'Resize algorithm', href: '/docs/algorithms/resize-algorithm' },
			{ title: 'Extensions', href: '/docs/core/extensions' }
		]
	},
	{
		title: 'Migration',
		items: [
			{ title: 'Upgrade from 0.1.x', href: '/docs/migration/from-0-1' },
			{ title: 'Coming from react-advanced-cropper', href: '/docs/migration/from-react' }
		]
	}
];

/** Every docs page in reading order, for prev/next links. */
export const pages: NavLink[] = nav.flatMap((entry) => (isGroup(entry) ? entry.items : [entry]));

/**
 * Whether the browser's `pathname` is the docs page at `path`. The pathname may carry the deploy
 * base path and a trailing slash, so only its end is compared.
 */
export function isCurrentPage(pathname: string, path: string): boolean {
	return pathname.replace(/\/$/, '').endsWith(path);
}

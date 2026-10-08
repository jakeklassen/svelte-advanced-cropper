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

/** Docs sidebar, in upstream order. */
export const nav: NavEntry[] = [
	{ title: 'Getting started', href: '/docs/intro' },
	{
		title: 'Guides',
		items: [
			{ title: 'Recipes', href: '/docs/guides/recipes' },
			{ title: 'Advanced Recipes', href: '/docs/guides/advanced-recipes' },
			{ title: 'Cropper Types', href: '/docs/guides/cropper-types' },
			{ title: 'Cropper Themes', href: '/docs/guides/themes' },
			{ title: 'Customize Appearance', href: '/docs/guides/customize-appearance' },
			{ title: 'Components / Hooks', href: '/docs/guides/components-and-hooks' },
			{ title: 'Cross-Origin', href: '/docs/guides/cross-origin' },
			{ title: 'Coming from React', href: '/docs/guides/coming-from-react' }
		]
	},
	{ title: 'Showcase', href: '/docs/showcase' },
	{
		title: 'Tutorials',
		items: [
			{ title: 'Custom Stencil', href: '/docs/tutorials/custom-stencil' },
			{ title: 'Absolute Zoom', href: '/docs/tutorials/absolute-zoom' },
			{ title: 'Image Editor', href: '/docs/tutorials/image-editor' }
		]
	},
	{
		title: 'Components',
		items: [
			{ title: 'Cropper', href: '/docs/components/Cropper' },
			{ title: 'FixedCropper', href: '/docs/components/FixedCropper' },
			{ title: 'RectangleStencil', href: '/docs/components/RectangleStencil' },
			{ title: 'CircleStencil', href: '/docs/components/CircleStencil' },
			{ title: 'CropperPreview', href: '/docs/components/CropperPreview' },
			{ title: 'BoundingBox', href: '/docs/components/BoundingBox' },
			{ title: 'CropperBackgroundImage', href: '/docs/components/CropperBackgroundImage' },
			{ title: 'CropperBackgroundWrapper', href: '/docs/components/CropperBackgroundWrapper' },
			{ title: 'CropperCanvas', href: '/docs/components/CropperCanvas' },
			{ title: 'CropperSource', href: '/docs/components/CropperSource' },
			{ title: 'CropperWrapper', href: '/docs/components/CropperWrapper' },
			{ title: 'DraggableArea', href: '/docs/components/DraggableArea' },
			{ title: 'DraggableElement', href: '/docs/components/DraggableElement' },
			{ title: 'SimpleHandler', href: '/docs/components/SimpleHandler' },
			{ title: 'SimpleLine', href: '/docs/components/SimpleLine' },
			{ title: 'StencilOverlay', href: '/docs/components/StencilOverlay' },
			{ title: 'StencilWrapper', href: '/docs/components/StencilWrapper' },
			{ title: 'StretchableBoundary', href: '/docs/components/StretchableBoundary' },
			{ title: 'TransformableImage', href: '/docs/components/TransformableImage' }
		]
	},
	{
		title: 'Hooks',
		items: [
			{ title: 'useAbstractCropper', href: '/docs/hooks/useAbstractCropper' },
			{ title: 'useCropperInstance', href: '/docs/hooks/useCropperInstance' },
			{ title: 'useCropperImage', href: '/docs/hooks/useCropperImage' },
			{ title: 'useMoveImageOptions', href: '/docs/hooks/useMoveImageOptions' },
			{ title: 'useScaleImageOptions', href: '/docs/hooks/useScaleImageOptions' },
			{ title: 'useRotateImageOptions', href: '/docs/hooks/useRotateImageOptions' },
			{ title: 'useUpdateEffect', href: '/docs/hooks/useUpdateEffect' },
			{ title: 'useWindowResize', href: '/docs/hooks/useWindowResize' }
		]
	},
	{
		title: 'Concept',
		items: [
			{ title: 'Introduction', href: '/docs/concept/introduction' },
			{ title: 'State', href: '/docs/concept/state' },
			{ title: 'Modifiers', href: '/docs/concept/modifiers' },
			{ title: 'Settings', href: '/docs/concept/settings' },
			{ title: 'Defaults', href: '/docs/concept/defaults' },
			{ title: 'Utils', href: '/docs/concept/utils' }
		]
	},
	{ title: 'FAQ', href: '/docs/faq' },
	{
		title: 'Algorithms',
		items: [{ title: 'Resize Algorithm', href: '/docs/algorithms/resize-algorithm' }]
	}
];

/** Every docs page in reading order, for prev/next links. */
export const pages: NavLink[] = nav.flatMap((entry) => (isGroup(entry) ? entry.items : [entry]));

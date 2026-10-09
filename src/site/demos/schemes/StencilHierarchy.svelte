<script lang="ts">
	import HierarchyTree from './HierarchyTree.svelte';
	import type { HierarchyNode } from './hierarchy.ts';

	const root: HierarchyNode = {
		title: 'RectangleStencil / CircleStencil',
		kind: 'component',
		to: '/docs/reference/rectangle-stencil',
		note: 'child of Cropper or FixedCropper',
		children: [
			{
				title: 'getCropperContext()',
				kind: 'context',
				note: 'registerStencil · reactive cropper, disabled, image'
			},
			{
				title: 'StencilWrapper',
				kind: 'component',
				to: '/docs/reference/stencil-primitives#stencil-wrapper',
				children: [
					{
						title: 'BoundingBox',
						kind: 'component',
						to: '/docs/reference/stencil-primitives#bounding-box',
						children: [
							{
								title: 'line',
								kind: 'snippet',
								note: 'SimpleLine by default',
								children: [{ title: 'LineWrapper → DraggableArea', kind: 'component' }]
							},
							{
								title: 'handler',
								kind: 'snippet',
								note: 'SimpleHandler by default',
								children: [{ title: 'HandlerWrapper → DraggableArea', kind: 'component' }]
							},
							{
								title: 'DraggableArea',
								kind: 'component',
								to: '/docs/reference/interaction-primitives#draggable-area',
								children: [
									{
										title: 'StencilOverlay',
										kind: 'component',
										to: '/docs/reference/stencil-primitives#stencil-overlay',
										children: [
											{ title: 'StencilGrid', kind: 'component', note: 'grid prop' },
											{ title: 'preview <div>', kind: 'component', note: '__preview selector' }
										]
									},
									{
										title: 'children',
										kind: 'snippet',
										note: 'custom guides inside the crop region'
									}
								]
							}
						]
					}
				]
			}
		]
	};
</script>

<HierarchyTree {root} label="Child stencil composition" />

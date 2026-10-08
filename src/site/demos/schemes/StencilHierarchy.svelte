<script lang="ts">
	import HierarchyTree from './HierarchyTree.svelte';
	import type { HierarchyNode } from './hierarchy.ts';

	// A line or handler wrapper, with the DraggableElement inside it.
	const wrapperWithDraggable = (title: string): HierarchyNode[] => [
		{
			title,
			kind: 'component',
			children: [
				{ title: 'DraggableElement', kind: 'component', to: '/docs/components/DraggableElement' }
			]
		}
	];

	const root: HierarchyNode = {
		title: 'RectangleStencil / CircleStencil',
		kind: 'replaceable',
		to: '/docs/components/RectangleStencil',
		note: 'stencilComponent',
		children: [
			{
				title: 'StencilWrapper',
				kind: 'component',
				to: '/docs/components/StencilWrapper',
				children: [
					{
						title: 'BoundingBox',
						kind: 'component',
						to: '/docs/components/BoundingBox',
						children: [
							{
								title: 'SimpleLine',
								kind: 'replaceable',
								to: '/docs/components/SimpleLine',
								note: 'lineComponent',
								children: wrapperWithDraggable('LineWrapper')
							},
							{
								title: 'SimpleHandler',
								kind: 'replaceable',
								to: '/docs/components/SimpleHandler',
								note: 'handlerComponent',
								children: wrapperWithDraggable('HandlerWrapper')
							},
							{
								title: 'DraggableArea',
								kind: 'component',
								to: '/docs/components/DraggableArea',
								children: [
									{
										title: 'StencilOverlay',
										kind: 'component',
										to: '/docs/components/StencilOverlay',
										children: [
											{ title: 'StencilGrid', kind: 'component', note: 'grid' },
											{ title: 'preview <div>', kind: 'component', note: 'previewClassName' }
										]
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

<HierarchyTree {root} label="Default stencil hierarchy" />

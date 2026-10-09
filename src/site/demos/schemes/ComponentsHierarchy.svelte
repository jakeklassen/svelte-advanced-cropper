<script lang="ts">
	import HierarchyTree from './HierarchyTree.svelte';
	import type { HierarchyNode } from './hierarchy.ts';

	const root: HierarchyNode = {
		title: 'Cropper / FixedCropper',
		kind: 'component',
		to: '/docs/reference/cropper',
		children: [
			{
				title: 'getCropperContext()',
				kind: 'context',
				note: 'cropper, disabled, image, registerStencil'
			},
			{
				title: 'wrapper',
				kind: 'snippet',
				note: 'CropperWrapper by default',
				children: [
					{
						title: 'boundary',
						kind: 'snippet',
						note: 'StretchableBoundary · registerBoundary',
						children: [
							{
								title: 'backgroundWrapper',
								kind: 'snippet',
								note: 'CropperBackgroundWrapper by default',
								children: [
									{
										title: 'background',
										kind: 'snippet',
										note: 'CropperBackgroundImage · attachSource'
									},
									{
										title: 'children',
										kind: 'snippet',
										note: 'default RectangleStencil when omitted',
										children: [
											{
												title: 'RectangleStencil / CircleStencil / custom stencil',
												kind: 'component',
												note: 'registers options through context'
											}
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

<HierarchyTree {root} label="Cropper composition: components, context, and snippets" />

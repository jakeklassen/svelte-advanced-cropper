<script lang="ts">
	import HierarchyTree from './HierarchyTree.svelte';
	import type { HierarchyNode } from './hierarchy.ts';

	const root: HierarchyNode = {
		title: 'Cropper',
		kind: 'component',
		to: '/docs/components/Cropper',
		children: [
			{
				title: 'AbstractCropper',
				kind: 'component',
				children: [
					{
						title: 'useAbstractCropper',
						kind: 'hook',
						to: '/docs/hooks/useAbstractCropper',
						children: [
							{ title: 'useCropperInstance', kind: 'hook', to: '/docs/hooks/useCropperInstance' },
							{ title: 'useCropperImage', kind: 'hook', to: '/docs/hooks/useCropperImage' }
						]
					},
					{
						title: 'CropperWrapper',
						kind: 'replaceable',
						to: '/docs/components/CropperWrapper',
						note: 'wrapperComponent',
						children: [
							{
								title: 'StretchableBoundary',
								kind: 'replaceable',
								to: '/docs/components/StretchableBoundary',
								note: 'boundaryComponent',
								children: [
									{
										title: 'CropperBackgroundWrapper',
										kind: 'replaceable',
										to: '/docs/components/CropperBackgroundWrapper',
										note: 'backgroundWrapperComponent',
										children: [
											{
												title: 'CropperBackgroundImage',
												kind: 'replaceable',
												to: '/docs/components/CropperBackgroundImage',
												note: 'backgroundComponent'
											},
											{
												title: 'Stencil',
												kind: 'replaceable',
												note: 'stencilComponent'
											}
										]
									},
									{
										title: 'CropperCanvas',
										kind: 'component',
										to: '/docs/components/CropperCanvas'
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

<HierarchyTree {root} label="Cropper component and hook hierarchy" />

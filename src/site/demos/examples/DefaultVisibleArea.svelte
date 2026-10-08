<script lang="ts">
	import { Cropper, Priority } from 'svelte-advanced-cropper';
	import { image } from '#site/paths.ts';

	const src = image('orange-cat-on-table.jpg');

	// The cat's head, in the photo's own pixels (1400×1960).
	const defaultVisibleArea = {
		width: 800,
		height: 775,
		left: 175,
		top: 340
	};
</script>

<Cropper
	class="default-visible-area-example"
	{src}
	{defaultVisibleArea}
	priority={Priority.visibleArea}
/>

<style>
	:global(.default-visible-area-example) {
		max-height: 450px;
		background: #354146;
	}
</style>

<script lang="ts">
	import { Cropper, Priority } from 'svelte-advanced-cropper';
	import { image } from '#site/paths.ts';

	const defaultVisibleArea = {
		width: 800,
		height: 775,
		left: 63,
		top: 668
	};
</script>

<Cropper
	class="default-visible-area-example"
	src={image('photo-1602718571797-49d5e9d54563.jpg')}
	{defaultVisibleArea}
	priority={Priority.visibleArea}
/>

<style>
	:global(.default-visible-area-example) {
		max-height: 450px;
		background: #354146;
	}
</style>

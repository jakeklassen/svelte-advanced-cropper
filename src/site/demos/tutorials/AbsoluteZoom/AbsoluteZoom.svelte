<script lang="ts">
	import { image } from '#site/paths.ts';
	import CustomCropper from './CustomCropper.svelte';

	const src = image('calico-cat.jpg');
</script>

<CustomCropper
	class="absolute-zoom-tutorial"
	{src}
	stencilSize={{
		width: 350,
		height: 350
	}}
/>

<style>
	:global(.absolute-zoom-tutorial) {
		max-height: 500px;
	}
</style>

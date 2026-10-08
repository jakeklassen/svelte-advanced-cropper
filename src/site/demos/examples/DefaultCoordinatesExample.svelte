<script lang="ts">
	import { Cropper } from 'svelte-advanced-cropper';
	import { image } from '#site/paths.ts';

	const src = image('sunlit-forest.jpg');
</script>

<Cropper
	class="default-coordinates-example"
	{src}
	defaultCoordinates={{
		width: 600,
		height: 600,
		left: 150,
		top: 150
	}}
/>

<style>
	:global(.default-coordinates-example) {
		max-height: 450px;
		background: #354146;
	}
</style>

<script lang="ts">
	import { Cropper } from 'svelte-advanced-cropper';
	import { image } from '#site/paths.ts';
</script>

<Cropper
	class="default-coordinates-example"
	src={image('photo-1527199372136-dff50c10ea34.jpg')}
	defaultCoordinates={{
		width: 400,
		height: 400,
		left: 100,
		top: 100
	}}
/>

<style>
	:global(.default-coordinates-example) {
		max-height: 450px;
		background: #354146;
	}
</style>

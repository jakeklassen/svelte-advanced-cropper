<script lang="ts">
	import { Cropper, ImageRestriction } from 'svelte-advanced-cropper';
	import BackgroundWrapperWithNotifications from './BackgroundWrapperWithNotifications.svelte';
	import { image } from '#site/paths.ts';
</script>

<Cropper
	class="cropper-scroll-example"
	stencilProps={{
		movable: false,
		resizable: false,
		handlers: {},
		lines: {}
	}}
	transformImage={{
		adjustStencil: false
	}}
	imageRestriction={ImageRestriction.stencil}
	backgroundWrapperComponent={BackgroundWrapperWithNotifications}
	src={image('photo-1633158617942-204b1469bc05.jpg')}
/>

<style>
	:global(.cropper-scroll-example) {
		max-height: 500px;
		background: #354146;
	}
</style>

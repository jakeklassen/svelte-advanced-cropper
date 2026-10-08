<script lang="ts">
	import { Cropper, ImageRestriction } from 'svelte-advanced-cropper';
	import BackgroundWrapperWithNotifications from './BackgroundWrapperWithNotifications.svelte';
	import { image } from '#site/paths.ts';

	const src = image('tabby-cat-on-blue.jpg');
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
	{src}
/>

<style>
	:global(.cropper-scroll-example) {
		max-height: 500px;
		background: #354146;
	}
</style>

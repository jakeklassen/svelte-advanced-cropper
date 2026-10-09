<script lang="ts">
	import { RectangleStencil, Cropper, ImageRestriction } from 'svelte-advanced-cropper';
	import BackgroundWrapperWithNotifications from './BackgroundWrapperWithNotifications.svelte';
	import { image } from '#site/paths.ts';

	const src = image('tabby-cat-on-blue.jpg');
</script>

<Cropper
	class="cropper-scroll-example"
	transformImage={{
		adjustStencil: false
	}}
	imageRestriction={ImageRestriction.stencil}
	{src}
>
	{#snippet backgroundWrapper(props)}
		<BackgroundWrapperWithNotifications {...props} />
	{/snippet}
	<RectangleStencil handlers={false} lines={false} movable={false} resizable={false} />
</Cropper>

<style>
	:global(.cropper-scroll-example) {
		max-height: 500px;
		background: #354146;
	}
</style>

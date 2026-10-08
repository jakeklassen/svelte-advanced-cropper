<script lang="ts">
	import { FixedCropper, ImageRestriction } from 'svelte-advanced-cropper';
	import { image } from '#site/paths.ts';
</script>

<FixedCropper
	class="fixed-size-example"
	src={image('photo-1527137342181-19aab11a8ee8.jpg')}
	stencilSize={{
		width: 300,
		height: 300
	}}
	stencilProps={{
		handlers: {},
		lines: {},
		movable: false,
		resizable: false
	}}
	imageRestriction={ImageRestriction.stencil}
/>

<style>
	:global(.fixed-size-example) {
		max-height: 450px;
		background: #354146;
	}
</style>

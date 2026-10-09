<script lang="ts">
	import { CircleStencil, Cropper } from 'svelte-advanced-cropper';
	import { image } from '#site/paths.ts';

	const src = image('tabby-cat-in-shadow.jpg');
</script>

<Cropper class="changing-stencil-example" stencilComponent={CircleStencil} {src} />

<style>
	:global(.changing-stencil-example) {
		max-height: 600px;
		background: #354146;
	}
</style>

<script lang="ts">
	import { Cropper } from 'svelte-advanced-cropper';
	import { image } from '#site/paths.ts';
	import CircleStencil from './CircleStencil.svelte';

	const src = image('pexels-photo-1451124.jpeg');
</script>

<Cropper class="custom-stencil-example" stencilComponent={CircleStencil} {src} />

<style>
	:global(.custom-stencil-example) {
		max-height: 500px;
		background: #354146;
	}
</style>

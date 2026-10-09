<script lang="ts">
	import { CircleStencil, RectangleStencil, Cropper } from 'svelte-advanced-cropper';
	import { image } from '#site/paths.ts';

	let circle = $state(true);

	const src = image('tabby-cat-in-shadow.jpg');
</script>

<Cropper class="changing-stencil-example" {src}>
	{#if circle}<CircleStencil />{:else}<RectangleStencil />{/if}
</Cropper>
<button class="demo-button" type="button" onclick={() => (circle = !circle)}>
	Switch to {circle ? 'rectangle' : 'circle'}
</button>

<style>
	:global(.changing-stencil-example) {
		max-height: 600px;
		background: #354146;
	}
</style>

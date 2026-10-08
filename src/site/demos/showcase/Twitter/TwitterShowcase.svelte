<script lang="ts">
	import { image } from '#site/paths.ts';
	import TwitterCropper from './TwitterCropper.svelte';
</script>

<TwitterCropper class="twitter-showcase" src={image('sule-makaroglu-wvEaVy5DGf4-unsplash.jpg')} />

<style>
	:global(.twitter-showcase) {
		height: 521px;
		max-height: 80vh;
	}
</style>

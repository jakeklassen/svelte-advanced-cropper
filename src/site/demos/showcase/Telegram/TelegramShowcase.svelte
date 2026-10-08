<script lang="ts">
	import { image } from '#site/paths.ts';
	import TelegramCropper from './TelegramCropper.svelte';
</script>

<TelegramCropper class="telegram-showcase" src={image('pexels-photo-12381305.jpeg')} />

<style>
	:global(.telegram-showcase) {
		height: 500px;
		max-height: 80vh;
	}
</style>

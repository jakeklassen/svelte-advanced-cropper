<script lang="ts">
	import { image } from '#site/paths.ts';
	import TelegramCropper from './TelegramCropper.svelte';
</script>

<TelegramCropper class="telegram-showcase" src={image('tabby-cat-in-window.jpg')} />

<style>
	:global(.telegram-showcase) {
		height: 500px;
		max-height: 80vh;
	}
</style>

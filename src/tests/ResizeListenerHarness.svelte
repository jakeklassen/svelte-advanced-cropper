<script lang="ts">
	import { listenForWindowResize } from '#lib/controllers/listenForWindowResize.svelte.ts';

	let { callback }: { callback: (...args: unknown[]) => void } = $props();
	listenForWindowResize((...args) => callback(...args));
</script>

<script lang="ts">
	import { untrack } from 'svelte';

	let { callback }: { callback: (...args: unknown[]) => void } = $props();
	function resized() {
		untrack(() => callback());
	}
</script>

<svelte:window onresize={resized} onorientationchange={resized} />

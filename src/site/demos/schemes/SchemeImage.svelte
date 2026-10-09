<script lang="ts">
	import type { ClassValue } from 'svelte/elements';

	interface Props {
		class?: ClassValue;
		style?: string;
	}

	let { class: cssClass, style }: Props = $props();
</script>

<!-- A stand-in "photo" drawn with gradients: sky, sun and two hills. -->
<div class={['scheme-image', cssClass]} {style} aria-hidden="true"></div>

<style>
	.scheme-image {
		background:
			radial-gradient(circle at 72% 30%, #ffe08a 0 9%, transparent 9.5%),
			radial-gradient(ellipse 70% 45% at 25% 100%, #3f7d4e 0 98%, transparent 100%),
			radial-gradient(ellipse 80% 38% at 85% 100%, #5c9a5f 0 98%, transparent 100%),
			linear-gradient(#8ec9f0, #d9effa);
	}
</style>

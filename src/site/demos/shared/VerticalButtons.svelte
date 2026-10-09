<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { ClassValue } from 'svelte/elements';

	interface Props {
		class?: ClassValue;
		children?: Snippet;
	}

	let { children, class: cssClass }: Props = $props();
</script>

<div class={['vertical-buttons', cssClass]}>
	{@render children?.()}
</div>

<style>
	.vertical-buttons {
		position: absolute;
		left: 10px;
		top: 50%;
		transform: translateY(-50%);
		z-index: 1;
	}
</style>

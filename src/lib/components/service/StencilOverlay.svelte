<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { ClassValue } from 'svelte/elements';

	interface Props {
		class?: ClassValue;
		children?: Snippet;
	}

	let { class: cssClass, children }: Props = $props();
</script>

<div class={['advanced-cropper-stencil-overlay', cssClass]}>
	{@render children?.()}
</div>

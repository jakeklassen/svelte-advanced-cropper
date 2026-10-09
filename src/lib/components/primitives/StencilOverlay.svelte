<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { ClassValue } from 'svelte/elements';

	interface Props {
		class?: ClassValue;
		style?: string;
		children?: Snippet;
	}

	let { class: cssClass, style, children }: Props = $props();
</script>

<div {style} class={['advanced-cropper-stencil-overlay', cssClass]}>
	{@render children?.()}
</div>

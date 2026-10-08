<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { ClassValue } from 'svelte/elements';

	interface Props {
		class?: ClassValue;
		children?: Snippet;
	}

	let { class: className, children }: Props = $props();
</script>

<div class={['advanced-cropper-stencil-overlay', className]}>
	{@render children?.()}
</div>

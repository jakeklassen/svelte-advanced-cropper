<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { ClassValue } from 'svelte/elements';

	interface Props {
		visible?: unknown;
		class?: ClassValue;
		style?: string;
		children?: Snippet;
	}

	let { visible, class: className, style, children }: Props = $props();
</script>

<div
	{style}
	class={[className, 'advanced-cropper-fade', Boolean(visible) && 'advanced-cropper-fade--visible']}
>
	{@render children?.()}
</div>

<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { ClassValue } from 'svelte/elements';
	import type { CropperTransitions } from 'advanced-cropper';
	import ArtificialTransition from './ArtificialTransition.svelte';

	interface Props {
		children?: Snippet;
		class?: ClassValue;
		transitions?: CropperTransitions;
		width?: number;
		height?: number;
		left: number;
		top: number;
	}

	let { class: className, transitions, width, height, left, top, children }: Props = $props();
</script>

<ArtificialTransition
	class={['advanced-cropper-stencil-wrapper', className]}
	{transitions}
	{width}
	{height}
	{top}
	{left}
>
	{@render children?.()}
</ArtificialTransition>

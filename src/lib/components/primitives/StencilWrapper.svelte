<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { ClassValue } from 'svelte/elements';
	import type { CropperTransitions } from 'advanced-cropper';
	import ArtificialTransition from '../internal/ArtificialTransition.svelte';

	interface Props {
		children?: Snippet;
		class?: ClassValue;
		style?: string;
		transitions?: CropperTransitions;
		width?: number;
		height?: number;
		left: number;
		top: number;
	}

	let { class: cssClass, style, transitions, width, height, left, top, children }: Props = $props();
</script>

<ArtificialTransition
	{style}
	class={['advanced-cropper-stencil-wrapper', cssClass]}
	{transitions}
	{width}
	{height}
	{top}
	{left}
>
	{@render children?.()}
</ArtificialTransition>

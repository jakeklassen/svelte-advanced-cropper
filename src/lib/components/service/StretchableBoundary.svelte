<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { ClassValue } from 'svelte/elements';
	import type { BoundarySizeAlgorithm, BoundaryStretchAlgorithm, Size } from 'advanced-cropper';
	export type { StretchableBoundaryMethods } from './methods';

	export interface StretchableBoundaryProps {
		class?: ClassValue;
		style?: string;
		stretcherClassName?: ClassValue;
		contentClassName?: ClassValue;
		stretchAlgorithm?: BoundaryStretchAlgorithm;
		sizeAlgorithm?: BoundarySizeAlgorithm;
		children?: Snippet;
	}
</script>

<script lang="ts">
	import { fillBoundary, stretchCropperBoundary } from 'advanced-cropper';

	let {
		class: className,
		style,
		stretcherClassName,
		contentClassName,
		stretchAlgorithm = stretchCropperBoundary,
		sizeAlgorithm = fillBoundary,
		children
	}: StretchableBoundaryProps = $props();

	let stretcher: HTMLDivElement | undefined = $state();
	let boundary: HTMLDivElement | undefined = $state();

	export function reset() {
		if (stretcher) {
			stretcher.style.height = '';
			stretcher.style.width = '';
		}
	}

	export function stretchTo(size: Size | null): Promise<Size | null> {
		if (size?.width && size?.height && stretcher && boundary) {
			stretchAlgorithm(boundary, stretcher, size);
			const result = sizeAlgorithm(boundary, size);
			return Promise.resolve(result.width && result.height ? result : null);
		} else {
			reset();
			return Promise.resolve(null);
		}
	}
</script>

<div bind:this={boundary} {style} class={['advanced-cropper-boundary', className]}>
	<div
		bind:this={stretcher}
		class={['advanced-cropper-boundary__stretcher', stretcherClassName]}
	></div>
	<div class={['advanced-cropper-boundary__content', contentClassName]}>
		{@render children?.()}
	</div>
</div>

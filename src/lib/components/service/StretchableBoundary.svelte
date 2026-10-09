<script lang="ts" module>
	import { onDestroy, untrack, type Snippet } from 'svelte';
	import type { RegisterBoundary } from '../../types';
	import type { ClassValue } from 'svelte/elements';
	import type { BoundarySizeAlgorithm, BoundaryStretchAlgorithm, Size } from 'advanced-cropper';

	export type { StretchableBoundaryMethods } from './methods';

	export interface StretchableBoundaryProps {
		class?: ClassValue;
		style?: string;
		registerBoundary?: RegisterBoundary;
		stretchAlgorithm?: BoundaryStretchAlgorithm;
		sizeAlgorithm?: BoundarySizeAlgorithm;
		children?: Snippet;
	}
</script>

<script lang="ts">
	import { stretchCropperBoundary } from 'advanced-cropper';
	import { fillLayoutBoundary } from '../../service/boundary';

	let {
		class: cssClass,
		style,
		registerBoundary,
		stretchAlgorithm = stretchCropperBoundary,
		sizeAlgorithm = fillLayoutBoundary,
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
		if (!size?.width || !size?.height || !stretcher || !boundary) {
			reset();

			return Promise.resolve(null);
		}

		stretchAlgorithm(boundary, stretcher, size);
		const result = sizeAlgorithm(boundary, size);

		return Promise.resolve(result.width && result.height ? result : null);
	}

	onDestroy(untrack(() => registerBoundary?.({ stretchTo, reset })) ?? (() => {}));
</script>

<div bind:this={boundary} {style} class={['advanced-cropper-boundary', cssClass]}>
	<div bind:this={stretcher} class="advanced-cropper-boundary__stretcher"></div>
	<div class="advanced-cropper-boundary__content">
		{@render children?.()}
	</div>
</div>

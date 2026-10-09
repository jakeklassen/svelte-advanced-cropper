<script lang="ts" module>
	/** Pending stretches, in call order. Calling one lets that stretch finish. */
	export const pendingStretches: (() => void)[] = [];
</script>

<script lang="ts">
	import { onDestroy, untrack } from 'svelte';
	import type { Size } from 'advanced-cropper';
	import { StretchableBoundary, type BoundaryHandle, type StretchableBoundaryProps } from '#lib';

	let { children, registerBoundary, ...props }: StretchableBoundaryProps = $props();

	let boundary: BoundaryHandle | undefined = $state.raw();

	// A boundary whose stretch finishes only when the test releases it, like a custom
	// boundary that measures asynchronously.
	export function stretchTo(size: Size | null): Promise<Size | null> {
		return new Promise((resolve) => {
			pendingStretches.push(() => resolve(boundary?.stretchTo(size) ?? null));
		});
	}

	export function reset() {
		boundary?.reset();
	}

	onDestroy(untrack(() => registerBoundary?.({ stretchTo, reset })) ?? (() => {}));
</script>

<StretchableBoundary bind:this={boundary} {...props}>
	{@render children?.()}
</StretchableBoundary>

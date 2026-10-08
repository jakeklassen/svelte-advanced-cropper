<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { ClassValue } from 'svelte/elements';
	import type { CropperTransitions } from 'advanced-cropper';

	export interface ArtificialTransitionProps {
		class?: ClassValue;
		transitions?: CropperTransitions;
		width?: number;
		height?: number;
		left?: number;
		top?: number;
		children?: Snippet;
	}

	type Values = Pick<ArtificialTransitionProps, 'width' | 'height' | 'left' | 'top'>;
</script>

<script lang="ts">
	import { untrack } from 'svelte';
	import { deepCompare, isNumber } from 'advanced-cropper';
	import { useTransition } from '../../hooks/useTransition.svelte';

	let {
		class: className,
		transitions,
		children,
		width,
		height,
		left,
		top
	}: ArtificialTransitionProps = $props();

	let root: HTMLDivElement | undefined = $state();

	// Frame-by-frame values. Deliberately not reactive: each animation frame writes
	// them straight to the DOM, as upstream does.
	const transitionValues: Values = untrack(() => ({ width, height, left, top }));
	let rememberedValues: Values = untrack(() => ({ width, height, left, top }));

	const transition = useTransition(() => transitions);

	$effect(() => {
		const values: Values = { width, height, left, top };
		const transitionsActive = transition.active;
		untrack(() => {
			if (!deepCompare(rememberedValues, values)) {
				const startValues = transitionsActive ? { ...transitionValues } : rememberedValues;
				rememberedValues = values;

				transition.run((progress) => {
					for (const property of ['left', 'top', 'height', 'width'] as const) {
						const desiredValue = values[property];
						const startValue = startValues[property];

						transitionValues[property] =
							isNumber(startValue) && isNumber(desiredValue)
								? startValue + (desiredValue - startValue) * progress
								: desiredValue;
					}

					if (root) {
						root.style.width = `${transitionValues.width}px`;
						root.style.height = `${transitionValues.height}px`;
						root.style.transform = `translate3d(${transitionValues.left}px, ${transitionValues.top}px, 0px)`;
					}
				});
			}
		});
	});

	// While a transition runs, render from the in-flight values so that a re-render
	// does not jump to the target and fight the animation.
	const current = $derived(
		transition.active ? { ...transitionValues } : { width, height, left, top }
	);
</script>

<div
	bind:this={root}
	class={['advanced-cropper-artificial-transition', className]}
	style:left="0px"
	style:top="0px"
	style:width="{current.width}px"
	style:height="{current.height}px"
	style:transform="translate3d({current.left}px, {current.top}px, 0px)"
>
	{@render children?.()}
</div>

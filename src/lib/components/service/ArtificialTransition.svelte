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

	type Box = Pick<ArtificialTransitionProps, 'width' | 'height' | 'left' | 'top'>;

	const BOX_PROPERTIES = ['left', 'top', 'height', 'width'] as const;
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

	// The box drawn by the current animation frame. Deliberately not reactive: each
	// frame writes it straight to the DOM, as upstream does.
	const frameBox: Box = untrack(() => ({ width, height, left, top }));
	// The box the last animation was heading for.
	let targetBox: Box = untrack(() => ({ width, height, left, top }));

	const transition = useTransition(() => transitions);

	$effect(() => {
		const target: Box = { width, height, left, top };
		untrack(() => {
			if (deepCompare(targetBox, target)) {
				return;
			}

			// An interrupted animation continues from where it is now.
			const start = transition.active ? { ...frameBox } : targetBox;
			targetBox = target;
			transition.run((progress) => {
				for (const property of BOX_PROPERTIES) {
					const from = start[property];
					const to = target[property];
					frameBox[property] = isNumber(from) && isNumber(to) ? from + (to - from) * progress : to;
				}

				if (root) {
					root.style.width = `${frameBox.width}px`;
					root.style.height = `${frameBox.height}px`;
					root.style.transform = `translate3d(${frameBox.left}px, ${frameBox.top}px, 0px)`;
				}
			});
		});
	});

	// While a transition runs, render from the in-flight frame so that a re-render does
	// not jump to the target and fight the animation.
	const current = $derived(transition.active ? { ...frameBox } : { width, height, left, top });
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

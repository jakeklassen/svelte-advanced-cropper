<script lang="ts" module>
	import type { ClassValue } from 'svelte/elements';
	import type { CropperImage, CropperState, CropperTransitions } from 'advanced-cropper';

	interface DesiredCropperRef {
		getState: () => CropperState | null;
		getTransitions: () => CropperTransitions;
		getImage: () => CropperImage | null;
	}

	export interface CropperBackgroundImageProps {
		class?: ClassValue;
		cropper: DesiredCropperRef;
		crossOrigin?: 'anonymous' | 'use-credentials' | boolean;
		style?: string;
		/** The rendered `<img>` element (upstream's forwarded ref). */
		ref?: HTMLImageElement | null;
	}
</script>

<script lang="ts">
	import { getBackgroundStyle } from 'advanced-cropper';
	import { preventDefault } from '../../service/events';
	import { mergeStyles, styleToString } from '../../service/style';

	let {
		class: className,
		style,
		cropper,
		crossOrigin = true,
		ref = $bindable(null)
	}: CropperBackgroundImageProps = $props();

	const state = $derived(cropper.getState());
	const transitions = $derived(cropper.getTransitions());
	const image = $derived(cropper.getImage());

	const transformStyles = $derived(
		image && state ? styleToString(getBackgroundStyle(image, state, transitions)) : ''
	);

	const src = $derived(image ? image.src : undefined);
</script>

{#if src}
	{#key src}
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<img
			bind:this={ref}
			class={['advanced-cropper-background-image', className]}
			{src}
			alt=""
			crossorigin={crossOrigin === true ? 'anonymous' : crossOrigin || undefined}
			style={mergeStyles(transformStyles, style)}
			onmousedown={preventDefault}
		/>
	{/key}
{/if}

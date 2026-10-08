<script lang="ts" module>
	import type { ClassValue } from 'svelte/elements';
	import type { CropperImage, CropperState, CropperTransitions, Size } from 'advanced-cropper';

	interface DesiredCropperRef {
		getState: () => CropperState | null;
		getTransitions: () => CropperTransitions | null;
		getImage: () => CropperImage | null;
	}

	export interface CropperPreviewBackgroundProps {
		class?: ClassValue;
		cropper: DesiredCropperRef;
		crossOrigin?: 'anonymous' | 'use-credentials' | boolean;
		size?: Size | null;
		style?: string;
	}
</script>

<script lang="ts">
	import { getPreviewStyle } from 'advanced-cropper';
	import { preventDefault } from '../../service/events';
	import { mergeStyles, styleToString } from '../../service/style';

	let {
		class: className,
		cropper,
		crossOrigin = true,
		size,
		style
	}: CropperPreviewBackgroundProps = $props();

	const state = $derived(cropper.getState());
	const transitions = $derived(cropper.getTransitions());
	const image = $derived(cropper.getImage());

	const transformStyles = $derived(
		size && image && state?.coordinates
			? styleToString(getPreviewStyle(image, state, size, transitions))
			: ''
	);

	const src = $derived(image ? image.src : undefined);
</script>

{#if src}
	{#key src}
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<img
			class={['advanced-cropper-background-image', className]}
			{src}
			alt=""
			crossorigin={crossOrigin === true ? 'anonymous' : crossOrigin || undefined}
			style={mergeStyles(transformStyles, style)}
			onmousedown={preventDefault}
		/>
	{/key}
{/if}

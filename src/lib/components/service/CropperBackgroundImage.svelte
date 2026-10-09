<script lang="ts" module>
	import type { AttachBackgroundSource } from '../../types';
	import type { ClassValue } from 'svelte/elements';
	import type { CropperImage, CropperState, CropperTransitions } from 'advanced-cropper';

	interface DesiredCropperInstance {
		getState: () => CropperState | null;
		getTransitions: () => CropperTransitions;
		getImage: () => CropperImage | null;
	}

	export interface CropperBackgroundImageProps {
		class?: ClassValue;
		cropper: DesiredCropperInstance;
		crossOrigin?: 'anonymous' | 'use-credentials' | boolean;
		style?: string;
		attachSource?: AttachBackgroundSource;
	}
</script>

<script lang="ts">
	import { crossOriginAttribute } from '../../service/image';
	import { getBackgroundStyle } from 'advanced-cropper';
	import { preventDefault } from '../../service/events';
	import { mergeStyles, styleToString } from '../../service/style';

	let {
		class: cssClass,
		style,
		cropper,
		crossOrigin = true,
		attachSource
	}: CropperBackgroundImageProps = $props();

	const state = $derived(cropper.getState());
	const transitions = $derived(cropper.getTransitions());
	const image = $derived(cropper.getImage());

	const transformStyles = $derived(
		image && state ? styleToString(getBackgroundStyle(image, state, transitions)) : ''
	);

	const src = $derived(image?.src);
</script>

{#if src}
	<!-- Each image owns its element. -->
	{#key src}
		<!-- The mousedown handler only blocks the browser's native image drag. -->
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<img
			{@attach attachSource?.()}
			class={['advanced-cropper-background-image', cssClass]}
			{src}
			alt=""
			crossorigin={crossOriginAttribute(crossOrigin)}
			style={mergeStyles(transformStyles, style)}
			onmousedown={preventDefault}
		/>
	{/key}
{/if}

<script lang="ts" module>
	import type { ClassValue } from 'svelte/elements';
	import type { CropperImage, CropperState, CropperTransitions, Size } from 'advanced-cropper';

	interface DesiredCropperInstance {
		getState: () => CropperState | null;
		getTransitions: () => CropperTransitions | null;
		getImage: () => CropperImage | null;
	}

	export interface CropperPreviewBackgroundProps {
		class?: ClassValue;
		preview: DesiredCropperInstance;
		crossOrigin?: 'anonymous' | 'use-credentials' | boolean;
		size?: Size | null;
		style?: string;
	}
</script>

<script lang="ts">
	import { crossOriginAttribute } from '../../service/image';
	import { getPreviewStyle } from 'advanced-cropper';
	import { preventDefault } from '../../service/events';
	import { mergeStyles, styleToString } from '../../service/style';

	let {
		class: cssClass,
		preview,
		crossOrigin = true,
		size,
		style
	}: CropperPreviewBackgroundProps = $props();

	const state = $derived(preview.getState());
	const transitions = $derived(preview.getTransitions());
	const image = $derived(preview.getImage());

	const transformStyles = $derived(
		size && image && state?.coordinates
			? styleToString(getPreviewStyle(image, state, size, transitions))
			: ''
	);

	const src = $derived(image?.src);
</script>

{#if src}
	<!-- Each image owns its element. -->
	{#key src}
		<!-- The mousedown handler only blocks the browser's native image drag. -->
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<img
			class={['advanced-cropper-background-image', cssClass]}
			{src}
			alt=""
			crossorigin={crossOriginAttribute(crossOrigin)}
			style={mergeStyles(transformStyles, style)}
			onmousedown={preventDefault}
		/>
	{/key}
{/if}

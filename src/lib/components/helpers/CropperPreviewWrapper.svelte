<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { ClassValue } from 'svelte/elements';

	interface DesiredCropperInstance {
		isLoaded: () => boolean;
	}

	export interface CropperPreviewWrapperProps {
		cropper?: DesiredCropperInstance | null;
		class?: ClassValue;
		style?: string;
		children?: Snippet;
	}
</script>

<script lang="ts">
	import CropperFade from '../service/CropperFade.svelte';

	let { children, cropper, class: cssClass, style }: CropperPreviewWrapperProps = $props();
</script>

<div class={[cssClass, 'cropper-preview-wrapper']} {style}>
	<CropperFade visible={cropper?.isLoaded()} class="cropper-preview-wrapper__fade">
		{@render children?.()}
	</CropperFade>
</div>

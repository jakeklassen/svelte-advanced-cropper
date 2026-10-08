<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { ClassValue } from 'svelte/elements';

	interface DesiredCropperRef {
		isLoaded: () => boolean;
	}

	export interface CropperPreviewWrapperProps {
		cropper?: DesiredCropperRef | null;
		class?: ClassValue;
		style?: string;
		children?: Snippet;
	}
</script>

<script lang="ts">
	import CropperFade from '../service/CropperFade.svelte';

	let { children, cropper, class: className, style }: CropperPreviewWrapperProps = $props();
</script>

<div class={[className, 'cropper-preview-wrapper']} {style}>
	<CropperFade visible={cropper?.isLoaded()} class="cropper-preview-wrapper__fade">
		{@render children?.()}
	</CropperFade>
</div>

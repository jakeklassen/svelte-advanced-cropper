<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { ClassValue } from 'svelte/elements';
	import type { CropperState } from 'advanced-cropper';

	interface DesiredCropperRef {
		getState: () => CropperState | null;
		isLoading: () => boolean;
		isLoaded: () => boolean;
	}

	export interface CropperWrapperProps {
		cropper?: DesiredCropperRef;
		class?: ClassValue;
		style?: string;
		children?: Snippet;
		disabled?: boolean;
	}
</script>

<script lang="ts">
	import CropperFade from './CropperFade.svelte';

	let { cropper, children, class: className, style }: CropperWrapperProps = $props();

	// Fade in once an image has loaded and has a state.
	const visible = $derived(Boolean(cropper?.getState()) && Boolean(cropper?.isLoaded()));
</script>

<div class={[className, 'advanced-cropper-wrapper']} {style}>
	<CropperFade {visible} class="advanced-cropper-wrapper__fade">
		{@render children?.()}
	</CropperFade>
</div>

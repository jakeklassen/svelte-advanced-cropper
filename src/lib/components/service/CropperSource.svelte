<script lang="ts" module>
	import type { HTMLImgAttributes } from 'svelte/elements';

	export interface CropperSourceProps extends Omit<HTMLImgAttributes, 'src' | 'crossorigin'> {
		src?: string | null;
		crossOrigin?: 'anonymous' | 'use-credentials' | boolean;
		ref?: HTMLImageElement | HTMLCanvasElement | null;
	}
</script>

<script lang="ts">
	let { src, crossOrigin = true, ref = $bindable(null), ...props }: CropperSourceProps = $props();
</script>

{#if src}
	{#key src}
		<img
			bind:this={ref}
			{src}
			alt=""
			class="advanced-cropper-source"
			crossorigin={crossOrigin === true ? 'anonymous' : crossOrigin || undefined}
			{...props}
		/>
	{/key}
{/if}

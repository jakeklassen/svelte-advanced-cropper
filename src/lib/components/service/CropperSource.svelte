<script lang="ts" module>
	import type { HTMLImgAttributes } from 'svelte/elements';

	export interface CropperSourceProps extends Omit<HTMLImgAttributes, 'src' | 'crossorigin'> {
		src?: string | null;
		crossOrigin?: 'anonymous' | 'use-credentials' | boolean;
		element?: HTMLImageElement | HTMLCanvasElement | null;
	}
</script>

<script lang="ts">
	import { crossOriginAttribute } from '../../service/image';

	let {
		src,
		crossOrigin = true,
		element = $bindable(null),
		...props
	}: CropperSourceProps = $props();
</script>

{#if src}
	<!-- A new element per image, as upstream keys the <img> by src. -->
	{#key src}
		<img
			bind:this={element}
			{src}
			alt=""
			class="advanced-cropper-source"
			crossorigin={crossOriginAttribute(crossOrigin)}
			{...props}
		/>
	{/key}
{/if}

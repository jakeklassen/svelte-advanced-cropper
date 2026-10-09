<script lang="ts" module>
	import type { HTMLImgAttributes } from 'svelte/elements';

	export interface CropperSourceProps extends Omit<HTMLImgAttributes, 'src' | 'crossorigin'> {
		src?: string | null;
		crossOrigin?: 'anonymous' | 'use-credentials' | boolean;
		element?: HTMLImageElement | null;
	}
</script>

<script lang="ts">
	import { crossOriginAttribute } from '../../service/image';

	let {
		src,
		crossOrigin = true,
		element = $bindable(null),
		class: cssClass,
		...props
	}: CropperSourceProps = $props();
</script>

{#if src}
	<!-- Each image owns its element. -->
	{#key src}
		<img
			bind:this={element}
			{src}
			alt=""
			class={['advanced-cropper-source', cssClass]}
			crossorigin={crossOriginAttribute(crossOrigin)}
			{...props}
		/>
	{/key}
{/if}

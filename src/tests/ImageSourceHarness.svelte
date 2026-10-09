<script lang="ts">
	import 'advanced-cropper/styles/index.scss';
	import {
		Cropper,
		type AttachBackgroundSource,
		type CropperInstance,
		type CropperProps
	} from '#lib';

	let {
		src,
		onReady,
		attachImage
	}: {
		src: string;
		onReady: CropperProps['onReady'];
		attachImage: (
			element: HTMLImageElement,
			attachSource: AttachBackgroundSource
		) => void | (() => void);
	} = $props();
	let cropper: CropperInstance | undefined = $state();

	export function getCropper() {
		return cropper;
	}
</script>

<Cropper bind:this={cropper} {src} {onReady} style="width: 500px; height: 400px">
	{#snippet background(p)}
		<img alt="" {@attach (element) => attachImage(element, p.attachSource)} />
	{/snippet}
</Cropper>

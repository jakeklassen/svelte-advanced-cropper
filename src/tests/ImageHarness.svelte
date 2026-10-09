<script lang="ts">
	import type { CropperImage } from '#lib';
	import { ImageLoader } from '#lib/controllers/ImageLoader.svelte.ts';

	interface Props {
		src: string | null;
		log: string[];
	}

	let { src: srcProp, log }: Props = $props();

	// Follows the prop, but `setImageAndSrc` can also change it.
	let src = $derived(srcProp);

	const loader = new ImageLoader(() => ({
		src,
		unloadTime: 0,
		onLoadingStart: () => log.push('start'),
		onLoadingEnd: () => log.push(`end:${loader.isLoading()}`),
		onLoad: () => log.push(`load:${loader.isLoading()}`),
		onError: () => log.push('error')
	}));

	export function getLoader() {
		return loader;
	}

	/** Sets an image and a new src synchronously, so both land in one effect flush. */
	export function setImageAndSrc(image: CropperImage, nextSrc: string) {
		loader.setImage(image);
		src = nextSrc;
	}
</script>

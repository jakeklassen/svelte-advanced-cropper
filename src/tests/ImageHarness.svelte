<script lang="ts">
	import { useCropperImage, type CropperImage, type CropperImageHook } from '#lib';

	interface Props {
		src: string | null;
		log: string[];
	}

	let { src: srcProp, log }: Props = $props();

	// Follows the prop, but `setImageAndSrc` can also change it.
	let src = $derived(srcProp);

	const hook: CropperImageHook = useCropperImage(() => ({
		src,
		unloadTime: 0,
		onLoadingStart: () => log.push('start'),
		onLoadingEnd: () => log.push(`end:${hook.isLoading()}`),
		onLoad: () => log.push(`load:${hook.isLoading()}`),
		onError: () => log.push('error')
	}));

	export function getHook() {
		return hook;
	}

	/** Sets an image and a new src synchronously, so both land in one effect flush. */
	export function setImageAndSrc(image: CropperImage, nextSrc: string) {
		hook.setImage(image);
		src = nextSrc;
	}
</script>

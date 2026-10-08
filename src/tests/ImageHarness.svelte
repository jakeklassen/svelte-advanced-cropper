<script lang="ts">
	import { useCropperImage, type CropperImageHook } from '#lib';

	interface Props {
		src: string | null;
		log: string[];
	}

	let { src, log }: Props = $props();

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
</script>

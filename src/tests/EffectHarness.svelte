<script lang="ts">
	import 'advanced-cropper/styles/index.scss';
	import { Cropper, type CropperRef } from '#lib';

	interface Props {
		src: string;
		onReady: () => void;
		/** Called on every run of the effect below. */
		onEffectRun: () => void;
	}

	let { src, onReady, onEffectRun }: Props = $props();

	let cropper: CropperRef | undefined = $state();
	let ready = $state(false);

	// Calls state-changing ref methods from an effect, the way a React user calls them
	// from useEffect. The effect depends only on `cropper` and `ready`; the methods'
	// internal reads of cropper state must not become its dependencies.
	$effect(() => {
		if (!cropper || !ready) {
			return;
		}

		onEffectRun();
		cropper.setCoordinates({ width: 100, height: 100 }, { transitions: false });
		void cropper.refresh();
	});
</script>

<div style="width: 500px; height: 400px;">
	<Cropper
		bind:this={cropper}
		{src}
		onReady={() => {
			ready = true;
			onReady();
		}}
		style="width: 100%; height: 100%;"
	/>
</div>

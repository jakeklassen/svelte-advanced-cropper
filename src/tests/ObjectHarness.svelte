<script lang="ts">
	import 'advanced-cropper/styles/index.scss';
	import { Cropper, type CropperInstance, type CropperProps } from '#lib';
	import ObjectStencil from './ObjectStencil.svelte';

	let { src, onReady }: { src: string; onReady: CropperProps['onReady'] } = $props();
	let options = $state({ ratio: 2 });
	let cropper: CropperInstance | undefined = $state();
	export function setRatio(value: number) {
		options.ratio = value;
	}

	export function getCropper() {
		return cropper;
	}
</script>

<div style="width:500px;height:400px">
	<Cropper
		{src}
		{onReady}
		bind:this={cropper}
		autoReconcileState={false}
		stencilConstraints={(_, o) => ({ aspectRatio: typeof o.ratio === 'number' ? o.ratio : 1 })}
	>
		<ObjectStencil {options} />
	</Cropper>
</div>

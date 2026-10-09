<script lang="ts">
	import { Cropper, CropperPreview, type CropperInstance } from '#lib';

	interface Props {
		src: string;
		onReady?: (cropper: CropperInstance) => void;
	}

	let { src, onReady }: Props = $props();

	let cropper: CropperInstance | undefined = $state();
	export function getCropper() {
		return cropper;
	}
</script>

<div style="width: 500px; height: 400px;">
	<Cropper
		bind:this={cropper}
		{src}
		{onReady}
		transitions={false}
		style="width: 100%; height: 100%;"
	/>
</div>
<div style="width: 200px; height: 200px;">
	<CropperPreview {cropper} class="test-preview" style="width: 100%; height: 100%;" />
</div>

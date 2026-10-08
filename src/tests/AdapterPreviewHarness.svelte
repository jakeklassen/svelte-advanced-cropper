<script lang="ts">
	import { CropperPreview, type CropperPreviewDesiredCropperRef } from '#lib';

	interface Props {
		adapter: CropperPreviewDesiredCropperRef;
	}

	let { adapter }: Props = $props();

	let preview: { refresh: () => void } | undefined = $state();
	export function refresh() {
		preview?.refresh();
	}
</script>

<div style="width: 200px; height: 200px;">
	<CropperPreview bind:this={preview} cropper={adapter} class="adapter-preview" />
</div>

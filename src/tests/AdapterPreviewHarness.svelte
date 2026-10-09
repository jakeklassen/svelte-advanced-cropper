<script lang="ts">
	import { CropperPreview, type CropperPreviewSource, type CropperPreviewInstance } from '#lib';

	interface Props {
		adapter: CropperPreviewSource;
	}

	let { adapter }: Props = $props();

	let preview: CropperPreviewInstance | undefined = $state();

	export function refresh() {
		preview?.refresh();
	}
</script>

<div style="width: 200px; height: 200px;">
	<CropperPreview bind:this={preview} cropper={adapter} class="adapter-preview" />
</div>

<script lang="ts">
	import type { Coordinates } from 'svelte-advanced-cropper';

	interface Props {
		coordinates: Coordinates;
		preview: string;
	}

	let { coordinates, preview }: Props = $props();
</script>

<div class="preview-results">
	<div class="preview-results__coordinates">
		<p class="preview-results__title">Results:</p>
		<p>Width: {coordinates.width}</p>
		<p>Height: {coordinates.height}</p>
		<p>Left: {coordinates.left}</p>
		<p>Top: {coordinates.top}</p>
	</div>
	<img class="preview-results__preview" src={preview} alt="Cropped result" />
</div>

<style>
	.preview-results {
		display: flex;
		position: absolute;
		right: 15px;
		bottom: 15px;
		border: dashed 1px rgba(255, 255, 255, 0.5);
		pointer-events: none;
	}
	.preview-results__coordinates {
		background: rgba(0, 0, 0, 0.8);
		padding: 5px;
		font-size: 10px;
		line-height: 1.3;
		color: white;
	}
	.preview-results__coordinates p {
		margin: 2px 0;
	}
	.preview-results__title {
		font-weight: bold;
	}
	.preview-results__preview {
		display: block;
		width: 107px;
		height: 107px;
		opacity: 0.8;
	}
	@media (max-width: 540px) {
		.preview-results__coordinates {
			display: none;
		}
	}
</style>

<script lang="ts">
	import type { CropperDescription } from './wizard.ts';

	interface Props {
		cropper: CropperDescription;
	}

	let { cropper }: Props = $props();
</script>

<div class="croppers-wizard-info">
	<div class="name">{cropper.name}</div>
	<div class="property">
		<div class="property-title">Description</div>
		<div>{cropper.description}</div>
	</div>
	{#if cropper.link}
		<div class="property">
			<div class="property-title">Link</div>
			<a href={cropper.link.href}>{cropper.link.label}</a>
		</div>
	{/if}
	<div class="property">
		<div class="property-title">Features</div>
		<div class="features">
			{#each cropper.features as feature (feature)}
				<span class="feature">{feature}</span>
			{/each}
		</div>
	</div>
</div>

<style>
	.croppers-wizard-info {
		color: white;
		padding: 50px 80px;
	}
	.name {
		margin-bottom: 24px;
		font-size: 24px;
	}
	.property {
		margin-bottom: 24px;
	}
	.property-title {
		font-size: 16px;
		opacity: 0.8;
		margin-bottom: 6px;
	}
	a {
		color: #61dafb;
		overflow-wrap: anywhere;
	}
	.features {
		display: flex;
		flex-wrap: wrap;
		padding: 5px 0;
	}
	.feature {
		padding: 2px 8px;
		background: #424242;
		font-size: 12px;
		color: white;
		border-radius: 5px;
		margin-right: 16px;
		margin-bottom: 16px;
	}
	@media (max-width: 540px) {
		.croppers-wizard-info {
			padding-left: 40px;
			padding-right: 40px;
		}
	}
</style>

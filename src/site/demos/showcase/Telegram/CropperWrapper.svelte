<script lang="ts">
	import { LoaderCircle } from '@lucide/svelte';
	import { CropperFade, type CropperWrapperSnippetProps } from 'svelte-advanced-cropper';
	import Navigation from './Navigation.svelte';

	interface Props extends CropperWrapperSnippetProps {
		navigation?: boolean;
	}
	let { cropper, class: cssClass, style, children, disabled, navigation = true }: Props = $props();
</script>

<div
	class={[
		'telegram-cropper-wrapper',
		navigation && 'telegram-cropper-wrapper--with-navigation',
		cssClass
	]}
	{style}
>
	<CropperFade class="telegram-cropper-wrapper__fade" visible={cropper.isLoaded()}>
		{@render children?.()}
		{#if navigation}
			<Navigation
				class="telegram-cropper-wrapper__navigation"
				value={cropper.getTransforms().rotate}
				onRotate={cropper.rotateImage}
				onRotateEnd={cropper.transformImageEnd}
				onFlip={cropper.flipImage}
				disabled={disabled || cropper.getTransitions().active}
			/>
		{/if}
	</CropperFade>
	<div
		class={[
			'telegram-cropper-wrapper__spinner',
			cropper.isLoading() && 'telegram-cropper-wrapper__spinner--visible'
		]}
	>
		<LoaderCircle size={38} />
	</div>
</div>

<style>
	.telegram-cropper-wrapper {
		padding: 30px;
		overflow: hidden;
		background: black;
		max-height: 100%;
	}
	.telegram-cropper-wrapper--with-navigation {
		padding-bottom: 80px;
	}
	.telegram-cropper-wrapper :global(.telegram-cropper-wrapper__fade) {
		flex-grow: 1;
		min-height: 0;
	}
	.telegram-cropper-wrapper :global(.telegram-cropper-wrapper__navigation) {
		position: absolute;
		bottom: 0;
		max-width: 450px;
		width: 100%;
		left: 50%;
		transform: translateX(-50%);
	}
	.telegram-cropper-wrapper__spinner {
		display: flex;
		position: absolute;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
		visibility: hidden;
		opacity: 0;
		transition: 0.5s;
		transition-delay: 0s;
		animation: telegram-spin 1s linear infinite;
	}
	.telegram-cropper-wrapper__spinner--visible {
		transition-delay: 0.5s;
		opacity: 1;
		visibility: visible;
	}
	@keyframes telegram-spin {
		from {
			transform: translate(-50%, -50%) rotate(0deg);
		}
		to {
			transform: translate(-50%, -50%) rotate(360deg);
		}
	}
</style>

<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { ClassValue } from 'svelte/elements';
	import { LoaderCircle } from '@lucide/svelte';
	import { CropperFade, type CropperRef } from 'svelte-advanced-cropper';
	import Navigation from './Navigation.svelte';
	import type { PublicNavigationProps } from './types';

	interface Props {
		cropper: CropperRef;
		class?: ClassValue;
		style?: string;
		children?: Snippet;
		spinnerClassName?: ClassValue;
		navigation?: boolean;
		navigationProps?: PublicNavigationProps;
	}

	let {
		cropper,
		class: className,
		style,
		children,
		spinnerClassName,
		navigation = true,
		navigationProps = {}
	}: Props = $props();

	const { class: navigationClassName, ...navigationClassNames } = $derived(navigationProps);
</script>

<div
	class={[
		'telegram-cropper-wrapper',
		navigation && 'telegram-cropper-wrapper--with-navigation',
		className
	]}
	{style}
>
	<CropperFade class="telegram-cropper-wrapper__fade" visible={cropper.isLoaded()}>
		{@render children?.()}
		{#if navigation}
			<Navigation
				{...navigationClassNames}
				class={['telegram-cropper-wrapper__navigation', navigationClassName]}
				value={cropper.getTransforms().rotate}
				onRotate={(angle, options) => cropper.rotateImage(angle, options)}
				onRotateEnd={() => cropper.transformImageEnd()}
				onFlip={(horizontal, vertical, options) => cropper.flipImage(horizontal, vertical, options)}
				disabled={cropper.getTransitions().active}
			/>
		{/if}
	</CropperFade>
	<div
		class={[
			'telegram-cropper-wrapper__spinner',
			cropper.isLoading() && 'telegram-cropper-wrapper__spinner--visible',
			spinnerClassName
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

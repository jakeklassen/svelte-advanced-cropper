<script lang="ts">
	import {
		FixedCropper,
		RectangleStencil,
		ImageRestriction,
		type FixedCropperProps,
		type FixedCropperInstance
	} from 'svelte-advanced-cropper';
	import CustomWrapper from './CustomWrapper.svelte';

	const StandardFixedCropper = FixedCropper<{}>;

	interface Props extends FixedCropperProps {
		/** The inner cropper, for `bind:cropper`. */
		cropper?: FixedCropperInstance;
	}

	let { children, wrapper: customWrapper, cropper = $bindable(), ...props }: Props = $props();
</script>

<StandardFixedCropper bind:this={cropper} imageRestriction={ImageRestriction.stencil} {...props}>
	{#snippet wrapper(p)}
		{#if customWrapper}{@render customWrapper(p)}{:else}<CustomWrapper {...p} />{/if}
	{/snippet}
	{#if children}{@render children()}{:else}
		<RectangleStencil handlers={false} lines={false} movable={false} resizable={false} />
	{/if}
</StandardFixedCropper>

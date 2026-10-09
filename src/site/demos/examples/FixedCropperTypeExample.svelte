<script lang="ts">
	import { FixedCropper, type FixedCropperProps } from 'svelte-advanced-cropper';

	interface Props extends FixedCropperProps {
		size?: 'small' | 'medium';
	}

	let { size, class: cssClass, ...props }: Props = $props();
</script>

<FixedCropper
	{...props}
	class={['fixed-cropper-type-example', size && `fixed-cropper-type-example--${size}`, cssClass]}
/>

<style>
	:global(.fixed-cropper-type-example--medium) {
		max-height: 500px;
	}
	:global(.fixed-cropper-type-example--small) {
		max-height: 400px;
	}
</style>

<script lang="ts">
	import { Cropper, type CropperProps } from 'svelte-advanced-cropper';

	interface Props extends CropperProps {
		size?: 'small' | 'medium';
	}

	let { size, class: className, ...props }: Props = $props();
</script>

<Cropper
	{...props}
	class={['cropper-types-example', size && `cropper-types-example--${size}`, className]}
/>

<style>
	:global(.cropper-types-example--medium) {
		max-height: 500px;
	}
	:global(.cropper-types-example--small) {
		max-height: 400px;
	}
</style>

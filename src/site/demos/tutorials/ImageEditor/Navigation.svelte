<script lang="ts" module>
	import type { Adjustments } from './filters.ts';

	export type Mode = 'crop' | keyof Adjustments;
</script>

<script lang="ts">
	import type { Component } from 'svelte';
	import type { ClassValue } from 'svelte/elements';
	import { Contrast, Crop, Download, Droplet, Palette, Sun, Upload } from '@lucide/svelte';
	import Button from './Button.svelte';

	interface Props {
		class?: ClassValue;
		mode?: Mode;
		onDownload?: () => void;
		onUpload?: (file: File) => void;
	}

	let { class: className, mode = $bindable('crop'), onDownload, onUpload }: Props = $props();

	const modes: { mode: Mode; label: string; icon: Component }[] = [
		{ mode: 'crop', label: 'Crop', icon: Crop },
		{ mode: 'saturation', label: 'Saturation', icon: Droplet },
		{ mode: 'brightness', label: 'Brightness', icon: Sun },
		{ mode: 'contrast', label: 'Contrast', icon: Contrast },
		{ mode: 'hue', label: 'Hue', icon: Palette }
	];

	let input: HTMLInputElement | undefined = $state();

	function uploadSelectedFile(event: Event & { currentTarget: HTMLInputElement }) {
		const file = event.currentTarget.files?.[0];
		if (file) {
			onUpload?.(file);
		}

		// Clear the input, so that the same file can be uploaded again.
		event.currentTarget.value = '';
	}
</script>

<div class={['image-editor-navigation', className]}>
	<Button aria-label="Upload an image" onclick={() => input?.click()}>
		<Upload size={20} />
	</Button>
	<input bind:this={input} type="file" accept="image/*" hidden onchange={uploadSelectedFile} />
	<div class="image-editor-navigation__buttons">
		{#each modes as item (item.mode)}
			<Button
				class="image-editor-navigation__button"
				aria-label={item.label}
				aria-pressed={mode === item.mode}
				active={mode === item.mode}
				onclick={() => (mode = item.mode)}
			>
				<item.icon size={20} />
			</Button>
		{/each}
	</div>
	<Button aria-label="Download the result" onclick={onDownload}>
		<Download size={20} />
	</Button>
</div>

<style>
	.image-editor-navigation {
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: 84px;
		padding: 0 16px;
		background: #1b1a21;
		border-top: solid 1px #2b2a30;
	}
	.image-editor-navigation__buttons {
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.image-editor-navigation__buttons :global(.image-editor-navigation__button) {
		margin: 0 8px;
	}
	@media (max-width: 540px) {
		.image-editor-navigation {
			padding: 0 8px;
		}
		.image-editor-navigation__buttons :global(.image-editor-navigation__button) {
			margin: 0 4px;
		}
	}
</style>

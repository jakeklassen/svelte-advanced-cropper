<script lang="ts">
	import { X } from '@lucide/svelte';
	import { cubicOut } from 'svelte/easing';
	import { scale } from 'svelte/transition';
	import { Cropper, type CropperRef } from 'svelte-advanced-cropper';
	import { image } from '#site/paths.ts';

	const src = image('orange-cat-on-table.jpg');
	const titleId = $props.id();

	let open = $state(false);
	let cropper: CropperRef | undefined = $state();
	let box: HTMLDivElement | undefined = $state();
	let measurement = $state('');

	// Compares the size the cropper measured with the size of the box it sits in. The
	// cropper is ready while the dialog is still scaling in.
	function compareSizes() {
		const boundary = cropper?.getState()?.boundary;
		if (!boundary || !box) {
			return;
		}

		const measured = `${Math.round(boundary.width)}×${Math.round(boundary.height)}`;
		measurement = `The cropper measured ${measured}; its box is ${box.clientWidth}×${box.clientHeight}.`;
	}

	function showModal(dialog: HTMLDialogElement) {
		dialog.showModal();
	}
</script>

<button class="demo-button" type="button" onclick={() => (open = true)}>Open the dialog</button>

{#if open}
	<dialog
		class="dialog-example"
		aria-labelledby={titleId}
		{@attach showModal}
		in:scale={{ start: 0.9, duration: 400, easing: cubicOut }}
		onclose={() => (open = false)}
	>
		<div class="dialog-example__header">
			<h3 id={titleId}>Crop your photo</h3>
			<form method="dialog">
				<button class="dialog-example__close" aria-label="Close">
					<X size={18} />
				</button>
			</form>
		</div>
		<div class="dialog-example__box" bind:this={box}>
			<Cropper bind:this={cropper} class="dialog-example__cropper" {src} onReady={compareSizes} />
		</div>
		<p class="dialog-example__measurement" aria-live="polite">{measurement}</p>
	</dialog>
{/if}

<style>
	.dialog-example {
		width: min(640px, calc(100vw - 32px));
		padding: 1rem;
		border: 0;
		border-radius: 8px;
		color: var(--color-text);
		background: var(--color-surface-raised);
		box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
	}
	.dialog-example::backdrop {
		background: rgba(0, 0, 0, 0.5);
	}
	.dialog-example__header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 0.75rem;
	}
	.dialog-example__header h3 {
		margin: 0;
		font-size: 1.1rem;
	}
	.dialog-example__close {
		display: inline-flex;
		padding: 0.25rem;
		border: 0;
		background: none;
		color: inherit;
		cursor: pointer;
	}
	.dialog-example__box {
		height: min(400px, 60vh);
	}
	.dialog-example__box :global(.dialog-example__cropper) {
		height: 100%;
	}
	.dialog-example__measurement {
		margin: 0.75rem 0 0;
		font-size: 0.9rem;
	}
</style>

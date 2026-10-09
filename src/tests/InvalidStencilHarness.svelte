<script lang="ts">
	import { Cropper, CircleStencil, RectangleStencil } from '#lib';

	let { missing = false }: { missing?: boolean } = $props();
</script>

<svelte:boundary>
	{#if missing}
		<CircleStencil />
	{:else}
		<Cropper><CircleStencil /><RectangleStencil /></Cropper>
	{/if}
	{#snippet failed(error)}
		<p data-testid="error">{error instanceof Error ? error.message : String(error)}</p>
	{/snippet}
</svelte:boundary>

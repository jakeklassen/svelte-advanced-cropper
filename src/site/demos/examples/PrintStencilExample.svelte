<script lang="ts">
	import { Cropper } from 'svelte-advanced-cropper';
	import { image } from '#site/paths.ts';
	import PrintStencil from './PrintStencil.svelte';

	// Sizes in inches. The stencil's shape is the print plus its bleed on every side.
	const products = {
		magnet: { label: '3″ × 3″ magnet', width: 3, height: 3, bleed: 0.125, safeMargin: 0.125 },
		print: { label: '6″ × 4″ print', width: 6, height: 4, bleed: 0.125, safeMargin: 0.25 },
		puzzle: {
			label: '10″ × 8″ puzzle',
			width: 10,
			height: 8,
			bleed: 0.25,
			safeMargin: 0.25,
			columns: 5,
			rows: 4
		}
	};

	type Product = keyof typeof products;

	const src = image('corgi-lying-down.jpg');

	let product: Product = $state('print');
	let { label, ...stencilProps } = $derived(products[product]);
</script>

<div class="print-stencil-example">
	<Cropper
		class="print-stencil-example__cropper"
		{src}
		stencilComponent={PrintStencil}
		{stencilProps}
	/>
</div>

<div class="demo-buttons print-stencil-example__products" role="group" aria-label="Product">
	{#each Object.entries(products) as [key, option] (key)}
		<button
			class="demo-button"
			aria-pressed={product === key}
			onclick={() => (product = key as Product)}
		>
			{option.label}
		</button>
	{/each}
</div>

<ul class="print-stencil-example__legend" aria-label="Guides for the {label}">
	<li>
		<span class="print-stencil-example__swatch print-stencil-example__swatch--bleed"></span>Bleed:
		trimmed off
	</li>
	<li>
		<span class="print-stencil-example__swatch print-stencil-example__swatch--cut"></span>Cut line
	</li>
	<li>
		<span class="print-stencil-example__swatch print-stencil-example__swatch--safe"></span>Safe
		area: keep faces and text inside
	</li>
</ul>

<style>
	.print-stencil-example {
		height: 360px;
		background: black;
	}
	.print-stencil-example :global(.print-stencil-example__cropper) {
		height: 100%;
	}
	.print-stencil-example__products [aria-pressed='true'] {
		border-color: var(--color-primary);
		color: var(--color-primary);
	}
	.print-stencil-example__legend {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem 1.25rem;
		margin: 0.75rem 0 0;
		padding: 0;
		list-style: none;
		font-size: 0.85rem;
		color: var(--color-muted);
	}
	.print-stencil-example__legend li {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
	}
	.print-stencil-example__swatch {
		display: inline-block;
		box-sizing: border-box;
		width: 1.5rem;
		height: 0.9rem;
	}
	.print-stencil-example__swatch--bleed {
		background: linear-gradient(rgba(0, 0, 0, 0.35), rgba(0, 0, 0, 0.35)), #8a9aa1;
	}
	.print-stencil-example__swatch--cut {
		border: 1px dashed #fdb022;
	}
	.print-stencil-example__swatch--safe {
		border: 1px dashed #61dafb;
	}
</style>

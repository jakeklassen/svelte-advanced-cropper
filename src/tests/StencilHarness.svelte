<script lang="ts">
	import 'advanced-cropper/styles/index.scss';
	import {
		Cropper,
		FixedCropper,
		RectangleStencil,
		CircleStencil,
		type CropperInstance,
		type CropperProps
	} from '#lib';
	import CustomStencil from './CustomStencil.svelte';

	type Mode = 'circle' | 'rectangle' | 'custom' | 'empty' | 'duplicate' | 'nested';
	let {
		mode = 'circle',
		ratio = 2,
		src,
		disabled = false,
		autoReconcileState = false,
		fixed = false,
		onReady,
		onChange,
		createStateAlgorithm
	}: {
		mode?: Mode;
		ratio?: number;
		src?: string;
		disabled?: boolean;
		autoReconcileState?: boolean;
		fixed?: boolean;
		onReady?: CropperProps['onReady'];
		onChange?: CropperProps['onChange'];
		createStateAlgorithm?: CropperProps['createStateAlgorithm'];
	} = $props();
	let cropper: CropperInstance | undefined = $state();
	let nested: CropperInstance | undefined = $state();
	export function getCropper() {
		return cropper;
	}

	export function getNested() {
		return nested;
	}
</script>

{#snippet contents()}
	{#if mode === 'circle'}
		<CircleStencil disabled={false}><span data-testid="guide">guide</span></CircleStencil>
	{:else if mode === 'rectangle'}
		<RectangleStencil aspectRatio={ratio} />
	{:else if mode === 'custom'}
		<CustomStencil {ratio} />
	{:else if mode === 'duplicate'}
		<CircleStencil /><RectangleStencil />
	{:else if mode === 'nested'}
		<RectangleStencil aspectRatio={2} />
		<div style="width: 200px; height: 200px;">
			<Cropper {src} bind:this={nested}><CircleStencil /></Cropper>
		</div>
	{/if}
{/snippet}
<div style="width: 500px; height: 400px;">
	{#if fixed}
		<FixedCropper
			bind:this={cropper}
			{src}
			{disabled}
			{onReady}
			stencilSize={{ width: 240, height: 160 }}
			children={contents}
		/>
	{:else}
		<Cropper
			bind:this={cropper}
			{src}
			{disabled}
			{onReady}
			{onChange}
			{createStateAlgorithm}
			{autoReconcileState}
			children={contents}
		/>
	{/if}
</div>

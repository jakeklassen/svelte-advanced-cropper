<script lang="ts">
	import 'advanced-cropper/styles/index.scss';
	import 'advanced-cropper/themes/default.scss';
	import {
		Cropper,
		FixedCropper,
		CropperPreview,
		CropperWrapper,
		CropperBackgroundWrapper,
		CropperBackgroundImage,
		StretchableBoundary,
		CropperPreviewWrapper,
		CropperPreviewBackground,
		RectangleStencil,
		CircleStencil,
		SimpleHandler,
		SimpleLine,
		CropperSource,
		type CropperInstance,
		type NativeMoveEvent,
		type RectangleStencilProps
	} from '#lib';
	import AsyncBoundary from './AsyncBoundary.svelte';
	import CanvasBackground from './CanvasBackground.svelte';

	interface Props {
		src: string;
		disabled?: boolean;
		circle?: boolean;
		fixed?: boolean;
		handlers?: RectangleStencilProps['handlers'];
		lines?: RectangleStencilProps['lines'];
		resizable?: boolean;
		canvas?: boolean;
		customCanvas?: boolean;
		asyncPreview?: boolean;
		previewGeneration?: number;
		emptyBackground?: boolean;
		customPreview?: boolean;
		asyncBoundary?: boolean;
		boundaryGeneration?: number;
		sourceGeneration?: number;
		onReady?: (cropper: CropperInstance) => void;
		onNativeMove?: (event: NativeMoveEvent) => void;
	}
	let {
		src,
		disabled,
		circle,
		fixed,
		customCanvas,
		canvas = true,
		handlers,
		lines,
		resizable,
		asyncPreview,
		previewGeneration = 0,
		emptyBackground,
		customPreview,
		asyncBoundary,
		boundaryGeneration = 0,
		sourceGeneration = 0,
		onReady,
		onNativeMove
	}: Props = $props();
	let cropper: CropperInstance | undefined = $state();
	export function getCropper() {
		return cropper;
	}

	const SelectedCropper = $derived(fixed ? FixedCropper : Cropper);
</script>

<div style="width: 500px; height: 400px">
	<SelectedCropper
		bind:this={cropper}
		{src}
		{canvas}
		{disabled}
		{onReady}
		transitions={false}
		stencilSize={{ width: 200, height: 100 }}
		style="height:100%;width:100%"
	>
		{#snippet wrapper(p)}<CropperWrapper {...p} />{/snippet}
		{#snippet boundary(p)}
			{#key boundaryGeneration}
				{#if asyncBoundary}<AsyncBoundary {...p} />{:else}<StretchableBoundary {...p} />{/if}
			{/key}
		{/snippet}
		{#snippet backgroundWrapper(p)}<CropperBackgroundWrapper {...p} />{/snippet}
		{#snippet background(p)}
			{#key sourceGeneration}
				{#if !emptyBackground}
					{#if customCanvas}<CanvasBackground {...p} />{:else}<CropperBackgroundImage {...p} />{/if}
				{/if}
			{/key}
		{/snippet}
		{#if circle}
			<CircleStencil grid {handlers} {lines} {resizable} />
		{:else}
			<RectangleStencil grid {handlers} {lines} {resizable}>
				{#snippet handler(p)}
					<SimpleHandler
						{...p}
						onMove={(shift, event) => {
							onNativeMove?.(event);
							p.onMove(shift, event);
						}}
					/>
				{/snippet}
				{#snippet line(p)}<SimpleLine {...p} />{/snippet}
			</RectangleStencil>
		{/if}
	</SelectedCropper>
</div>
<div style="width:200px;height:150px">
	<CropperPreview {cropper} style="width:100%;height:100%">
		{#snippet wrapper(p)}<CropperPreviewWrapper {...p} />{/snippet}
		{#snippet boundary(p)}
			{#key previewGeneration}
				{#if asyncPreview}<AsyncBoundary {...p} />{:else}<StretchableBoundary {...p} />{/if}
			{/key}
		{/snippet}
		{#snippet background(p)}
			{#if customPreview}<div
					class={p.class}
					data-testid="preview-size"
					data-width={p.size?.width}
					data-height={p.size?.height}
				></div>{:else}<CropperPreviewBackground {...p} />{/if}
		{/snippet}
	</CropperPreview>
</div>
<CropperSource {src} class="custom-source" />

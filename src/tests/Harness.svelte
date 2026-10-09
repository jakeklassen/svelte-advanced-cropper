<script lang="ts">
	import 'advanced-cropper/styles/index.scss';
	import 'advanced-cropper/themes/default.scss';
	import {
		Cropper,
		FixedCropper,
		RectangleStencil,
		CircleStencil,
		type CropperProps,
		type CropperInstance
	} from '#lib';

	interface Props extends CropperProps {
		component?: typeof Cropper | typeof FixedCropper;
		circle?: boolean;
		ratio?: number;
		stencilSize?: { width: number; height: number };
		width?: number;
		height?: number;
		/** Scales the host with a CSS transform, as a dialog's opening animation does. */
		scale?: number;
	}

	let {
		component = Cropper,
		circle,
		ratio,
		stencilConstraints,
		stencilSize = { width: 200, height: 100 },
		width = 500,
		height = 400,
		scale = 1,
		...rest
	}: Props = $props();

	let cropper: CropperInstance | undefined = $state();

	export function getCropper() {
		return cropper;
	}
</script>

<div
	data-testid="host"
	style:width="{width}px"
	style:height="{height}px"
	style:transform={scale === 1 ? undefined : `scale(${scale})`}
	style:transform-origin="0 0"
>
	{#if component === FixedCropper}
		<FixedCropper bind:this={cropper} style="width: 100%; height: 100%;" {stencilSize} {...rest}>
			{#if circle}<CircleStencil />{:else}<RectangleStencil aspectRatio={ratio} />{/if}
		</FixedCropper>
	{:else}
		<Cropper {stencilConstraints} bind:this={cropper} style="width: 100%; height: 100%;" {...rest}>
			{#if circle}<CircleStencil />{:else}<RectangleStencil aspectRatio={ratio} />{/if}
		</Cropper>
	{/if}
</div>

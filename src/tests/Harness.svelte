<script lang="ts">
	import 'advanced-cropper/styles/index.scss';
	import 'advanced-cropper/themes/default.scss';
	import type { Component } from 'svelte';
	import { Cropper, type CropperRef } from '#lib';

	interface Props {
		component?: Component<any, any, any>;
		width?: number;
		height?: number;
		/** Scales the host with a CSS transform, as a dialog's opening animation does. */
		scale?: number;
		[key: string]: unknown;
	}

	let {
		component: CropperComponent = Cropper,
		width = 500,
		height = 400,
		scale = 1,
		...rest
	}: Props = $props();

	let cropper: CropperRef | undefined = $state();

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
	<CropperComponent bind:this={cropper} style="width: 100%; height: 100%;" {...rest} />
</div>

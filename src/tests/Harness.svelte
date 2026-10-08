<script lang="ts">
	import 'advanced-cropper/styles/index.scss';
	import 'advanced-cropper/themes/default.scss';
	import type { Component } from 'svelte';
	import { Cropper, type CropperRef } from '#lib';

	interface Props {
		component?: Component<any, any, any>;
		width?: number;
		height?: number;
		[key: string]: unknown;
	}

	let { component = Cropper, width = 500, height = 400, ...rest }: Props = $props();

	let cropper: CropperRef | undefined = $state();

	export function getCropper() {
		return cropper;
	}

	const CropperComponent = $derived(component);
</script>

<div data-testid="host" style="width: {width}px; height: {height}px;">
	<CropperComponent bind:this={cropper} style="width: 100%; height: 100%;" {...rest} />
</div>

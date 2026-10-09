<script lang="ts">
	import LineWrapper from '../service/LineWrapper.svelte';
	import type { LineWrapperProps } from '../service/LineWrapper.svelte';

	let {
		class: cssClass,
		style,
		position,
		disabled,
		onMove,
		onMoveEnd
	}: LineWrapperProps = $props();

	let hovered = $state(false);
</script>

<LineWrapper
	{style}
	class={[
		'advanced-cropper-simple-line-wrapper',
		cssClass,
		hovered && 'advanced-cropper-simple-line-wrapper--hover',
		disabled && 'advanced-cropper-simple-line-wrapper--disabled',
		position && `advanced-cropper-simple-line-wrapper--${position}`
	]}
	{position}
	{disabled}
	{onMove}
	{onMoveEnd}
	onLeave={() => (hovered = false)}
	onEnter={() => (hovered = true)}
>
	<div
		class={[
			'advanced-cropper-simple-line',
			disabled && 'advanced-cropper-simple-line--disabled',
			hovered && 'advanced-cropper-simple-line--hover',

			position && `advanced-cropper-simple-line--${position}`
		]}
	></div>
</LineWrapper>

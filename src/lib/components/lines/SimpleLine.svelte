<script lang="ts" module>
	import type { LineWrapperProps } from '../primitives/LineWrapper.svelte';

	export type SimpleLineProps = Pick<
		LineWrapperProps,
		'class' | 'style' | 'position' | 'disabled' | 'onMove' | 'onMoveEnd'
	>;
</script>

<script lang="ts">
	import LineWrapper from '../primitives/LineWrapper.svelte';

	let { class: cssClass, style, position, disabled, onMove, onMoveEnd }: SimpleLineProps = $props();

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

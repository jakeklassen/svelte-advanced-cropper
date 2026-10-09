<script lang="ts">
	import LineWrapper from '../service/LineWrapper.svelte';
	import type { LineComponentProps } from '../service/BoundingBox.svelte';

	let {
		position,
		hoverClassName,
		wrapperClassName,
		defaultClassName,
		disabled,
		onMove,
		onMoveEnd
	}: LineComponentProps = $props();

	let hovered = $state(false);
</script>

<LineWrapper
	class={[
		'advanced-cropper-simple-line-wrapper',
		wrapperClassName,
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
			hovered && 'advanced-cropper-simple-line--hover',
			defaultClassName,
			hovered && hoverClassName,
			position && `advanced-cropper-simple-line--${position}`
		]}
	></div>
</LineWrapper>

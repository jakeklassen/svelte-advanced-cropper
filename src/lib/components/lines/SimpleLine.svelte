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

	let hover = $state(false);
</script>

<LineWrapper
	class={[
		'advanced-cropper-simple-line-wrapper',
		wrapperClassName,
		position && `advanced-cropper-simple-line-wrapper--${position}`
	]}
	{position}
	{disabled}
	onDrag={onMove}
	onDragEnd={onMoveEnd}
	onLeave={() => (hover = false)}
	onEnter={() => (hover = true)}
>
	<div
		class={[
			'advanced-cropper-simple-line',
			hover && 'advanced-cropper-simple-line--hover',
			defaultClassName,
			hover && hoverClassName,
			position && `advanced-cropper-simple-line--${position}`
		]}
	></div>
</LineWrapper>

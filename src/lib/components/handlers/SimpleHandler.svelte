<script lang="ts">
	import HandlerWrapper from '../service/HandlerWrapper.svelte';
	import type { HandlerComponentProps } from '../service/BoundingBox.svelte';

	let {
		verticalPosition,
		horizontalPosition,
		hoverClassName,
		wrapperClassName,
		defaultClassName,
		wrapperStyle,
		disabled,
		onMove,
		onMoveEnd
	}: HandlerComponentProps = $props();

	let hover = $state(false);
</script>

<HandlerWrapper
	style={wrapperStyle}
	class={[
		'advanced-cropper-simple-handler-wrapper',
		wrapperClassName,
		verticalPosition && `advanced-cropper-simple-handler-wrapper--${verticalPosition}`,
		horizontalPosition && `advanced-cropper-simple-handler-wrapper--${horizontalPosition}`,
		horizontalPosition &&
			verticalPosition &&
			`advanced-cropper-simple-handler-wrapper--${horizontalPosition}-${verticalPosition}`,
		hover && 'advanced-cropper-simple-handler-wrapper--hover'
	]}
	{verticalPosition}
	{horizontalPosition}
	{disabled}
	onDrag={onMove}
	onDragEnd={onMoveEnd}
	onLeave={() => (hover = false)}
	onEnter={() => (hover = true)}
>
	<div
		class={[
			'advanced-cropper-simple-handler',
			hover && 'advanced-cropper-simple-handler--hover',
			defaultClassName,
			hover && hoverClassName,
			verticalPosition && `advanced-cropper-simple-handler--${verticalPosition}`,
			horizontalPosition && `advanced-cropper-simple-handler--${horizontalPosition}`,
			horizontalPosition &&
				verticalPosition &&
				`advanced-cropper-simple-handler--${horizontalPosition}-${verticalPosition}`
		]}
	></div>
</HandlerWrapper>

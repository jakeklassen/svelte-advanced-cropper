<script lang="ts" module>
	import type { HandlerWrapperProps } from '../primitives/HandlerWrapper.svelte';

	export type SimpleHandlerProps = Pick<
		HandlerWrapperProps,
		| 'class'
		| 'style'
		| 'position'
		| 'disabled'
		| 'onMove'
		| 'onMoveEnd'
		| 'horizontalPosition'
		| 'verticalPosition'
	>;
</script>

<script lang="ts">
	import { handlerDirections } from '../../service/directions';
	import HandlerWrapper from '../primitives/HandlerWrapper.svelte';

	let {
		class: cssClass,
		style,
		verticalPosition: vertical,
		position,
		horizontalPosition: horizontal,
		disabled,
		onMove,
		onMoveEnd
	}: SimpleHandlerProps = $props();

	const directions = $derived(position ? handlerDirections(position) : { horizontal, vertical });
	const horizontalPosition = $derived(directions.horizontal);
	const verticalPosition = $derived(directions.vertical);
	let hovered = $state(false);
</script>

<HandlerWrapper
	{style}
	class={[
		'advanced-cropper-simple-handler-wrapper',
		cssClass,
		disabled && 'advanced-cropper-simple-handler-wrapper--disabled',
		verticalPosition && `advanced-cropper-simple-handler-wrapper--${verticalPosition}`,
		horizontalPosition && `advanced-cropper-simple-handler-wrapper--${horizontalPosition}`,
		horizontalPosition &&
			verticalPosition &&
			`advanced-cropper-simple-handler-wrapper--${horizontalPosition}-${verticalPosition}`,
		hovered && 'advanced-cropper-simple-handler-wrapper--hover'
	]}
	{verticalPosition}
	{position}
	{horizontalPosition}
	{disabled}
	{onMove}
	{onMoveEnd}
	onLeave={() => (hovered = false)}
	onEnter={() => (hovered = true)}
>
	<div
		class={[
			'advanced-cropper-simple-handler',
			disabled && 'advanced-cropper-simple-handler--disabled',
			hovered && 'advanced-cropper-simple-handler--hover',

			verticalPosition && `advanced-cropper-simple-handler--${verticalPosition}`,
			horizontalPosition && `advanced-cropper-simple-handler--${horizontalPosition}`,
			horizontalPosition &&
				verticalPosition &&
				`advanced-cropper-simple-handler--${horizontalPosition}-${verticalPosition}`
		]}
	></div>
</HandlerWrapper>

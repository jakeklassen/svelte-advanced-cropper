<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { ClassValue } from 'svelte/elements';
	import type {
		HorizontalCardinalDirection,
		MoveDirections,
		VerticalCardinalDirection
	} from 'advanced-cropper';

	export interface LineWrapperProps {
		class?: ClassValue;
		style?: string;
		children?: Snippet;
		onMove?: (directions: MoveDirections, event: TouchEvent | MouseEvent) => void;
		onMoveEnd?: () => void;
		onLeave?: () => void;
		onEnter?: () => void;
		disabled?: boolean;
		position?: HorizontalCardinalDirection | VerticalCardinalDirection;
	}
</script>

<script lang="ts">
	import DraggableArea from '../gestures/DraggableArea.svelte';

	let {
		position,
		class: cssClass,
		style,
		disabled,
		onMove,
		onMoveEnd,
		onLeave,
		onEnter,
		children
	}: LineWrapperProps = $props();
	let hovered = $state(false);
</script>

<DraggableArea
	{style}
	class={[
		'advanced-cropper-line-wrapper',
		hovered && 'advanced-cropper-line-wrapper--hover',
		position && `advanced-cropper-line-wrapper--${position}`,
		disabled && 'advanced-cropper-line-wrapper--disabled',
		cssClass
	]}
	{disabled}
	{onMove}
	{onMoveEnd}
	onLeave={() => {
		hovered = false;
		onLeave?.();
	}}
	onEnter={() => {
		hovered = true;
		onEnter?.();
	}}
	activationDistance={0}
>
	<div
		class={[
			'advanced-cropper-line-wrapper__content',
			position && `advanced-cropper-line-wrapper__content--${position}`
		]}
	>
		{@render children?.()}
	</div>
</DraggableArea>

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
		children?: Snippet;
		onDrag?: (directions: MoveDirections, event: TouchEvent | MouseEvent) => void;
		onDragEnd?: () => void;
		onLeave?: () => void;
		onEnter?: () => void;
		disabled?: boolean;
		position?: HorizontalCardinalDirection | VerticalCardinalDirection;
	}
</script>

<script lang="ts">
	import DraggableElement from './DraggableElement.svelte';

	let {
		position,
		class: className,
		disabled,
		onDrag,
		onDragEnd,
		onLeave,
		onEnter,
		children
	}: LineWrapperProps = $props();
</script>

<DraggableElement
	class={[
		'advanced-cropper-line-wrapper',
		position && `advanced-cropper-line-wrapper--${position}`,
		disabled && 'advanced-cropper-line-wrapper--disabled',
		className
	]}
	{disabled}
	onMove={onDrag}
	onMoveEnd={onDragEnd}
	{onLeave}
	{onEnter}
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
</DraggableElement>

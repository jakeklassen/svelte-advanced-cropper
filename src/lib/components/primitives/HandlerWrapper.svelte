<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { ClassValue } from 'svelte/elements';
	import type {
		OrdinalDirection,
		HorizontalCardinalDirection,
		MoveDirections,
		VerticalCardinalDirection
	} from 'advanced-cropper';

	export interface HandlerWrapperProps {
		class?: ClassValue;
		style?: string;
		children?: Snippet;
		onMove?: (shift: MoveDirections, event: MouseEvent | TouchEvent) => void;
		onMoveEnd?: () => void;
		onLeave?: () => void;
		onEnter?: () => void;
		disabled?: boolean;
		position?: OrdinalDirection;
		horizontalPosition?: HorizontalCardinalDirection | null;
		verticalPosition?: VerticalCardinalDirection | null;
	}
</script>

<script lang="ts">
	import { handlerDirections } from '../../service/directions';
	import { getDirectionNames } from 'advanced-cropper';
	import DraggableArea from '../gestures/DraggableArea.svelte';

	let {
		horizontalPosition: horizontal,
		verticalPosition: vertical,
		position: direction,
		class: cssClass,
		disabled,
		onMove,
		onMoveEnd,
		onLeave,
		onEnter,
		children,
		style
	}: HandlerWrapperProps = $props();

	const directions = $derived(direction ? handlerDirections(direction) : { horizontal, vertical });
	const horizontalPosition = $derived(directions.horizontal);
	const verticalPosition = $derived(directions.vertical);
	const position = $derived(
		horizontalPosition || verticalPosition
			? getDirectionNames(horizontalPosition ?? null, verticalPosition ?? null).snakeCase
			: null
	);
	let hovered = $state(false);
</script>

<div
	{style}
	class={[
		cssClass,
		'advanced-cropper-handler-wrapper',
		hovered && 'advanced-cropper-handler-wrapper--hover',
		position && `advanced-cropper-handler-wrapper--${position}`,
		disabled && 'advanced-cropper-handler-wrapper--disabled'
	]}
>
	<DraggableArea
		class="advanced-cropper-handler-wrapper__draggable"
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
		{@render children?.()}
	</DraggableArea>
</div>

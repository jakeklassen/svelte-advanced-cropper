<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { ClassValue } from 'svelte/elements';
	import type {
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
		horizontalPosition?: HorizontalCardinalDirection | null;
		verticalPosition?: VerticalCardinalDirection | null;
	}
</script>

<script lang="ts">
	import { getDirectionNames } from 'advanced-cropper';
	import DraggableElement from './DraggableElement.svelte';

	let {
		horizontalPosition,
		verticalPosition,
		class: cssClass,
		disabled,
		onMove,
		onMoveEnd,
		onLeave,
		onEnter,
		children,
		style
	}: HandlerWrapperProps = $props();

	const position = $derived(
		horizontalPosition || verticalPosition
			? getDirectionNames(horizontalPosition ?? null, verticalPosition ?? null).snakeCase
			: null
	);
</script>

<div
	{style}
	class={[
		cssClass,
		'advanced-cropper-handler-wrapper',
		position && `advanced-cropper-handler-wrapper--${position}`,
		disabled && 'advanced-cropper-handler-wrapper--disabled'
	]}
>
	<DraggableElement
		class="advanced-cropper-handler-wrapper__draggable"
		{disabled}
		{onMove}
		{onMoveEnd}
		{onLeave}
		{onEnter}
		activationDistance={0}
	>
		{@render children?.()}
	</DraggableElement>
</div>

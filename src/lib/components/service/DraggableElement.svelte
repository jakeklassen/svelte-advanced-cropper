<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { ClassValue } from 'svelte/elements';
	import type { MoveDirections } from 'advanced-cropper';

	export interface DraggableElementProps {
		class?: ClassValue;
		children?: Snippet;
		disabled?: boolean;
		onMove?: (directions: MoveDirections, nativeEvent: MouseEvent | TouchEvent) => void;
		onMoveEnd?: () => void;
		onMoveStart?: () => void;
		onLeave?: () => void;
		onEnter?: () => void;
		useAnchor?: boolean;
		activationDistance?: number;
	}
</script>

<script lang="ts">
	import { on } from 'svelte/events';
	import { distance, type Point, type SimpleTouch } from 'advanced-cropper';
	import { screenScale } from '../../service/scale';

	let {
		class: cssClass,
		children,
		disabled = false,
		onMove,
		onMoveEnd,
		onMoveStart,
		onLeave,
		onEnter,
		useAnchor = true,
		activationDistance = 30
	}: DraggableElementProps = $props();

	// Gesture bookkeeping. Plain variables: none of it is rendered.
	// The touches (or mouse position) of the previous event of the current gesture.
	let lastTouches: SimpleTouch[] = [];
	// A touch gesture only starts moving once it has travelled `activationDistance`.
	let touchActivated = false;
	let hovered = false;
	// Where the gesture started, relative to the element.
	let anchor: Point = { left: 0, top: 0 };
	let container: HTMLDivElement | undefined;

	function enter() {
		if (!hovered && !disabled) {
			hovered = true;
			onEnter?.();
		}
	}

	function leave() {
		if (hovered) {
			hovered = false;
			onLeave?.();
		}
	}

	function setAnchor(touch: SimpleTouch) {
		if (!container) {
			return;
		}

		const { left, top } = container.getBoundingClientRect();
		anchor = { left: touch.clientX - left, top: touch.clientY - top };
	}

	function processMove(event: MouseEvent | TouchEvent, touches: SimpleTouch[]) {
		if (!container || !onMove || lastTouches.length !== 1 || touches.length !== 1) {
			return;
		}

		const [previous] = lastTouches;
		const [current] = touches;
		const { left, top } = container.getBoundingClientRect();
		// With useAnchor, an axis doesn't move while the pointer heads back toward the point
		// where it grabbed the element: after the element stops at a limit, it waits for the
		// pointer to return to that point before following it again.
		const movingToAnchor = {
			left:
				Math.abs(current.clientX - anchor.left - left) <
				Math.abs(previous.clientX - anchor.left - left),
			top:
				Math.abs(current.clientY - anchor.top - top) < Math.abs(previous.clientY - anchor.top - top)
		};

		// The pointer moves in screen pixels; inside a scaled container the cropper's pixels are
		// bigger or smaller, so convert the distance.
		const scale = screenScale(container);
		onMove(
			{
				left:
					!useAnchor || !movingToAnchor.left ? (current.clientX - previous.clientX) / scale.x : 0,
				top: !useAnchor || !movingToAnchor.top ? (current.clientY - previous.clientY) / scale.y : 0
			},
			event
		);
		lastTouches = [...touches];
	}

	function processEnd() {
		if (!disabled && lastTouches.length) {
			onMoveEnd?.();
		}

		leave();
		lastTouches = [];
	}

	const onMouseLeave = () => {
		if (!lastTouches.length) {
			leave();
		}
	};

	const onTouchStart = (event: TouchEvent) => {
		if (!event.cancelable) {
			return;
		}

		lastTouches = Array.from(event.touches);
		const shouldStartMove = !disabled && event.touches.length === 1;
		if (shouldStartMove) {
			onMoveStart?.();
		}

		enter();
		if (touchActivated || shouldStartMove) {
			event.preventDefault();
			event.stopPropagation();
		}
	};

	const onTouchEnd = () => {
		touchActivated = false;
		processEnd();
	};

	const onTouchMove = (event: TouchEvent) => {
		if (!lastTouches.length) {
			return;
		}

		if (touchActivated) {
			processMove(event, Array.from(event.touches));
			event.preventDefault();
			event.stopPropagation();

			return;
		}

		const [start] = lastTouches;
		const [current] = event.touches;
		const travelled = distance(
			{ left: start.clientX, top: start.clientY },
			{ left: current.clientX, top: current.clientY }
		);
		if (travelled > (activationDistance || 0)) {
			setAnchor({ clientX: current.clientX, clientY: current.clientY });
			touchActivated = true;
		}
	};

	const onMouseDown = (event: MouseEvent) => {
		if (disabled || event.button !== 0) {
			return;
		}

		const touch = { clientX: event.clientX, clientY: event.clientY };
		lastTouches = [touch];
		setAnchor(touch);
		event.stopPropagation();
		onMoveStart?.();
	};

	const onMouseMove = (event: MouseEvent) => {
		if (disabled || !lastTouches.length) {
			return;
		}

		processMove(event, [{ clientX: event.clientX, clientY: event.clientY }]);
		if (event.cancelable) {
			event.preventDefault();
		}

		event.stopPropagation();
	};

	// Native, non-passive listeners: they must call preventDefault/stopPropagation
	// before the image gesture layer underneath sees the event. Svelte's `on*`
	// attributes are delegated (mousedown) or passive (touch), so they can't be used.
	function listen(element: HTMLDivElement) {
		container = element;
		const options = { passive: false };
		const cleanups = [
			on(window, 'mouseup', processEnd, options),
			on(window, 'mousemove', onMouseMove, options),
			on(window, 'touchmove', onTouchMove, options),
			on(window, 'touchend', onTouchEnd, options),
			on(element, 'touchstart', onTouchStart, options),
			on(element, 'mousedown', onMouseDown, options)
		];

		return () => {
			for (const cleanup of cleanups) {
				cleanup();
			}

			container = undefined;
		};
	}

	// Upstream's componentDidUpdate: drop the gesture when the element gets disabled.
	$effect(() => {
		if (disabled) {
			lastTouches = [];
		}
	});
</script>

<!-- svelte-ignore a11y_mouse_events_have_key_events -->
<div
	class={['advanced-cropper-draggable-element', cssClass]}
	{@attach listen}
	onmouseover={enter}
	onmouseleave={onMouseLeave}
	role="presentation"
>
	{@render children?.()}
</div>

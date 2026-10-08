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
	import { useUpdateEffect } from '../../hooks/useUpdateEffect.svelte';

	let {
		class: className,
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
	let touches: SimpleTouch[] = [];
	let started = false;
	let hovered = false;
	let anchor: Point = { left: 0, top: 0 };
	let container: HTMLDivElement | undefined;

	const processMove = (e: MouseEvent | TouchEvent, newTouches: SimpleTouch[]) => {
		if (container && touches.length) {
			const { left, top } = container.getBoundingClientRect();
			if (touches.length === 1 && newTouches.length === 1 && onMove) {
				const movingToAnchor = {
					left:
						Math.abs(newTouches[0].clientX - anchor.left - left) <
						Math.abs(touches[0].clientX - anchor.left - left),
					top:
						Math.abs(newTouches[0].clientY - anchor.top - top) <
						Math.abs(touches[0].clientY - anchor.top - top)
				};

				const direction = { left: 0, top: 0 };

				if (!useAnchor || !movingToAnchor.left) {
					direction.left = newTouches[0].clientX - touches[0].clientX;
				}

				if (!useAnchor || !movingToAnchor.top) {
					direction.top = newTouches[0].clientY - touches[0].clientY;
				}

				onMove(direction, e);

				touches = [...newTouches];
			}
		}
	};

	const processEnd = () => {
		if (!disabled && touches.length) {
			onMoveEnd?.();
		}
		if (hovered) {
			onLeave?.();
			hovered = false;
		}
		touches = [];
	};

	const initAnchor = (touch: SimpleTouch) => {
		if (container) {
			const { left, top } = container.getBoundingClientRect();
			anchor = {
				left: touch.clientX - left,
				top: touch.clientY - top
			};
		}
	};

	const onMouseOver = () => {
		if (!hovered && !disabled) {
			hovered = true;
			onEnter?.();
		}
	};

	const onMouseLeave = () => {
		if (hovered && !touches.length) {
			hovered = false;
			onLeave?.();
		}
	};

	const onTouchStart = (e: TouchEvent) => {
		if (e.cancelable) {
			touches = Array.from(e.touches);

			const shouldStartMove = !disabled && e.touches.length === 1;
			if (shouldStartMove) {
				onMoveStart?.();
			}

			if (!hovered && !disabled) {
				hovered = true;
				onEnter?.();
			}

			if (started || shouldStartMove) {
				e.preventDefault();
				e.stopPropagation();
			}
		}
	};

	const onTouchEnd = () => {
		started = false;
		processEnd();
	};

	const onTouchMove = (e: TouchEvent) => {
		if (touches.length >= 1) {
			if (started) {
				processMove(e, Array.from(e.touches));
				e.preventDefault();
				e.stopPropagation();
			} else if (
				distance(
					{ left: touches[0].clientX, top: touches[0].clientY },
					{ left: e.touches[0].clientX, top: e.touches[0].clientY }
				) > (activationDistance || 0)
			) {
				initAnchor({
					clientX: e.touches[0].clientX,
					clientY: e.touches[0].clientY
				});
				started = true;
			}
		}
	};

	const onMouseDown = (e: MouseEvent) => {
		if (!disabled && e.button === 0) {
			const touch = {
				clientX: e.clientX,
				clientY: e.clientY
			};
			touches = [touch];
			initAnchor(touch);
			e.stopPropagation();
			onMoveStart?.();
		}
	};

	const onMouseMove = (e: MouseEvent) => {
		if (!disabled && touches.length) {
			processMove(e, [
				{
					clientX: e.clientX,
					clientY: e.clientY
				}
			]);
			if (e.preventDefault && e.cancelable) {
				e.preventDefault();
			}
			e.stopPropagation();
		}
	};

	const onMouseUp = () => {
		processEnd();
	};

	// Native, non-passive listeners: they must call preventDefault/stopPropagation
	// before the image gesture layer underneath sees the event. Svelte's `on*`
	// attributes are delegated (mousedown) or passive (touch), so they can't be used.
	function listen(element: HTMLDivElement) {
		container = element;
		const options = { passive: false };
		const cleanups = [
			on(window, 'mouseup', onMouseUp, options),
			on(window, 'mousemove', onMouseMove, options),
			on(window, 'touchmove', onTouchMove, options),
			on(window, 'touchend', onTouchEnd, options),
			on(element, 'touchstart', onTouchStart, options),
			on(element, 'mousedown', onMouseDown, options)
		];
		return () => {
			for (const cleanup of cleanups) cleanup();
			container = undefined;
		};
	}

	// Upstream's componentDidUpdate: drop the gesture when the element gets disabled.
	useUpdateEffect(
		() => {
			if (disabled) {
				touches = [];
			}
		},
		() => disabled
	);
</script>

<!-- svelte-ignore a11y_mouse_events_have_key_events -->
<div
	class={['advanced-cropper-draggable-element', className]}
	{@attach listen}
	onmouseover={onMouseOver}
	onmouseleave={onMouseLeave}
	role="presentation"
>
	{@render children?.()}
</div>

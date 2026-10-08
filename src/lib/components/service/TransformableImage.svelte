<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { ClassValue } from 'svelte/elements';
	import type { ImageTransform } from 'advanced-cropper';
	import type { TransformableImageEvent } from './TransformableImageEvent';

	export interface TransformableImageProps {
		onTransform?: (transform: ImageTransform) => void;
		onTransformEnd?: () => void;
		onEvent?: (transformEvent: TransformableImageEvent, nativeEvent: Event) => unknown;
		disabled?: boolean;
		touchMove?: boolean;
		mouseMove?: boolean;
		touchScale?: boolean;
		touchRotate?: boolean;
		wheelScale?:
			| boolean
			| {
					ratio: number;
			  };
		timeout?: number;
		children?: Snippet;
		class?: ClassValue;
		style?: string;
		preventDefault?: boolean;
	}
</script>

<script lang="ts">
	import { untrack } from 'svelte';
	import { on } from 'svelte/events';
	import {
		debounce,
		touchesToImageTransform,
		wheelEventToImageTransform,
		type SimpleTouch
	} from 'advanced-cropper';
	import { TransformableImageEvent as TransformEvent } from './TransformableImageEvent';

	let {
		onTransform,
		onTransformEnd,
		onEvent,
		disabled,
		touchMove = true,
		mouseMove = true,
		touchScale = true,
		touchRotate = false,
		wheelScale = true,
		timeout = 500,
		children,
		class: className,
		style,
		preventDefault = true
	}: TransformableImageProps = $props();

	let touches: (SimpleTouch & { identifier?: number })[] = [];
	let transforming = false;
	let container: HTMLDivElement | undefined;

	const processMove = (newTouches: SimpleTouch[]) => {
		if (container && onTransform) {
			onTransform(
				touchesToImageTransform(newTouches, touches, container, {
					scale: touchScale,
					rotate: touchRotate,
					move: touchMove
				})
			);
			touches = newTouches;
		}
	};

	const processEnd = () => {
		if (transforming) {
			transforming = false;
			onTransformEnd?.();
		}
	};

	// Upstream creates the debounced function once, from the initial `timeout`.
	const debouncedProcessEnd = debounce(processEnd, untrack(() => timeout));

	const processStart = () => {
		transforming = true;
		debouncedProcessEnd.clear();
	};

	const processEvent = (nativeEvent: Event) => {
		const transformEvent = new TransformEvent({ active: transforming });

		if (onEvent) {
			onEvent(transformEvent, nativeEvent);
		} else if (preventDefault) {
			nativeEvent.preventDefault();
			nativeEvent.stopPropagation();
		}

		return !disabled && !transformEvent.defaultPrevented;
	};

	const onWheel = (event: WheelEvent) => {
		if (wheelScale) {
			if (processEvent(event)) {
				processStart();
				if (onTransform && container) {
					onTransform(
						wheelEventToImageTransform(
							event,
							container,
							wheelScale === true ? 0.1 : wheelScale.ratio
						)
					);
				}

				if (!touches.length) {
					debouncedProcessEnd();
				}
			}
		}
	};

	const onTouchStart = (event: TouchEvent) => {
		if (
			event.cancelable &&
			(touchMove || ((touchScale || touchRotate) && event.touches.length > 1))
		) {
			if (processEvent(event) && container) {
				const { left, top, bottom, right } = container.getBoundingClientRect();
				touches = Array.from(event.touches).filter(
					(touch) =>
						touch.clientX > left &&
						touch.clientX < right &&
						touch.clientY > top &&
						touch.clientY < bottom
				);
			}
		}
	};

	const onTouchEnd = (event: TouchEvent) => {
		if (event.touches.length === 0) {
			touches = [];
			processEnd();
		}
	};

	const onTouchMove = (event: TouchEvent) => {
		if (touches.length) {
			const current = Array.from(event.touches).filter(
				(touch) =>
					!touch.identifier ||
					touches.find((anotherTouch) => anotherTouch.identifier === touch.identifier)
			);

			if (processEvent(event)) {
				processMove(current);
				processStart();
			}
		}
	};

	const onMouseDown = (event: MouseEvent) => {
		if (mouseMove && 'buttons' in event && event.buttons === 1) {
			if (processEvent(event)) {
				touches = [{ clientX: event.clientX, clientY: event.clientY }];
				processStart();
			}
		}
	};

	const onMouseMove = (event: MouseEvent) => {
		if (touches.length) {
			if (processEvent(event)) {
				processMove([{ clientX: event.clientX, clientY: event.clientY }]);
			}
		}
	};

	const onMouseUp = () => {
		touches = [];
		processEnd();
	};

	// Native, non-passive listeners, as upstream registers them (wheel and touch must
	// be able to call preventDefault).
	function listen(element: HTMLDivElement) {
		container = element;
		const options = { passive: false };
		const cleanups = [
			on(window, 'mouseup', onMouseUp, options),
			on(window, 'mousemove', onMouseMove, options),
			on(window, 'touchmove', onTouchMove, options),
			on(window, 'touchend', onTouchEnd, options),
			on(element, 'touchstart', onTouchStart, options),
			on(element, 'mousedown', onMouseDown, options),
			on(element, 'wheel', onWheel, options)
		];
		return () => {
			for (const cleanup of cleanups) cleanup();
			debouncedProcessEnd.clear();
			container = undefined;
		};
	}
</script>

<div class={className} {style} {@attach listen}>
	{@render children?.()}
</div>

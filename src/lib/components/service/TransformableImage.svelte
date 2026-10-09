<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { ClassValue } from 'svelte/elements';
	import type { ImageTransform } from 'advanced-cropper';
	import { TransformableImageEvent } from './TransformableImageEvent';

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
	import { screenScale, unscaleImageTransform } from '../../service/scale';

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
		class: cssClass,
		style,
		preventDefault = true
	}: TransformableImageProps = $props();

	// Wheel steps scale the image by 10% unless `wheelScale` gives a ratio.
	const DEFAULT_WHEEL_RATIO = 0.1;

	// The touches (or mouse position) of the previous event of the current gesture.
	let lastTouches: (SimpleTouch & { identifier?: number })[] = [];
	let transforming = false;
	let container: HTMLDivElement | undefined;

	function processMove(touches: SimpleTouch[]) {
		if (!container || !onTransform) {
			return;
		}

		// The core measures in screen pixels; convert to the container's own (see screenScale).
		const transform = touchesToImageTransform(touches, lastTouches, container, {
			scale: touchScale,
			rotate: touchRotate,
			move: touchMove
		});
		onTransform(unscaleImageTransform(transform, screenScale(container)));
		lastTouches = touches;
	}

	function processEnd() {
		lastTouches = [];
		if (transforming) {
			transforming = false;
			onTransformEnd?.();
		}
	}

	// Upstream creates the debounced function once, from the initial `timeout`.
	const debouncedProcessEnd = debounce(
		processEnd,
		untrack(() => timeout)
	);

	function processStart() {
		transforming = true;
		debouncedProcessEnd.clear();
	}

	/**
	 * Lets `onEvent` see the event first and veto it with `preventDefault()`. Without
	 * `onEvent`, the native event is consumed instead. Returns whether to transform.
	 */
	function acceptEvent(nativeEvent: Event) {
		const transformEvent = new TransformableImageEvent({ active: transforming });
		if (onEvent) {
			onEvent(transformEvent, nativeEvent);
		} else if (preventDefault) {
			nativeEvent.preventDefault();
			nativeEvent.stopPropagation();
		}

		return !disabled && !transformEvent.defaultPrevented;
	}

	const onWheel = (event: WheelEvent) => {
		if (!wheelScale || !acceptEvent(event)) {
			return;
		}

		processStart();
		if (onTransform && container) {
			const ratio = wheelScale === true ? DEFAULT_WHEEL_RATIO : wheelScale.ratio;
			const transform = wheelEventToImageTransform(event, container, ratio);
			onTransform(unscaleImageTransform(transform, screenScale(container)));
		}

		// A wheel gesture has no end event: it ends after `timeout` ms without wheeling.
		if (!lastTouches.length) {
			debouncedProcessEnd();
		}
	};

	const onTouchStart = (event: TouchEvent) => {
		const multiTouch = (touchScale || touchRotate) && event.touches.length > 1;
		if (!event.cancelable || !(touchMove || multiTouch)) {
			return;
		}

		if (!acceptEvent(event) || !container) {
			return;
		}

		// Only touches that start on the image take part in the gesture.
		const { left, top, bottom, right } = container.getBoundingClientRect();
		lastTouches = Array.from(event.touches).filter(
			(touch) =>
				touch.clientX > left &&
				touch.clientX < right &&
				touch.clientY > top &&
				touch.clientY < bottom
		);
	};

	const onTouchEnd = (event: TouchEvent) => {
		if (event.touches.length === 0) {
			lastTouches = [];
			processEnd();
		}
	};

	const onTouchMove = (event: TouchEvent) => {
		if (!lastTouches.length) {
			return;
		}

		const trackedTouches = Array.from(event.touches).filter(
			(touch) =>
				!touch.identifier || lastTouches.some((tracked) => tracked.identifier === touch.identifier)
		);
		if (acceptEvent(event)) {
			processMove(trackedTouches);
			processStart();
		}
	};

	const onMouseDown = (event: MouseEvent) => {
		if (!mouseMove || event.buttons !== 1 || !acceptEvent(event)) {
			return;
		}

		lastTouches = [{ clientX: event.clientX, clientY: event.clientY }];
		processStart();
	};

	const onMouseMove = (event: MouseEvent) => {
		if (lastTouches.length && acceptEvent(event)) {
			processMove([{ clientX: event.clientX, clientY: event.clientY }]);
		}
	};

	const onMouseUp = () => {
		lastTouches = [];
		processEnd();
	};

	// Native, non-passive listeners (wheel and touch must
	// be able to call preventDefault).
	function listen(element: HTMLDivElement) {
		container = element;
		const options = { passive: false };
		const cleanups = [
			on(window, 'mouseup', onMouseUp, options),
			on(window, 'mousemove', onMouseMove, options),
			on(window, 'touchmove', onTouchMove, options),
			on(window, 'touchend', onTouchEnd, options),
			on(window, 'touchcancel', onMouseUp, options),
			on(element, 'touchstart', onTouchStart, options),
			on(element, 'mousedown', onMouseDown, options),
			on(element, 'wheel', onWheel, options)
		];

		return () => {
			for (const cleanup of cleanups) {
				cleanup();
			}

			debouncedProcessEnd.clear();
			untrack(processEnd);
			container = undefined;
		};
	}

	$effect(() => {
		if (disabled) {
			debouncedProcessEnd.clear();
			untrack(processEnd);
		}
	});
</script>

<div class={cssClass} {style} {@attach listen}>
	{@render children?.()}
</div>

<script module lang="ts">
  /**
   * Per-event hook payload. Listeners passed to `onEvent` can call
   * `preventDefault()` to opt out of the wrapper's default
   * `e.preventDefault()` + `e.stopPropagation()` behavior.
   */
  export class TransformableImageEvent {
    active: boolean
    defaultPrevented = false
    constructor({ active }: { active: boolean }) {
      this.active = active
    }
    preventDefault() {
      this.defaultPrevented = true
    }
  }
</script>

<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { ClassValue } from 'svelte/elements'
  import {
    debounce,
    type DebouncedFunction,
    type ImageTransform,
    type Point,
    type SimpleTouch,
    touchesToImageTransform,
    wheelEventToImageTransform,
  } from 'advanced-cropper'

  interface Props {
    class?: ClassValue
    style?: string
    children?: Snippet
    /** Fired continuously during a pinch/wheel/drag with the resolved image transform (translate + scale + rotate). */
    onTransform?: (transform: ImageTransform) => void
    /** Fired once when the gesture ends (debounced by `timeout` for wheel). */
    onTransformEnd?: () => void
    /** Per-event hook for granular control. Call `preventDefault()` on the event to opt out of the wrapper's default preventDefault/stopPropagation. */
    onEvent?: (e: TransformableImageEvent, nativeEvent: Event) => unknown
    /** When true, all gestures are no-ops. */
    disabled?: boolean
    /** Drag-to-move on touch. Default true. */
    touchMove?: boolean
    /** Drag-to-move on mouse. Default true. */
    mouseMove?: boolean
    /** Pinch-to-scale on touch. Default true. */
    touchScale?: boolean
    /** Two-finger rotate on touch. Default false. */
    touchRotate?: boolean
    /** Wheel-to-scale, optionally with a custom step ratio. Default true. */
    wheelScale?: boolean | { ratio: number }
    /** Debounce for `onTransformEnd` after wheel events, in ms. Default 500. */
    timeout?: number
    /** Whether the wrapper calls preventDefault on the native event when `onEvent` isn't provided. Default true. */
    preventDefault?: boolean
  }

  let {
    class: className,
    style,
    children,
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
    preventDefault: shouldPreventDefault = true,
  }: Props = $props()

  let container: HTMLDivElement | undefined = $state()

  // Imperative gesture buffers — plain `let`, NOT $state. They mutate on every
  // touch/wheel event; reactivity here would tank performance.
  let touches: (SimpleTouch & { identifier?: number })[] = []
  let transforming = false
  let _anchor: Point = { left: 0, top: 0 }
  // Anchor field reserved for parity with the React port's interface; not
  // currently read by any handler (the engine math owns the anchor logic).
  void _anchor

  // Debounced end-of-wheel callback. The React port pins this to the initial
  // `timeout` and never refreshes — preserve that behavior so a runtime
  // timeout change doesn't reset the debouncer mid-gesture.
  let debouncedProcessEnd: DebouncedFunction<() => void>

  function processMove(newTouches: SimpleTouch[]) {
    if (!container || !onTransform) return
    onTransform(
      touchesToImageTransform(newTouches, touches, container, {
        scale: touchScale,
        rotate: touchRotate,
        move: touchMove,
      }),
    )
    touches = newTouches
  }

  function processEnd() {
    if (transforming) {
      transforming = false
      onTransformEnd?.()
    }
  }

  function processStart() {
    transforming = true
    debouncedProcessEnd?.clear()
  }

  function processEvent(nativeEvent: Event): boolean {
    const transformEvent = new TransformableImageEvent({ active: transforming })
    if (onEvent) {
      onEvent(transformEvent, nativeEvent)
    } else if (shouldPreventDefault) {
      nativeEvent.preventDefault()
      nativeEvent.stopPropagation()
    }
    return !disabled && !transformEvent.defaultPrevented
  }

  function onWheel(e: WheelEvent) {
    if (!wheelScale) return
    if (!processEvent(e)) return
    processStart()
    if (onTransform && container) {
      onTransform(
        wheelEventToImageTransform(e, container, wheelScale === true ? 0.1 : wheelScale.ratio),
      )
    }
    if (!touches.length) {
      debouncedProcessEnd?.()
    }
  }

  function onTouchStart(e: TouchEvent) {
    if (!e.cancelable) return
    if (!touchMove && !((touchScale || touchRotate) && e.touches.length > 1)) return
    if (!processEvent(e)) return
    if (!container) return
    const { left, top, bottom, right } = container.getBoundingClientRect()
    touches = Array.from(e.touches).filter(
      (t) => t.clientX > left && t.clientX < right && t.clientY > top && t.clientY < bottom,
    )
  }

  function onTouchEnd(e: TouchEvent) {
    if (e.touches.length === 0) {
      touches = []
      processEnd()
    }
  }

  function onTouchMove(e: TouchEvent) {
    if (!touches.length) return
    const filtered = [...e.touches].filter(
      (t) => !t.identifier || touches.find((other) => other.identifier === t.identifier),
    )
    if (!processEvent(e)) return
    processMove(filtered)
    processStart()
  }

  function onMouseDown(e: MouseEvent) {
    if (!mouseMove) return
    if (!('buttons' in e) || e.buttons !== 1) return
    if (!processEvent(e)) return
    touches = [{ clientX: e.clientX, clientY: e.clientY }]
    processStart()
  }

  function onMouseMove(e: MouseEvent) {
    if (!touches.length) return
    if (!processEvent(e)) return
    processMove([{ clientX: e.clientX, clientY: e.clientY }])
  }

  function onMouseUp() {
    touches = []
    processEnd()
  }

  $effect(() => {
    debouncedProcessEnd = debounce(processEnd, timeout)
    // No cleanup needed — debounce returns a callable; on subsequent runs
    // we reassign and let the GC handle the old one. If a debounced call is
    // in-flight when timeout changes, it'll still fire (matches React port).
  })

  $effect(() => {
    if (!container) return

    window.addEventListener('mouseup', onMouseUp, { passive: false })
    window.addEventListener('mousemove', onMouseMove, { passive: false })
    window.addEventListener('touchmove', onTouchMove, { passive: false })
    window.addEventListener('touchend', onTouchEnd, { passive: false })

    const el = container
    el.addEventListener('touchstart', onTouchStart, { passive: false })
    el.addEventListener('mousedown', onMouseDown, { passive: false })
    el.addEventListener('wheel', onWheel, { passive: false })

    return () => {
      window.removeEventListener('mouseup', onMouseUp)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('mousedown', onMouseDown)
      el.removeEventListener('wheel', onWheel)
    }
  })
</script>

<div bind:this={container} class={className} {style}>
  {@render children?.()}
</div>

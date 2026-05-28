<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { ClassValue } from 'svelte/elements'
  import {
    distance,
    type MoveDirections,
    type Point,
    type SimpleTouch,
  } from 'advanced-cropper'

  interface Props {
    class?: ClassValue
    children?: Snippet
    /** When true, drag and hover callbacks are ignored. Toggling true also clears any in-flight drag. */
    disabled?: boolean
    /** Fired on every pixel-step of a drag with cumulative delta since the last call. */
    onMove?: (directions: MoveDirections, event: MouseEvent | TouchEvent) => void
    /** Fired once when the user releases the drag. */
    onMoveEnd?: () => void
    /** Fired once when a drag begins (after `activationDistance` is exceeded on touch). */
    onMoveStart?: () => void
    onLeave?: () => void
    onEnter?: () => void
    /**
     * When true (default), the drag is anchored to its starting touch point;
     * moves *toward* the anchor are dampened to zero on that axis. Useful for
     * resize handles where overshoot past the anchor would feel wrong.
     */
    useAnchor?: boolean
    /** Pixels of touch movement required before a drag is recognized (touch deadband). Defaults to 30. */
    activationDistance?: number
  }

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
    activationDistance = 30,
  }: Props = $props()

  let container: HTMLDivElement | undefined = $state()

  // Imperative gesture buffers — plain `let`, NOT $state. They change on
  // every move event; making them reactive would re-run effects per pixel.
  let touches: SimpleTouch[] = []
  let started = false
  let hovered = false
  let anchor: Point = { left: 0, top: 0 }

  function processMove(e: MouseEvent | TouchEvent, newTouches: SimpleTouch[]) {
    if (!container || !touches.length) return
    if (touches.length !== 1 || newTouches.length !== 1) return
    if (!onMove) return

    const { left, top } = container.getBoundingClientRect()

    // Anchor dampening: if the new touch is moving *toward* the anchor on an
    // axis, drop the delta on that axis. Lets the user pull a resize handle
    // out and back without overshooting the start position.
    const movingToAnchor = {
      left:
        Math.abs(newTouches[0].clientX - anchor.left - left) <
        Math.abs(touches[0].clientX - anchor.left - left),
      top:
        Math.abs(newTouches[0].clientY - anchor.top - top) <
        Math.abs(touches[0].clientY - anchor.top - top),
    }
    const direction = { left: 0, top: 0 }
    if (!useAnchor || !movingToAnchor.left) {
      direction.left = newTouches[0].clientX - touches[0].clientX
    }
    if (!useAnchor || !movingToAnchor.top) {
      direction.top = newTouches[0].clientY - touches[0].clientY
    }

    onMove(direction, e)
    touches = [...newTouches]
  }

  function processEnd() {
    if (!disabled && touches.length) {
      onMoveEnd?.()
    }
    if (hovered) {
      onLeave?.()
      hovered = false
    }
    touches = []
  }

  function initAnchor(touch: SimpleTouch) {
    if (!container) return
    const { left, top } = container.getBoundingClientRect()
    anchor = {
      left: touch.clientX - left,
      top: touch.clientY - top,
    }
  }

  function onMouseOver() {
    if (!hovered && !disabled) {
      hovered = true
      onEnter?.()
    }
  }

  function onMouseLeave() {
    if (hovered && !touches.length) {
      hovered = false
      onLeave?.()
    }
  }

  function onTouchStart(e: TouchEvent) {
    if (!e.cancelable) return
    touches = Array.from(e.touches)
    const shouldStartMove = !disabled && e.touches.length === 1
    if (shouldStartMove) {
      touches = Array.from(e.touches)
      onMoveStart?.()
    }
    if (!hovered && !disabled) {
      hovered = true
      onEnter?.()
    }
    if (started || shouldStartMove) {
      e.preventDefault()
      e.stopPropagation()
    }
  }

  function onTouchEnd() {
    started = false
    processEnd()
  }

  function onTouchMove(e: TouchEvent) {
    if (touches.length < 1) return
    if (started) {
      processMove(e, Array.from(e.touches))
      e.preventDefault()
      e.stopPropagation()
    } else if (
      distance(
        { left: touches[0].clientX, top: touches[0].clientY },
        { left: e.touches[0].clientX, top: e.touches[0].clientY },
      ) > (activationDistance || 0)
    ) {
      initAnchor({ clientX: e.touches[0].clientX, clientY: e.touches[0].clientY })
      started = true
    }
  }

  function onMouseDown(e: MouseEvent) {
    if (disabled || e.button !== 0) return
    const touch = { clientX: e.clientX, clientY: e.clientY }
    touches = [touch]
    initAnchor(touch)
    e.stopPropagation()
    onMoveStart?.()
  }

  function onMouseMove(e: MouseEvent) {
    if (disabled || !touches.length) return
    processMove(e, [{ clientX: e.clientX, clientY: e.clientY }])
    if (e.preventDefault && e.cancelable) {
      e.preventDefault()
    }
    e.stopPropagation()
  }

  function onMouseUp() {
    processEnd()
  }

  // Mirror the React componentDidUpdate that clears in-flight touches when
  // `disabled` flips true. Svelte $effect re-runs whenever its tracked deps
  // change; reading `disabled` here gives us the same edge-triggered behavior.
  $effect(() => {
    if (disabled) {
      touches = []
    }
  })

  // Window + container listeners. {passive: false} is required because the
  // handlers call preventDefault() — modern browsers default touch/scroll
  // listeners to passive otherwise.
  $effect(() => {
    if (!container) return

    window.addEventListener('mouseup', onMouseUp, { passive: false })
    window.addEventListener('mousemove', onMouseMove, { passive: false })
    window.addEventListener('touchmove', onTouchMove, { passive: false })
    window.addEventListener('touchend', onTouchEnd, { passive: false })

    const el = container
    el.addEventListener('touchstart', onTouchStart, { passive: false })
    el.addEventListener('mousedown', onMouseDown, { passive: false })

    return () => {
      window.removeEventListener('mouseup', onMouseUp)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('mousedown', onMouseDown)
    }
  })
</script>

<div
  bind:this={container}
  class={['advanced-cropper-draggable-element', className]}
  onmouseover={onMouseOver}
  onmouseleave={onMouseLeave}
  onfocus={undefined}
  role="presentation"
>
  {@render children?.()}
</div>

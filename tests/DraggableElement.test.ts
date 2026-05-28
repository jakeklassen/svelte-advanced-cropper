import { expect, test, vi } from 'vitest'
import { flushSync, mount, unmount } from 'svelte'
import DraggableElement from '../src/components/service/DraggableElement.svelte'

// M3 acceptance (#3): simulate a mouse drag and assert onMove fires with
// the expected pixel delta.

test('mouse drag emits onMove with cumulative pixel deltas', async () => {
  const onMove = vi.fn()
  const onMoveStart = vi.fn()
  const onMoveEnd = vi.fn()

  const target = document.createElement('div')
  target.style.cssText = 'position:absolute;left:100px;top:100px;width:200px;height:200px'
  document.body.appendChild(target)

  // useAnchor defaults to true, which would dampen "moves toward the anchor"
  // to zero on that axis. For raw delta testing we disable it.
  const component = mount(DraggableElement, {
    target,
    props: {
      onMove,
      onMoveStart,
      onMoveEnd,
      useAnchor: false,
    },
  })
  // The $effect that wires window/container listeners runs in a microtask;
  // force-flush so dispatched events below are seen by the handlers.
  flushSync()

  try {
    // The DraggableElement wraps its content in a div with class
    // 'advanced-cropper-draggable-element'. Grab it for synthetic events.
    const el = target.querySelector('.advanced-cropper-draggable-element') as HTMLElement
    expect(el).toBeTruthy()

    // Simulate a mousedown on the element + mousemove on window + mouseup on window.
    el.dispatchEvent(new MouseEvent('mousedown', { button: 0, clientX: 150, clientY: 150, bubbles: true, cancelable: true }))
    expect(onMoveStart).toHaveBeenCalledTimes(1)

    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 170, clientY: 165, bubbles: true, cancelable: true }))
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 200, clientY: 180, bubbles: true, cancelable: true }))

    expect(onMove).toHaveBeenCalledTimes(2)
    expect(onMove).toHaveBeenNthCalledWith(
      1,
      { left: 20, top: 15 },
      expect.any(MouseEvent),
    )
    // Second move: delta from previous (170,165) → (200,180)
    expect(onMove).toHaveBeenNthCalledWith(
      2,
      { left: 30, top: 15 },
      expect.any(MouseEvent),
    )

    window.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }))
    expect(onMoveEnd).toHaveBeenCalledTimes(1)
  } finally {
    unmount(component)
    target.remove()
  }
})

test('disabled=true ignores mousedown', () => {
  const onMoveStart = vi.fn()
  const onMove = vi.fn()

  const target = document.createElement('div')
  document.body.appendChild(target)

  const component = mount(DraggableElement, {
    target,
    props: { onMoveStart, onMove, disabled: true, useAnchor: false },
  })
  flushSync()

  try {
    const el = target.querySelector('.advanced-cropper-draggable-element') as HTMLElement
    el.dispatchEvent(new MouseEvent('mousedown', { button: 0, clientX: 50, clientY: 50, bubbles: true, cancelable: true }))
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 100, clientY: 100, bubbles: true, cancelable: true }))

    expect(onMoveStart).not.toHaveBeenCalled()
    expect(onMove).not.toHaveBeenCalled()
  } finally {
    unmount(component)
    target.remove()
  }
})

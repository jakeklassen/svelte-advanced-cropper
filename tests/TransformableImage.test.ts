import { expect, test, vi } from 'vitest'
import { flushSync, mount, unmount } from 'svelte'
import TransformableImage from '../src/components/service/TransformableImage.svelte'

// M3 acceptance (#3): simulate a wheel event and assert onTransform fires
// with a scale-shaped transform.

test('wheel event emits onTransform with a scale transform', () => {
  const onTransform = vi.fn()

  const target = document.createElement('div')
  target.style.cssText = 'position:absolute;left:0;top:0;width:400px;height:300px'
  document.body.appendChild(target)

  const component = mount(TransformableImage, {
    target,
    props: { onTransform, wheelScale: true },
  })

  flushSync()
  try {
    const el = target.querySelector('div') as HTMLElement
    expect(el).toBeTruthy()

    // Wheel down (positive deltaY) over the center of the element.
    el.dispatchEvent(
      new WheelEvent('wheel', {
        deltaY: 100,
        clientX: 200,
        clientY: 150,
        bubbles: true,
        cancelable: true,
      }),
    )

    expect(onTransform).toHaveBeenCalledTimes(1)
    const [transform] = onTransform.mock.calls[0]

    // wheelEventToImageTransform produces a transform with a `scale` field
    // that contains both a factor and a focal-point center. Sanity-check shape.
    expect(transform).toBeDefined()
    expect(transform.scale).toBeDefined()
    // Either a number or an object with `factor`
    const hasFactor =
      typeof transform.scale === 'number' ||
      (transform.scale && typeof transform.scale === 'object' && 'factor' in transform.scale)
    expect(hasFactor).toBe(true)
  } finally {
    unmount(component)
    target.remove()
  }
})

test('disabled=true via onEvent.preventDefault prevents onTransform', () => {
  const onTransform = vi.fn()

  const target = document.createElement('div')
  document.body.appendChild(target)

  const component = mount(TransformableImage, {
    target,
    props: { onTransform, wheelScale: true, disabled: true },
  })

  flushSync()
  try {
    const el = target.querySelector('div') as HTMLElement
    el.dispatchEvent(
      new WheelEvent('wheel', { deltaY: 100, clientX: 100, clientY: 100, bubbles: true, cancelable: true }),
    )
    expect(onTransform).not.toHaveBeenCalled()
  } finally {
    unmount(component)
    target.remove()
  }
})

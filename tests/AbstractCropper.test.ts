import { expect, test } from 'vitest'
import { flushSync, mount, unmount } from 'svelte'
import AbstractCropper from '../src/components/AbstractCropper.svelte'

// M5 acceptance (#5): mount AbstractCropper, load an image, call getCanvas(),
// assert an HTMLCanvasElement comes back. End-to-end coverage of the full
// engine integration + composition stack.

function waitFor<T>(fn: () => T | null | undefined | false, timeout = 5000): Promise<T> {
  return new Promise((resolve, reject) => {
    const start = Date.now()
    const tick = () => {
      const result = fn()
      if (result) return resolve(result as T)
      if (Date.now() - start > timeout) return reject(new Error('waitFor timeout'))
      requestAnimationFrame(tick)
    }
    tick()
  })
}

test('AbstractCropper loads an image and getCanvas() returns a real canvas', async () => {
  const src =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAJUlEQVR42u3NMQEAAAQAMHrSXywG3z0xWvuoVCqVSqVSqVT/4QHAACpwAg/2nUFOAAAAAElFTkSuQmCC'

  const target = document.createElement('div')
  target.style.cssText = 'width:200px;height:200px;position:absolute;top:0;left:0'
  document.body.appendChild(target)

  let ref: any
  const component = mount(AbstractCropper, {
    target,
    props: {
      src,
      // Capture the imperative API via the onReady callback (the harness
      // mirrors how a consumer would `bind:this`).
      onReady: (cropper) => {
        ref = cropper
      },
    },
  })
  flushSync()

  try {
    // Wait until getCanvas() returns non-null. onReady fires synchronously
    // after the engine has state, but the background <img> ref binds in the
    // next render tick — we need both before getCanvas() can succeed.
    const canvas = await waitFor(() => {
      flushSync()
      return ref?.getCanvas() ?? null
    })

    expect(canvas).toBeInstanceOf(HTMLCanvasElement)
    expect(canvas.width).toBeGreaterThan(0)
    expect(canvas.height).toBeGreaterThan(0)
  } finally {
    unmount(component)
    target.remove()
  }
})

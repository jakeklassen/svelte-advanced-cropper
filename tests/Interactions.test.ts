import { expect, test } from 'vitest'
import { flushSync, mount, unmount } from 'svelte'
import Cropper from '../src/components/croppers/Cropper.svelte'
import FixedCropper from '../src/components/croppers/FixedCropper.svelte'
import CropperPreview from '../src/components/helpers/CropperPreview.svelte'

// Engine styles so the boundary / background-wrapper resolve to real boxes —
// required for the wheel-zoom and preview-mirroring assertions.
import 'advanced-cropper/styles/index.scss'
import 'advanced-cropper/themes/default.scss'

/**
 * Interaction coverage (#8) — broadens the regression net beyond the five demo
 * bugs to the core gestures/imperative paths: move, resize, flip, wheel-zoom,
 * FixedCropper size-locking, and CropperPreview mirroring. (EXIF orientation is
 * not covered here — it needs a fixture image carrying orientation metadata;
 * tracked separately in #8.)
 */

const SRC =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAJUlEQVR42u3NMQEAAAQAMHrSXywG3z0xWvuoVCqVSqVSqVT/4QHAACpwAg/2nUFOAAAAAElFTkSuQmCC'

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

function makeTarget(w = 400, h = 300): HTMLDivElement {
  const target = document.createElement('div')
  target.style.cssText = `position:absolute;left:0;top:0;width:${w}px;height:${h}px`
  document.body.appendChild(target)
  return target
}

const ratio = (c: { width: number; height: number }) => c.width / c.height

function mountReady(props: Record<string, unknown>) {
  const target = makeTarget()
  const ref = mount(Cropper, { target, props: { src: SRC, ...props } }) as any
  flushSync()
  return { target, ref }
}

// ── Move the stencil ────────────────────────────────────────────────────────
test('moveCoordinates shifts the crop box', async () => {
  const { target, ref } = mountReady({})
  try {
    const before = (await waitFor(() => {
      flushSync()
      return ref.getCoordinates?.() ?? null
    })) as any

    ref.moveCoordinates({ left: 15, top: 10 }, { interaction: false })
    flushSync()

    const after = ref.getCoordinates() as any
    const delta = Math.abs(after.left - before.left) + Math.abs(after.top - before.top)
    expect(delta).toBeGreaterThan(0.5)
  } finally {
    unmount(ref)
    target.remove()
  }
})

// ── Resize the stencil (free aspect) ────────────────────────────────────────
test('resizeCoordinates changes the crop size', async () => {
  const { target, ref } = mountReady({})
  try {
    const before = (await waitFor(() => {
      flushSync()
      const c = ref.getCoordinates?.()
      return c && c.width ? c : null
    })) as any

    // Shrink inward from the center on all sides.
    ref.resizeCoordinates(
      'center',
      { left: -8, right: -8, top: -8, bottom: -8 },
      {},
      { interaction: false },
    )
    flushSync()

    const after = ref.getCoordinates() as any
    expect(after.width).not.toBeCloseTo(before.width, 1)
  } finally {
    unmount(ref)
    target.remove()
  }
})

// ── Flip ────────────────────────────────────────────────────────────────────
test('flipImage toggles the horizontal flip transform', async () => {
  const { target, ref } = mountReady({})
  try {
    await waitFor(() => {
      flushSync()
      return ref.getCanvas?.() ?? null
    })

    expect(ref.getState().transforms.flip.horizontal).toBe(false)
    ref.flipImage(true, false, { transitions: false })
    flushSync()
    expect(ref.getState().transforms.flip.horizontal).toBe(true)
  } finally {
    unmount(ref)
    target.remove()
  }
})

// ── Wheel zoom (integrated through the background wrapper) ──────────────────
test('wheel over the background scales the visible area', async () => {
  const { target, ref } = mountReady({})
  try {
    const before = (await waitFor(() => {
      flushSync()
      const va = ref.getVisibleArea?.()
      return va && va.width ? va : null
    })) as any

    const wrapper = target.querySelector('.advanced-cropper__background-wrapper') as HTMLElement
    const rect = wrapper.getBoundingClientRect()
    wrapper.dispatchEvent(
      new WheelEvent('wheel', {
        deltaY: -240, // zoom in
        clientX: rect.left + rect.width / 2,
        clientY: rect.top + rect.height / 2,
        bubbles: true,
        cancelable: true,
      }),
    )
    flushSync()

    const after = ref.getVisibleArea() as any
    expect(Math.abs(after.width - before.width)).toBeGreaterThan(0.5)
  } finally {
    unmount(ref)
    target.remove()
  }
})

// ── FixedCropper locks the stencil size/aspect ─────────────────────────────
test('FixedCropper keeps its locked aspect through a resize attempt', async () => {
  const target = makeTarget()
  const ref = mount(FixedCropper, {
    target,
    props: { src: SRC, stencilSize: { width: 120, height: 80 } },
  }) as any
  flushSync()
  try {
    const coords = (await waitFor(() => {
      flushSync()
      const c = ref.getCoordinates?.()
      return c && c.width && c.height ? c : null
    })) as any
    // Locked to the 120x80 → 1.5 aspect.
    expect(Math.abs(ratio(coords) - 1.5)).toBeLessThan(0.15)

    // A resize attempt must not break the locked aspect.
    ref.resizeCoordinates(
      'eastSouth',
      { left: 0, top: 0, right: 40, bottom: 0 },
      {},
      { interaction: false },
    )
    flushSync()
    const after = ref.getCoordinates() as any
    expect(Math.abs(ratio(after) - 1.5)).toBeLessThan(0.15)
  } finally {
    unmount(ref)
    target.remove()
  }
})

// ── CropperPreview mirrors the cropped region ──────────────────────────────
test('CropperPreview mirrors the cropper (content sized from coordinates)', async () => {
  const cropperTarget = makeTarget()
  const ref = mount(Cropper, { target: cropperTarget, props: { src: SRC } }) as any
  flushSync()

  const previewTarget = makeTarget(160, 120)
  const previewRef = mount(CropperPreview, {
    target: previewTarget,
    props: { cropper: ref },
  }) as any
  flushSync()
  try {
    // Wait until the cropper is ready, then refresh the preview.
    await waitFor(() => {
      flushSync()
      return ref.getState?.()?.coordinates ?? null
    })
    await previewRef.refresh()
    flushSync()

    // Mirroring is proven by the preview computing a content box from the
    // cropper's coordinates (non-empty width style) and pointing at the same image.
    const content = await waitFor(() => {
      const el = previewTarget.querySelector('.advanced-cropper-preview__content') as HTMLElement | null
      return el && el.style.width ? el : null
    })
    expect(content.style.width).toMatch(/\d/)

    const img = previewTarget.querySelector('.advanced-cropper-preview__image') as HTMLElement
    expect(img).toBeTruthy()
  } finally {
    unmount(previewRef)
    unmount(ref)
    previewTarget.remove()
    cropperTarget.remove()
  }
})

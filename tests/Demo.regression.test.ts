import { expect, test } from 'vitest'
import { flushSync, mount, unmount } from 'svelte'
import { render } from 'vitest-browser-svelte'
import AbstractCropper from '../src/components/AbstractCropper.svelte'
import Cropper from '../src/components/croppers/Cropper.svelte'
import CircleStencil from '../src/components/stencils/CircleStencil.svelte'

// Engine styles — needed by the layout/gesture test below, where the
// `advanced-cropper__background-wrapper` class must actually resolve to
// `position:absolute; inset:0` for the gesture surface to have a real box.
// (Harmless for the other tests; applies globally in the browser.)
import 'advanced-cropper/styles/index.scss'
import 'advanced-cropper/themes/default.scss'

/**
 * Regression suite for the five runtime bugs found while building the demo.
 * Every one passed `svelte-check` and was invisible until interacted with —
 * exactly the class of failure the port keeps shipping. Each test below is a
 * lock on one of them:
 *
 *   1. Missing load-bearing engine classes (`advanced-cropper`,
 *      `__boundary`, `__background-wrapper`) → layout/gesture collapse.
 *   2. Public <Cropper> only forwarded getRef(), not the full imperative API.
 *   3. Settings merge order dropped the stencil's aspectRatio constraint
 *      (free-aspect chips + CircleStencil resizable into an oval).
 *   4. Auto-reconcile $effect didn't track `stencilProps`/`settings`, so live
 *      prop changes were ignored.
 *   5. Missing `__background-wrapper` class → drag-to-move-image was dead.
 *
 * See memory: project-load-bearing-engine-classes, project-settings-merge-order.
 */

// A 64x64 PNG (square) — small, deterministic, and square so aspect-ratio
// assertions have an unambiguous baseline.
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

// ── Bug #1 + #5: load-bearing engine classes are present ───────────────────
test('AbstractCropper renders the load-bearing engine classes', async () => {
  const target = makeTarget()
  let ref: any
  const component = mount(AbstractCropper, {
    target,
    props: { src: SRC, onReady: (c: any) => (ref = c) },
  })
  flushSync()
  try {
    // Wait until the cropper has state (the background image renders then).
    await waitFor(() => {
      flushSync()
      return ref?.getCanvas() ?? null
    })

    // These four classes are what the engine SCSS targets for flex layout and
    // absolute-fill positioning. Dropping any of them is a silent layout bug.
    expect(target.querySelector('.advanced-cropper')).toBeTruthy()
    expect(target.querySelector('.advanced-cropper__boundary')).toBeTruthy()
    expect(target.querySelector('.advanced-cropper__background-wrapper')).toBeTruthy()
    expect(target.querySelector('.advanced-cropper__background')).toBeTruthy()
  } finally {
    unmount(component)
    target.remove()
  }
})

// ── Bug #2: <Cropper> forwards the full imperative API, not just getRef ─────
test('Cropper exposes the full imperative API via its component exports', async () => {
  const target = makeTarget()
  // mount() returns the component's exports — i.e. exactly what `bind:this`
  // on <Cropper> hands a consumer. Before the fix this only had getRef().
  const ref = mount(Cropper, { target, props: { src: SRC } }) as any
  flushSync()
  try {
    const canvas = await waitFor(() => {
      flushSync()
      return ref.getCanvas?.() ?? null
    })

    expect(canvas).toBeInstanceOf(HTMLCanvasElement)
    expect(ref.getImage()).toBeTruthy()
    // Spot-check a representative slice of the forwarded surface.
    for (const method of ['reset', 'refresh', 'getState', 'getCoordinates', 'setCoordinates']) {
      expect(typeof ref[method]).toBe('function')
    }
  } finally {
    unmount(ref)
    target.remove()
  }
})

// ── Bug #3: a stencil aspectRatio actually constrains the coordinates ───────
test('stencilProps.aspectRatio constrains the default coordinates (16:9)', async () => {
  const target = makeTarget()
  const ref = mount(Cropper, {
    target,
    props: { src: SRC, stencilProps: { aspectRatio: 16 / 9 } },
  }) as any
  flushSync()
  try {
    const coords = await waitFor(() => {
      flushSync()
      const c = ref.getCoordinates?.()
      return c && c.width && c.height ? c : null
    })
    // Pre-fix the constraint was clobbered to free-aspect, so a square image
    // yielded square-ish coordinates (ratio ~1). Post-fix it honors 16:9.
    expect(Math.abs(ratio(coords) - 16 / 9)).toBeLessThan(0.15)
  } finally {
    unmount(ref)
    target.remove()
  }
})

// ── Bug #4: changing the aspectRatio prop at runtime reconciles live ────────
test('changing aspectRatio at runtime re-constrains the coordinates', async () => {
  const screen = render(Cropper, { src: SRC, stencilProps: { aspectRatio: 1 } })
  const ref = screen.component as any
  try {
    // Starts square.
    await waitFor(() => {
      flushSync()
      const c = ref.getCoordinates?.()
      return c && c.width && c.height && Math.abs(ratio(c) - 1) < 0.15 ? c : null
    })

    // Live prop change → the auto-reconcile effect must pick it up.
    await screen.rerender({ src: SRC, stencilProps: { aspectRatio: 16 / 9 } })

    await waitFor(() => {
      flushSync()
      const c = ref.getCoordinates?.()
      return c && Math.abs(ratio(c) - 16 / 9) < 0.15 ? c : null
    })
  } finally {
    await screen.unmount()
  }
})

// ── Bug #3 (circle): CircleStencil holds 1:1 — can't be made an oval ────────
test('CircleStencil keeps a 1:1 ratio even when set to a non-square size', async () => {
  const target = makeTarget()
  const ref = mount(Cropper, {
    target,
    props: { src: SRC, stencilComponent: CircleStencil },
  }) as any
  flushSync()
  try {
    await waitFor(() => {
      flushSync()
      const c = ref.getCoordinates?.()
      return c && c.width && c.height ? c : null
    })

    // Deliberately force a wildly non-square size. With the 1:1 constraint
    // wired, the engine snaps it back to square; pre-fix (free aspect) it
    // would have stayed 5:1 — i.e. an oval.
    ref.setCoordinates({ width: 250, height: 50 })
    const coords = await waitFor(() => {
      flushSync()
      const c = ref.getCoordinates?.()
      return c && Math.abs(ratio(c) - 1) < 0.15 ? c : null
    })
    expect(Math.abs(ratio(coords) - 1)).toBeLessThan(0.15)

    // And the canvas export is square-ish too.
    const canvas = ref.getCanvas()
    expect(canvas).toBeInstanceOf(HTMLCanvasElement)
    expect(Math.abs(canvas.width / canvas.height - 1)).toBeLessThan(0.15)
  } finally {
    unmount(ref)
    target.remove()
  }
})

// ── Coverage gap (#8): rotation is wired but was never verified ─────────────
// rotateImage applies a *relative* angle that accumulates in
// state.transforms.rotate, and getCanvas() then draws through the rotated
// `prepareSource` path — exactly the geometry a port can silently break.
test('rotateImage accumulates and getCanvas survives the rotated draw path', async () => {
  const target = makeTarget()
  const ref = mount(Cropper, { target, props: { src: SRC } }) as any
  flushSync()
  try {
    await waitFor(() => {
      flushSync()
      return ref.getCanvas?.() ?? null
    })

    // Baseline: no rotation.
    expect(ref.getState().transforms.rotate).toBe(0)

    // Rotate +90 (transitions off for deterministic, synchronous state).
    ref.rotateImage(90, { transitions: false })
    flushSync()
    expect(ref.getState().transforms.rotate).toBe(90)

    // The rotated export path must still produce a real, non-empty canvas.
    let canvas = ref.getCanvas()
    expect(canvas).toBeInstanceOf(HTMLCanvasElement)
    expect(canvas.width).toBeGreaterThan(0)
    expect(canvas.height).toBeGreaterThan(0)

    // Accumulates rather than replaces.
    ref.rotateImage(90, { transitions: false })
    flushSync()
    expect(ref.getState().transforms.rotate).toBe(180)
    canvas = ref.getCanvas()
    expect(canvas).toBeInstanceOf(HTMLCanvasElement)
    expect(canvas.width).toBeGreaterThan(0)
  } finally {
    unmount(ref)
    target.remove()
  }
})

// ── Bug #5: the gesture surface fills the boundary and pans the image ───────
test('dragging the background pans the visible area (gesture surface fills boundary)', async () => {
  const target = makeTarget()
  const ref = mount(Cropper, {
    target,
    // imageRestriction lives in settings; `none` lets the image pan freely so
    // the drag produces an observable change.
    props: { src: SRC, settings: { imageRestriction: 'none' } },
  }) as any
  flushSync()
  try {
    await waitFor(() => {
      flushSync()
      return ref.getCanvas?.() ?? null
    })

    const wrapper = target.querySelector('.advanced-cropper__background-wrapper') as HTMLElement
    expect(wrapper).toBeTruthy()
    // The collapse bug: without the engine class this box is 0×0 and no drag
    // can ever register outside the image pixels.
    const rect = wrapper.getBoundingClientRect()
    expect(rect.width).toBeGreaterThan(0)
    expect(rect.height).toBeGreaterThan(0)

    const before = ref.getVisibleArea() as { left: number; top: number }
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2

    wrapper.dispatchEvent(
      new MouseEvent('mousedown', { buttons: 1, clientX: cx, clientY: cy, bubbles: true, cancelable: true }),
    )
    window.dispatchEvent(
      new MouseEvent('mousemove', { buttons: 1, clientX: cx + 60, clientY: cy + 30, bubbles: true, cancelable: true }),
    )
    window.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }))
    flushSync()

    const after = ref.getVisibleArea() as { left: number; top: number }
    const moved = Math.abs(after.left - before.left) + Math.abs(after.top - before.top)
    expect(moved).toBeGreaterThan(0.5)
  } finally {
    unmount(ref)
    target.remove()
  }
})

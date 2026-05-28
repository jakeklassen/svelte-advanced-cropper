import { expect, test } from 'vitest'
import { render } from 'vitest-browser-svelte'
import {
  ImageRestriction,
  createDefaultSettings,
  createState,
  type CropperImage,
} from 'advanced-cropper'
import CropperCanvas from '../src/components/service/CropperCanvas.svelte'

// M2 acceptance (#2): CropperCanvas.draw() returns a real HTMLCanvasElement
// when given a loaded image + valid engine state. This is the entry point
// consumers use to get cropped output, so end-to-end coverage matters.

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

test('draw() returns an HTMLCanvasElement when given a loaded image + state', async () => {
  const screen = render(CropperCanvas)
  const canvas = screen.component as unknown as { draw: typeof CropperCanvas.prototype.draw }

  // Generate a real image element from a same-origin data URL — avoids
  // any cross-origin canvas tainting in Playwright.
  const src =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAJUlEQVR42u3NMQEAAAQAMHrSXywG3z0xWvuoVCqVSqVSqVT/4QHAACpwAg/2nUFOAAAAAElFTkSuQmCC'
  const image = await loadImage(src)

  const cropperImage: CropperImage = {
    src: image.src,
    width: image.naturalWidth,
    height: image.naturalHeight,
    transforms: { rotate: 0, flip: { horizontal: false, vertical: false } },
    arrayBuffer: null,
  }

  // Match the React port's settings stack: pass user overrides + the engine's
  // createDefaultSettings fill-ins to get a complete settings object.
  const userSettings = {
    imageRestriction: ImageRestriction.none,
    transformImage: { adjustStencil: true },
  }
  const settings = {
    ...userSettings,
    ...createDefaultSettings(userSettings as any),
  } as any

  const state = createState(
    { boundary: { width: 200, height: 200 }, image: cropperImage },
    settings,
  )

  expect(state).not.toBeNull()

  const out = canvas.draw(state!, image)

  expect(out).toBeInstanceOf(HTMLCanvasElement)
  expect(out!.width).toBeGreaterThan(0)
  expect(out!.height).toBeGreaterThan(0)
})

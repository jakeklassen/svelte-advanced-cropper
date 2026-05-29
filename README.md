# svelte-advanced-cropper

[![CI](https://github.com/jakeklassen/svelte-advanced-cropper/actions/workflows/ci.yml/badge.svg)](https://github.com/jakeklassen/svelte-advanced-cropper/actions/workflows/ci.yml)

A Svelte 5 port of [react-advanced-cropper](https://github.com/advanced-cropper/react-advanced-cropper) — a flexible, themeable image cropper built on the framework-agnostic [`advanced-cropper`](https://github.com/Norserium/advanced-cropper) engine.

## Install

```bash
pnpm add svelte-advanced-cropper
```

`advanced-cropper` (the engine) ships as a transitive dependency — you do not need to install it separately.

## Minimal usage

```svelte
<script lang="ts">
  import { Cropper, type CropperRef } from 'svelte-advanced-cropper'
  import 'svelte-advanced-cropper/style.css'

  let cropperRef: CropperRef | undefined = $state(undefined)

  function crop() {
    const canvas = cropperRef?.getCanvas()
    if (canvas) {
      console.log(canvas.toDataURL('image/png'))
    }
  }
</script>

<div style="width: 480px; height: 320px;">
  <Cropper
    bind:this={cropperRef}
    src="https://picsum.photos/seed/cropper/1200/800"
  />
</div>

<button onclick={crop}>Crop</button>
```

## Components

- **`<Cropper>`** — the everyday cropper. Free-form aspect ratio, drag to move, drag handles to resize, scroll-wheel zoom.
- **`<FixedCropper>`** — locked stencil size, no resize handles. Useful for avatar / banner crops with a known target dimension.
- **`<AbstractCropper>`** — the underlying composer. Use directly for a custom stencil (via `stencilComponent` / the `stencil` snippet) and to tune the background gesture layer via `backgroundWrapperProps`.
- **`<CropperPreview>`** — a mirror view of the cropped output at an arbitrary preview size.

The full surface (incl. lower-level building blocks — `BoundingBox`, `RectangleStencil`, `CircleStencil`, `DraggableElement`, `TransformableImage`, etc.) is re-exported from the package root.

## Themes

The default theme ships at `svelte-advanced-cropper/style.css`. Four additional themes are available:

```ts
import 'svelte-advanced-cropper/themes/bubble.css'
import 'svelte-advanced-cropper/themes/classic.css'
import 'svelte-advanced-cropper/themes/compact.css'
import 'svelte-advanced-cropper/themes/corners.css'
```

Apply one in addition to the base styles. To override SCSS variables (`$base-color`, `$handler-size`, …), import the engine's SCSS sources from `advanced-cropper` directly in your own stylesheet.

## Imperative API (`bind:this`)

```ts
interface CropperRef {
  reset(): Promise<void>
  refresh(): Promise<void>
  setImage(image: CropperImage): void
  moveImage(...): void
  zoomImage(...): void
  rotateImage(...): void
  flipImage(...): void
  getCanvas(options?: DrawOptions): HTMLCanvasElement | null
  getCoordinates(): Coordinates
  getState(): CropperState | null
  // ...full list mirrors the React port's AbstractCropperRef
}
```

## Engine re-exports

The full `advanced-cropper` surface is re-exported (`createState`, `drawCroppedArea`, all algorithms, types, utility functions) so consumers don't need to install the engine separately.

## Customization

The stencil is swappable via both a **snippet** (Svelte-idiomatic) and a **component prop** (React-API parity):

```svelte
<!-- Snippet override -->
<Cropper src="...">
  {#snippet stencil({ cropper, image })}
    <MyCustomStencil {cropper} {image} />
  {/snippet}
</Cropper>

<!-- Component-prop override -->
<Cropper src="..." stencilComponent={CircleStencil} />
```

The same snippet/component-prop duo applies one level deeper inside the stencils — `handlerComponent` / `handler` and `lineComponent` / `line` on `RectangleStencil` / `CircleStencil`. `<CropperPreview>` additionally accepts `wrapperComponent`, `backgroundComponent`, and `boundaryComponent` overrides.

## Development

Tool versions (node, pnpm) are pinned in `mise.toml`; run [`mise install`](https://mise.jdx.dev) to match them.

- `pnpm install`
- `pnpm storybook` — interactive component gallery (http://localhost:6006)
- `pnpm test` — Vitest browser mode (watch); `pnpm test:ci` for a single run
- `pnpm build` — `tsdown` + SCSS compile
- `pnpm typecheck` — `svelte-check`

CI (`.github/workflows/ci.yml`) runs typecheck, the browser-mode test suite (real Chromium via Playwright), and the build on every push/PR to `main`.

## License

MIT

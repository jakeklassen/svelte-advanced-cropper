# svelte-advanced-cropper

## 0.1.4

### Patch Changes

- [#29](https://github.com/jakeklassen/svelte-advanced-cropper/pull/29) [`f9ec160`](https://github.com/jakeklassen/svelte-advanced-cropper/commit/f9ec16078a6034bd77423b287a914b1cc703d149) Thanks [@jakeklassen](https://github.com/jakeklassen)! - Release memory that croppers held onto after loading or exporting a rotated photo:

  - With `checkOrientation` (the default), a photo with an EXIF orientation is shown from a copy the cropper makes of the file. That copy was never released, so every such photo, which includes most portrait photos from phones, stayed in memory until the page closed. It is now released once the photo is replaced, `src` is cleared, or the cropper is destroyed. Your own `src` URL is never revoked.
  - `getCanvas()` on a rotated or flipped image drew the whole photo into a hidden canvas first and kept it there (92 MB for a 24-megapixel photo, measured in Chrome). That canvas is now emptied after each export.

## 0.1.3

### Patch Changes

- [`965e26e`](https://github.com/jakeklassen/svelte-advanced-cropper/commit/965e26ec9300441e5cdc8cefb349af34fd4c677d) Thanks [@jakeklassen](https://github.com/jakeklassen)! - Make gestures follow the pointer inside a container scaled with a CSS transform. Dragging the stencil or its handles, panning, pinching and wheel zooming used screen pixels as they were, so inside a container scaled to 50% the stencil moved half as far as the pointer and the wheel zoomed around the wrong point.

## 0.1.2

### Patch Changes

- [`4bb8d13`](https://github.com/jakeklassen/svelte-advanced-cropper/commit/4bb8d139d64dfc85d4e9bb6260171447ad280028) Thanks [@jakeklassen](https://github.com/jakeklassen)! - Report `onError` for a `blob:` URL that can no longer be read (revoked, or evicted from memory). With `checkOrientation` on, which is the default, such a load used to hang forever: neither `onReady` nor `onError` fired, because the core reads blob URLs with a request that has no error handler.

## 0.1.1

### Patch Changes

- [`3f89275`](https://github.com/jakeklassen/svelte-advanced-cropper/commit/3f892751ac70592fd83898a9bd82783964291304) Thanks [@jakeklassen](https://github.com/jakeklassen)! - Measure the cropper's boundary at its layout size, so a cropper inside a dialog that scales in, or inside any scaled container, is sized correctly. Upstream measures the on-screen size, which includes CSS transforms. The new default size algorithm is exported as `fillLayoutBoundary`.

## 0.1.0

### Minor Changes

- First release: a Svelte 5 port of react-advanced-cropper with the same public API (croppers, stencils, preview, hooks, ref methods and the advanced-cropper core), plus the global stylesheet and themes.

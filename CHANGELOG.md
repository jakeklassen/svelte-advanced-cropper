# svelte-advanced-cropper

## 0.1.2

### Patch Changes

- [`4bb8d13`](https://github.com/jakeklassen/svelte-advanced-cropper/commit/4bb8d139d64dfc85d4e9bb6260171447ad280028) Thanks [@jakeklassen](https://github.com/jakeklassen)! - Report `onError` for a `blob:` URL that can no longer be read (revoked, or evicted from memory). With `checkOrientation` on, which is the default, such a load used to hang forever: neither `onReady` nor `onError` fired, because the core reads blob URLs with a request that has no error handler.

## 0.1.1

### Patch Changes

- [`3f89275`](https://github.com/jakeklassen/svelte-advanced-cropper/commit/3f892751ac70592fd83898a9bd82783964291304) Thanks [@jakeklassen](https://github.com/jakeklassen)! - Measure the cropper's boundary at its layout size, so a cropper inside a dialog that scales in, or inside any scaled container, is sized correctly. Upstream measures the on-screen size, which includes CSS transforms. The new default size algorithm is exported as `fillLayoutBoundary`.

## 0.1.0

### Minor Changes

- First release: a Svelte 5 port of react-advanced-cropper with the same public API (croppers, stencils, preview, hooks, ref methods and the advanced-cropper core), plus the global stylesheet and themes.

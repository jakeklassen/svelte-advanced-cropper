# Prior attempt: jakeklassen/svelte-advanced-cropper (May 2026)

> Historical study of the upstream implementation and earlier port. Proposed mappings and release observations below are not the 0.2.0 API; see the [current design log](00-index.md) for superseding decisions.

Clone: `tmp/old-svelte-advanced-cropper` (git-ignored). Backup: `../svelte-advanced-cropper-backup`.

It is a Svelte 5 runes port that wraps the `advanced-cropper` core, built as a tsdown/rollup library with a Storybook demo. It has 13 commits from 2026-05-28 to 05-29, a single `main` branch, no tags, and was **never published to npm**, so the name and version are free. Every upstream component exists, with 20 browser tests.

## Gaps against upstream (the new port must close these)

- No public hook equivalents (`useAbstractCropper`, `useCropperInstance`, `useCropperImage`, `useMoveImageOptions`, `useScaleImageOptions`, `useRotateImageOptions`, `useWindowResize`, `useUpdateEffect`), no `types.ts` port, no `service/react` (`createCropper`, ...), and the explicit `isLower`… re-exports are missing.
- The structural `wrapperComponent`, `boundaryComponent`, `backgroundComponent` and `backgroundWrapperComponent` props were hardcoded (old issue #9).
- It renamed `className` to `class` everywhere, typed as `ClassValue`. The new port does the same for the root prop only (see `00-index.md`).
- Heavy `any` (68 uses). About 30 imperative methods are re-forwarded by hand through each wrapper.
- `exports` lacked `./style.css` and `./themes/*.css` even though the README told users to import them.

## Lessons to carry over

1. **Settings merge order.** Apply `stencilConstraints(userSettings, stencilOptions)` first, then spread `createDefaultSettings(extendedSettings)`. With the reverse order the stencil aspect ratio is silently lost: presets stop working and CircleStencil stretches into an oval.
2. **Auto-reconcile dependencies.** Upstream's `useCropperAutoReconcile` runs after every render. In Svelte the effect has to explicitly _read_ `settings`, `stencilProps` and the other parameters so they are tracked.
3. **Load-bearing classes.** `advanced-cropper` on the wrapper and `advanced-cropper__background-wrapper` on the gesture layer. Without the core CSS on these, the layout overflows and image dragging does nothing.
4. **Instance bridge.** Subclass `AbstractCropperInstance` with `data = $state.raw(...)` and `getProps`/`setData`/`getData`. This replaces upstream's `onChange` + `useForceRerender`.
5. **Image loader.** A single `$effect` + `untrack`, with a src-race guard (`#currentSrc`), `unloadTime` and `promiseTimeout`.
6. **Pointer/touch/wheel.** Upstream registers `{ passive: false }` listeners on window and on the element, damps the anchor, uses a touch activation distance, exposes a `TransformableImageEvent` with a `preventDefault` opt-out, and debounces wheel end. Implement these as attachments, and touch `window` only inside them so SSR stays safe.
7. **ArtificialTransition.** Uses the core `Animation`, non-reactive interpolation values, direct DOM writes per frame, and skips the first run.
8. **Background style.** The core's camelCase `getBackgroundStyle` output must be converted to an inline style string.

## Test scenarios to port (as `*.svelte.test.ts` with `vitest-browser-svelte`)

- Aspect constraint, including changing it at runtime; CircleStencil stays 1:1.
- Rotation accumulates, and `getCanvas` still works after rotating.
- Background drag pans the image; wheel zoom.
- Moving and resizing update the coordinates; flip.
- FixedCropper locks its ratio.
- Preview mirrors the cropper and forwards `backgroundProps`.
- Old issue #15: EXIF orientation, using a fixture JPEG with Orientation=6.

## Reusable infrastructure

- `.github/workflows/ci.yml`: checkout + `jdx/mise-action` + `pnpm install --frozen-lockfile` + `playwright install --with-deps chromium`, then the checks, with concurrency cancel.
- Its cat demo images have no recorded source or license. Do not reuse them.

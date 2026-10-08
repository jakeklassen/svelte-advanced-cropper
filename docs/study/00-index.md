# Port study: index, mapping and decisions

The upstream target is `react-advanced-cropper` `master` (package.json 0.20.2, unreleased; npm latest is 0.20.1). The commits after 0.20.1 only fix types and docs. The core is `advanced-cropper@0.17.1`, a runtime dependency.

| Doc                          | Covers                                                                            |
| ---------------------------- | --------------------------------------------------------------------------------- |
| `01-core.md`                 | The `advanced-cropper` core: instance contract, state flow, styles, packaging     |
| `02-components.md`           | Every React component: props, DOM/classes, events, Svelte mapping                 |
| `03-hooks-instance-types.md` | Hooks, `CropperInstance`, `types.ts`, the public export list, timing guarantees   |
| `04-docs-site.md`            | The Docusaurus site: page and demo inventory, licensing, SvelteKit plan           |
| `05-old-repo.md`             | Lessons from the earlier attempt (github.com/jakeklassen/svelte-advanced-cropper) |

## Public API mapping

Everything upstream exports from `src/index.ts` exists under the same name, except where marked N/A.

| Upstream (React)                                                         | Svelte                                                                                                                                                                    |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `<Cropper ref={ref} …/>`, `CropperRef`                                   | `<Cropper bind:this={cropper} …/>`. The component instance exposes every `CropperRef` method (all 33 runtime methods, including the 4 upstream left untyped).             |
| `<FixedCropper>`, `FixedCropperRef`, `FixedCropperSettings`              | Same.                                                                                                                                                                     |
| `AbstractCropper` (not exported upstream)                                | Exported: `useAbstractCropper`'s types depend on it, and it is the base for custom croppers.                                                                              |
| `className`                                                              | `class` (accepts clsx-style values). `className` exists only because `class` is reserved in JSX. Every other `*ClassName` / `*ClassNames` prop keeps its name.            |
| `style` (`CSSProperties` object)                                         | `style` string, as with any Svelte component.                                                                                                                             |
| `children` (ReactNode)                                                   | `children` snippet.                                                                                                                                                       |
| `*Component` props (`stencilComponent`, `wrapperComponent`, …)           | Same names, still taking components. Snippets can't expose instance methods, and stencils and boundaries must.                                                            |
| Stencil `useImperativeHandle({ aspectRatio, boundingBox })`              | Stencil component exports (`export { value as aspectRatio }`), read via `bind:this` and merged into `stencilConstraints` options. Dev-only `$`-prefixed keys are skipped. |
| Background component `ref` (forwarded `<img>`)                           | A bindable `ref` prop (`bind:ref`). **Custom `backgroundComponent`s must declare `ref = $bindable()`.**                                                                   |
| `StretchableBoundaryMethods`, `CropperCanvasMethods`                     | Exports of those components, with types in `components/service/methods.ts`.                                                                                               |
| `CropperPreview cropper={ref}` (`RefObject`)                             | `cropper={cropper}`: the `bind:this` value itself, which is already reactive.                                                                                             |
| `useAbstractCropper(props)`                                              | Same signature: upstream already takes a getter. Called during component init. Returns `{ cropper, refs, image }`. `refs` fields are bound with `bind:this` / `bind:ref`. |
| `useCropperInstance(props)`                                              | Same signature. Returns a `CropperInstance` whose data is `$state.raw`, so `getState()` and friends are reactive.                                                         |
| `useCropperImage(options)`                                               | `useCropperImage(() => options)`. Reactive getters.                                                                                                                       |
| `useMoveImageOptions` / `useScaleImageOptions` / `useRotateImageOptions` | Pure functions with the same signature (wrap in `$derived`).                                                                                                              |
| `useUpdateEffect(effect, deps[])`                                        | `useUpdateEffect(effect, () => deps)`.                                                                                                                                    |
| `useWindowResize(cb)`                                                    | Same.                                                                                                                                                                     |
| `mergeRefs` (`service/react`)                                            | N/A: React ref plumbing with no Svelte meaning.                                                                                                                           |
| `import 'react-advanced-cropper/dist/style.css'`                         | `import 'svelte-advanced-cropper/style.css'`. Themes: `svelte-advanced-cropper/themes/<name>.css` (or `.scss`).                                                           |
| Core re-exports (`advanced-cropper`, `/defaults`, `/state`, …)           | `export * from 'advanced-cropper'`. The root already re-exports every subpath, and importing only the root avoids a duplicated core under SSR (see `01-core.md` §9).      |

## Decisions

1. **Not ported, because they are React-only:** `useForceRerender`, `usePersistentFunction`, `useStateWithCallback`, `useFirstMountState`, `createCropper`, `mergeRefs`. The `$state.raw` instance data and lazily-read prop getters replace them.
2. **Deprecated `<Cropper stencilSize autoZoom>` is dropped.** Upstream's prop splitting never routes them to the code that handles them, so they are already no-ops (`03` and `02` agree). Use `FixedCropper` and `postProcess`.
3. **Deprecated `loading`/`loaded` props on custom wrapper components are kept.** They are still live upstream.
4. **Upstream bugs fixed, without changing the API:**
   - `onReady` fires after the reset has rendered, so `getCanvas()` works inside it.
   - `isLoading()` is cleared when `src` is cleared mid-load.
   - `backgroundWrapperClassName` is applied (declared but ignored upstream).
5. **Styles** ship as a global stylesheet compiled from the core SCSS (`scripts/build-styles.ts`), not as component `<style>` blocks. Scoped styles would raise specificity and break user theme overrides.
6. **Callbacks** only fire while the cropper is mounted (`getInstance()` returns null otherwise), as upstream's ref is null outside the mounted lifetime.

## Tooling notes

- SvelteKit 3 removed `$lib`. Use `#lib` (package.json `imports`).
- oxlint's type-aware rules can't see types declared in `.svelte` module scripts. Interfaces that `.ts` code depends on live in `.ts` files.

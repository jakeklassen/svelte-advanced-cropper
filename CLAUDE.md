# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

`svelte-advanced-cropper` is a Svelte 5 port of [react-advanced-cropper](https://github.com/advanced-cropper/react-advanced-cropper), plus a SvelteKit rebuild of its docs site, deployed to GitHub Pages.

- The cropper state, algorithms and math come from the framework-agnostic [`advanced-cropper`](https://github.com/advanced-cropper/advanced-cropper) core, a runtime dependency. Do not reimplement the core; the port covers only the framework layer.
- **Public API parity with react-advanced-cropper is a hard requirement:** the same exported names, props, settings, events and ref methods.
- **The implementation must be idiomatic Svelte 5, not translated React.**
- `docs/study/00-index.md` is the React → Svelte mapping and the log of deliberate deviations: `class` instead of `className`, style strings, `bind:this` refs, `bind:ref` on backgrounds, the dropped React-only hooks, and upstream bugs that were fixed. Read it before changing the public API. `docs/study/01-05` hold the full upstream study.

## Library architecture (`src/lib`)

- `instance/CropperInstance.svelte.ts` subclasses the core `AbstractCropperInstance`. Its data is `$state.raw`, so every `cropper.getState()` / `getTransitions()` / `getInteractions()` read in a template is reactive. This one bridge replaces React's force-rerender plumbing.
- `hooks/useAbstractCropper.svelte.ts` is the engine. It creates the instance and loads the image (`useCropperImage`). It runs reset and refresh: stretch the boundary, set the image, `tick()`, `cropper.reset`, then `onReady` after render. It auto-reconciles the state when settings change (`useCropperAutoReconcile` tracks `isConsistentState`). It also builds the ref object that callbacks receive.
- `components/AbstractCropper.svelte` renders the tree: wrapper → boundary → background wrapper → background + stencil, then canvas. Every layer is replaceable through a `*Component` prop.
  - A stencil's exports (e.g. `aspectRatio`) are read via `bind:this` and merged into the `stencilConstraints` options. Dev-mode `$` keys are skipped.
  - `Cropper` and `FixedCropper` wrap it and forward the full ref API with `forwardCropperRef` (`service/ref.ts`).
- Gestures (`DraggableElement`, `TransformableImage`) use native, non-passive listeners registered in `{@attach}` functions. Svelte's `on*` attributes are delegated or passive and would break `preventDefault`/`stopPropagation`.
- Library components have no `<style>` blocks. The CSS ships globally: `scripts/build-styles.ts` compiles the core SCSS into `dist/style.css` and `dist/themes/*`, exported as `svelte-advanced-cropper/style.css` and `svelte-advanced-cropper/themes/*`.
- Import the core only from its root `advanced-cropper` (plus `advanced-cropper/extensions/*` when needed). The core has no `exports` map, and subpath imports can load it twice under SSR.
- oxlint's type-aware rules can't see types declared in `.svelte` module scripts. Interfaces that `.ts` code depends on live in `.ts` files (e.g. `components/service/methods.ts`).

## Docs site (`src/routes`, `src/site`)

- SvelteKit with `adapter-static`, fully prerendered. Pages are mdsvex `.svx` files at `src/routes/docs/**/+page.svx`, with URLs matching upstream's, including casing. `src/site/nav.ts` drives the sidebar, the prev/next links and the e2e page sweep.
- Demos live in `src/site/demos/**` and import the library by package name (`'svelte-advanced-cropper'`, a Vite alias plus a tsconfig path to `src/lib`), so the source we display is what users write. `import x from './Demo.svelte?highlight'` returns `{ code, html }`, highlighted by Shiki at build time (a plugin in `vite.config.ts`). `Example.svelte` shows the demo plus its source.
- **Before adding or editing docs content, read `docs/site-authoring.md`.** It covers the rules (original prose only, because upstream's text belongs to Norserium), mdsvex gotchas and theme scoping.
- Links in markdown are root-relative. A rehype plugin adds `BASE_PATH`. In Svelte, use `href()` / `image()` from `#site/paths.ts`.

## Commands

Tool versions are pinned in `mise.toml`. If `node` or `pnpm` on PATH don't match, prefix commands with `mise x --`.

- `pnpm dev`: docs site
- `pnpm build`: site build, then `svelte-package` → `dist/` + `build-styles` + `publint`
- `BASE_PATH=/svelte-advanced-cropper STRICT_LINKS=1 pnpm exec vite build`: the Pages build. `STRICT_LINKS` fails the build on broken internal links or anchors. CI and deploys use it.
- `pnpm check`: `svelte-check`, the only source of Svelte template, compiler and a11y diagnostics. `--config ./vite.config.ts` stops it crawling the whole tree (including `tmp/` clones) for Svelte configs
- `pnpm lint`: oxlint, type-aware via `oxlint-tsgolint` (`.oxlintrc.json`). It lints only `<script>` blocks in `.svelte` files.
- `pnpm format` / `pnpm format:check`: oxfmt (`.oxfmtrc.json`)
- `pnpm test`: unit tests once, then e2e

Vitest runs two projects (`vite.config.ts`). **client** runs `src/**/*.svelte.test.ts` in headless Chromium: library tests in `src/tests/` with `vitest-browser-svelte` and small harness components. **server** runs other `src/**/*.test.ts` in Node, including an SSR render test. `expect.requireAssertions` is on.

```sh
pnpm test:unit --run src/tests/Cropper.svelte.test.ts
pnpm test:unit --run -t "test name"
pnpm exec playwright test e2e/pages.e2e.ts
```

Playwright (`e2e/`) runs against `pnpm build && pnpm preview` on port 4173. `pages.e2e.ts` visits every nav page and fails on runtime errors or croppers that don't load.

Test gotcha: the core ignores `moveCoordinates` while a transition runs. Tests that drag right after `setCoordinates` must pass `{ transitions: false }`, or they flake.

## Conventions

- `tmp/` is git-ignored and the **only** place for scratch files. Never use the system temp dir. It also holds the upstream reference clones (`tmp/react-advanced-cropper`, `tmp/advanced-cropper`, and the old attempt in `tmp/old-svelte-advanced-cropper`). If they're missing, re-clone them with the commands in README.md.
- SvelteKit 3 removed `$lib`. Use the `#lib` / `#site/*` subpath imports (package.json `imports`). In the site, import `.ts` modules with their extension (`#site/paths.ts`).
- Runes mode is forced for all project files.
- No non-null assertions (`!`), enforced by `typescript/no-non-null-assertion`.
- Formatting: tabs, single quotes, no trailing commas, width 100. oxfmt formats `.svelte` files too (`"svelte": true`). It does not format `.svx` pages, so keep code samples in them in the same style by hand.
- Readability lint rules (`pnpm lint:fix` applies them): every `if`/`for`/`while` body is a braced block (`curly: all`, no one-line `if (x) return;`), and `@stylistic/padding-line-between-statements` requires a blank line before every `return` that follows another statement and after every block (`if {}`, loops, function declarations). The stylistic rules load through oxlint's `jsPlugins`.
- Also enforced: no `else` after `return` and no lonely `if` (use guard clauses), no nested ternaries, `for…of` instead of `.forEach`, a blank line after imports, and a few shorthand rules (`object-shorthand`, `prefer-template`, `arrow-body-style`). For cleanup-only effects, use `onDestroy` rather than `$effect(() => () => …)`.
- CI: `.github/workflows/ci.yml` (format, lint, check, unit, strict build, e2e) and `pages.yml` (deploys `build/` to GitHub Pages with `BASE_PATH=/<repo>`).

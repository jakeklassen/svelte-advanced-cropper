# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

`svelte-advanced-cropper` is a Svelte 5 image-cropping library built on the framework-independent `advanced-cropper` core. Its SvelteKit documentation site teaches the Svelte API and is prerendered for GitHub Pages.

- Require Svelte `^5.40`. Use runes, snippets, context via `createContext`, attachments and `$derived` reads. Public composition uses child stencils, typed layer snippets and `bind:this` for instance methods.
- Keep `advanced-cropper` as a runtime dependency and preserve its cropping capabilities. Do not reimplement its algorithms or impose another framework's API names.
- Read `docs/study/00-index.md` for current design decisions, historical studies and regressions that must remain fixed.

## Library architecture (`src/lib`)

- `types.ts` declares the structural `CropperInstance<E>`, settings and snippet contracts; `index.ts` is the public surface and re-exports the core. Built-in settings are flat props; `settings` contains extension keys only.
- `controllers/CropperController.svelte.ts` owns the stable API, image loading, reset/refresh and registrations. `ReactiveCropperEngine.svelte.ts` in the same directory subclasses the core with `$state.raw` data. `ImageLoader.svelte.ts`, `StencilRegistry.svelte.ts`, `RegistrationSlot.svelte.ts` and `observeReconciliation.svelte.ts` stay internal. The controller uses scalar-derived effects for image/loading notifications; the view and preview own resize/orientation listeners through `<svelte:window>`. Reconciliation enablement reads the current `autoReconcileState` prop.
- `components/croppers/` contains `Cropper` and `FixedCropper`. Each controller provides isolated context through `context/cropper.ts`; `components/stencils/` register reactive option getters synchronously before the first reset. No children means a default rectangle; supplied children may contain zero or one stencil.
- `components/internal/CropperView.svelte` renders wrapper → boundary → background wrapper → background + children, with an internal export canvas. Typed snippets replace layers; boundaries use `registerBoundary`, export backgrounds attach the actual drawable with `attachSource`. Preview composition lives in `components/preview/`; visual building blocks live in `components/layers/`, `components/primitives/`, `components/handlers/` and `components/lines/`.
- Getters remain reactive; mutations and notification callbacks run untracked. SSR performs no browser work. Preserve cancellation, token-owned cleanup and rendered readiness across image, boundary, stencil and source replacement.
- Gestures in `components/gestures/` (`DraggableArea`, `TransformableImage`) use native, non-passive listeners registered in `{@attach}` functions. Svelte's delegated/passive `on*` attributes cannot replace these listeners without changing `preventDefault`/`stopPropagation` behaviour.
- Library components have no `<style>` blocks. The CSS ships globally: `scripts/build-styles.ts` compiles the core SCSS into `dist/style.css` and `dist/themes/*`, exported as `svelte-advanced-cropper/style.css` and `svelte-advanced-cropper/themes/*`.
- In `src/lib`, import the core only from its root `advanced-cropper` (plus `advanced-cropper/extensions/*` when needed). The core has no `exports` map, and other subpath imports can load it twice under SSR. Site demo exceptions are recorded in `docs/site-authoring.md`.
- oxlint's type-aware rules can't see types declared in `.svelte` module scripts. Interfaces that `.ts` code depends on live in `.ts` files (e.g. `types.ts`, `components/internal/methods.ts`).

## Docs site (`src/routes`, `src/site`)

- SvelteKit with `adapter-static`, fully prerendered. Pages are mdsvex `.svx` files at `src/routes/docs/**/+page.svx`, with lowercase kebab-case URLs. `src/site/nav.ts` drives the sidebar, prev/next links and canonical e2e page sweep. There are no legacy redirects.
- Demos live in `src/site/demos/**` and import the library by package name (`'svelte-advanced-cropper'`, a Vite alias plus a tsconfig path to `src/lib`), so the source we display is what users write. `import x from './Demo.svelte?highlight'` returns `{ code, highlighted }`, highlighted by Shiki at build time (a plugin in `vite.config.ts`). `Example.svelte` shows the demo plus its source.
- **Before adding or editing docs content, read `docs/site-authoring.md`.** It covers the rules (original prose only, because upstream's text belongs to Norserium), mdsvex gotchas and theme scoping.
- Light/dark: dark by default with a navbar toggle. Page surfaces use the colour tokens in `src/site/styles/site.css`; see "Light and dark themes" in `docs/site-authoring.md`.
- Links in markdown are root-relative. A rehype plugin adds `BASE_PATH`. In Svelte, use `href()` / `image()` from `#site/paths.ts`.

## Commands

Tool versions are pinned in `mise.toml`. Run the commands below through `mise x --` (for example, `mise x -- pnpm check`).

- `pnpm dev`: docs site
- `pnpm build`: site build, then `svelte-package` → `dist/` + `build-styles` + `publint`
- `BASE_PATH=/svelte-advanced-cropper STRICT_LINKS=1 pnpm exec vite build`: the Pages build. `STRICT_LINKS` fails the build on broken internal links or anchors. CI and deploys use it.
- `pnpm check`: `svelte-check`, the only source of Svelte template, compiler and a11y diagnostics. `--config ./vite.config.ts` stops it crawling the whole tree (including `tmp/` clones) for Svelte configs
- `pnpm lint:svelte`: official Svelte autofixer over every Svelte file in src; issues and suggestions without an exact reviewed entry and reason in `scripts/svelte-autofix-allow.json` fail. SCSS is preprocessed before analysis.
- `pnpm lint`: oxlint, type-aware via `oxlint-tsgolint` (`.oxlintrc.json`). It lints only `<script>` blocks in `.svelte` files.
- `pnpm format` / `pnpm format:check`: oxfmt (`.oxfmtrc.json`)
- `pnpm test`: unit tests once, then e2e

Vitest runs three projects (`vite.config.ts`). They use only the Svelte plugin (`extends: false`), not SvelteKit, so the test server is plain Vite: faster to start, and a missing file is an instant 404. **client** runs `src/**/*.svelte.test.ts` in headless Chromium: library tests in `src/tests/` with `vitest-browser-svelte` and small harness components. **server** runs other `src/**/*.test.ts` in Node, including an SSR render test. **leak** runs `src/**/*.leak.test.ts` in Chromium after the other two have finished (`sequence.groupOrder`): it mounts and unmounts a cropper hundreds of times and checks heap, DOM node and listener counts through Chrome's DevTools protocol (`cdp()` from `vitest/browser`), which are browser-wide and would be skewed by tests running alongside. `expect.requireAssertions` is on.

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
- Agents must load both skills in `.agents/skills/` (`svelte-code-writer` and `svelte-core-bestpractices`) and run the autofixer on Svelte files they touch.
- Runes mode is forced for all project files.
- Strong types: no `any`, no unchecked casts where a real type works, and no non-null assertions (`!`, enforced by `typescript/no-non-null-assertion`).
- Formatting: tabs, single quotes, no trailing commas, width 100. oxfmt formats `.svelte` files too (`"svelte": true`). It does not format `.svx` pages, so keep code samples in them in the same style by hand.
- Readability lint rules (`pnpm lint:fix` applies them): every `if`/`for`/`while` body is a braced block (`curly: all`, no one-line `if (x) return;`), and `@stylistic/padding-line-between-statements` requires a blank line before every `return` that follows another statement and after every block (`if {}`, loops, function declarations). The stylistic rules load through oxlint's `jsPlugins`.
- Also enforced: no `else` after `return` and no lonely `if` (use guard clauses), no nested ternaries, `for…of` instead of `.forEach`, a blank line after imports, and a few shorthand rules (`object-shorthand`, `prefer-template`, `arrow-body-style`). For cleanup-only effects, use `onDestroy` rather than `$effect(() => () => …)`.
- CI: `.github/workflows/ci.yml` (format, lint, check, unit, strict build, e2e) runs on pull requests. `release.yml` runs on pushes to `main`: it calls `ci.yml`, then the Changesets release job. It is the workflow npm's trusted publisher is configured for. `pages.yml` deploys `build/` to GitHub Pages with `BASE_PATH=/<repo>`.
- Releases: user-facing changes need a changeset (`pnpm changeset`). npm publishing happens only in CI through trusted publishing; never publish from a local machine. See README "Releasing".

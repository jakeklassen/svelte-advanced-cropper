# AGENTS.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project intent

This repo is a Svelte 5 port of [react-advanced-cropper](https://github.com/advanced-cropper/react-advanced-cropper). The port is broken into 6 milestone GitHub issues (#1–#6). #1 carries the locked-in architectural decisions:

- **Context, not prop drilling** — internal `cropper` instance shared via Svelte `setContext` / `getContext`.
- **Polymorphic slots support both shapes** — snippets are preferred; component-as-prop kept for React-API parity.
- **SCSS ships two ways** — pre-built CSS at `dist/style.css` (default) and raw `.scss` paths (M6).
- **No `classnames` dep** — use Svelte 5 native `class={[...]}` / `class={{...}}` everywhere. The `class` prop on every component is typed as `ClassValue` from `svelte/elements`.
- **Engine (`advanced-cropper`) is consumed as a runtime npm dep, never re-ported.**
- **No `forwardRef` / `useImperativeHandle` recreation** — components export imperative methods directly; consumers use `bind:this`.

Components live under `src/components/{handlers,lines,service,...}/` mirroring the React layout. Everything ported must be re-exported from `src/index.ts` to reach the published `.` export.

The upstream React port and core engine are cloned to `tmp/{react-advanced-cropper,advanced-cropper}/` for reference. `tmp/` is gitignored.

## Commands

- `pnpm play` — Vite dev server for the `playground/` app. **Note:** `vite.config.ts` sets `root: './playground'`, so Vite is launched from the repo root but serves the playground.
- `pnpm storybook` — Storybook 10 dev server (Svelte CSF v5) on port 6006. Stories live in **top-level `stories/`**, not `src/`, to avoid polluting the published `dist/`. Config in `.storybook/main.ts`.
- `pnpm build-storybook` — Static Storybook build.
- `pnpm test` — Vitest in **browser mode** (Playwright + Chromium, headless). Tests import from `vitest-browser-svelte` and run real DOM interactions; they will fail outside the browser environment. The Storybook init also added a `storybook` Vitest project (`@storybook/addon-vitest`); both projects run by default. `passWithNoTests: true` is set so the command succeeds while a milestone has no unit tests yet.
  - Single test file: `pnpm test tests/<file>.test.ts`
  - Single test by name: `pnpm test -t 'pattern'`
  - Only Storybook stories: `pnpm vitest --project=storybook`
  - `tmp/**` is excluded so the upstream React/engine clones don't get walked.
- `pnpm build` — Two-step: `tsdown` bundles JS + the custom DTS plugin emits Svelte `.d.ts`; then `scripts/build-styles.mjs` compiles the engine SCSS to `dist/style.css` + `dist/themes/*.css`. Output goes to `dist/`.
- `pnpm build:styles` — Just the SCSS step (faster when only the CSS changed).
- `pnpm dev` — `tsdown --watch` (library rebuild loop; use alongside a consumer, not the playground).
- `pnpm typecheck` — `svelte-check` against `tsconfig.json` (which only includes `src/`).

## Architecture

### Two build/runtime configs, two roots

There are intentionally two Svelte/Vite pipelines that don't overlap:

1. **Library build** — `tsdown.config.ts` uses `rollup-plugin-svelte` + `svelte-preprocess` to compile components, then runs the local `svelteDtsPlugin` in `closeBundle` to generate `.d.ts` files.
2. **Playground + tests** — `vite.config.ts` uses `@sveltejs/vite-plugin-svelte`. Its `root` is `./playground`, but `test.root` is reset to `.` so Vitest discovers `tests/` at the repo root.

If you add a new Svelte component, both pipelines need to handle it; usually that means just placing it under `src/` and exporting from `src/index.ts`.

### Custom DTS plugin (`scripts/tsdown-plugin-svelte-dts.js`)

`tsdown`'s built-in `dts: true` does not understand `.svelte` files. The custom plugin calls `svelte2tsx`'s `emitDts` in `closeBundle` to write Svelte component type declarations into `dist/`. If `.d.ts` generation for a component breaks, look here before suspecting `tsdown` itself. The plugin reads `libRoot: ./src`, `tsconfig.json`, and `node_modules/svelte2tsx/svelte-shims-v4.d.ts`.

### CSS pipeline

Two independent CSS sources end up in `dist/`:

1. **Engine SCSS → `dist/style.css` + `dist/themes/*.css`**, compiled by `scripts/build-styles.mjs` (runs `sass`, silences upstream `@import` and `global-builtin` deprecations). All cropper visual styling lives here — component files **do not** ship their own `<style>` blocks.
2. **`@tsdown/css`** is installed and handles any CSS that tsdown's pipeline picks up (e.g. if a Svelte component ever does declare a `<style>` block). It is required by tsdown 0.22 even just to silence the "CSS file encountered but `@tsdown/css` is not installed" build error.

### Svelte 5 idioms (used in the port)

- Components are runes-first: typed `interface Props`, `let { ... }: Props = $props()`, `$state`, `$derived`, `$effect`.
- The `class` prop is typed as `ClassValue` from `svelte/elements` everywhere it crosses a component boundary. Use `class={[...]}` arrays in JSX-like positions; Svelte 5 flattens and normalizes them (clsx-style).
- Callback props (`onMove`, `onDrag`, etc.) replace React event handlers. No `createEventDispatcher`.
- For stencil/handler-shaped polymorphic slots (M4+), both snippets and component-as-prop are supported per decision #1 — snippet wins if provided.

### Package surface

`package.json#exports` exposes `.` (→ `dist/index.js`), `./package.json`, `./style.css` (→ `dist/style.css`), and `./themes/*.css` (→ `dist/themes/*.css`). Anything not re-exported from `src/index.ts` won't reach consumers.

### Workspace note

`pnpm-workspace.yaml` is the **allowlist** for pnpm install scripts (`allowBuilds:`), not a multi-package workspace. New dependencies that need install scripts (e.g. `esbuild`, `playwright`) must be listed with `: true`, or `pnpm install` fails with `ERR_PNPM_IGNORED_BUILDS`. There are no sub-packages.

# AGENTS.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project intent

This repo is a Svelte 5 port of [react-advanced-cropper](https://github.com/advanced-cropper/react-advanced-cropper). The current `src/` only contains a `MyButton` scaffold from `create-tsdown` — treat that as a placeholder, not as the intended public API. Real components belong under `src/` and must be re-exported from `src/index.ts` to become part of the package's `.` export.

## Commands

- `pnpm play` — Vite dev server for the `playground/` app. **Note:** `vite.config.ts` sets `root: './playground'`, so Vite is launched from the repo root but serves the playground.
- `pnpm storybook` — Storybook 10 dev server (Svelte CSF v5) on port 6006. Stories live in **top-level `stories/`**, not `src/`, to avoid polluting the published `dist/`. Config in `.storybook/main.ts`.
- `pnpm build-storybook` — Static Storybook build.
- `pnpm test` — Vitest in **browser mode** (Playwright + Chromium, headless). Tests import from `vitest-browser-svelte` and run real DOM interactions; they will fail outside the browser environment. The Storybook init also added a `storybook` Vitest project (`@storybook/addon-vitest`); both projects run by default.
  - Single test file: `pnpm test tests/MyButton.test.ts`
  - Single test by name: `pnpm test -t 'button increments count on click'`
  - Only Storybook stories: `pnpm vitest --project=storybook`
- `pnpm build` — Bundles via `tsdown` and emits Svelte `.d.ts` files via the custom plugin (see below). Output goes to `dist/`.
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

### Svelte 5 runes

Components use Svelte 5 syntax (`$state`, `$props`, callback props instead of `createEventDispatcher`). See `src/MyButton.svelte` for the established style: a typed `Props` interface and callback props (`onclick?: (count: number) => void`).

### Package surface

`package.json` exports only `.` (→ `dist/index.js`), `./package.json`, and `./style.css` (→ `dist/style.css`). Anything not re-exported from `src/index.ts` won't reach consumers, regardless of whether it's compiled into `dist/`.

### Workspace note

`pnpm-workspace.yaml` is the **allowlist** for pnpm install scripts (`allowBuilds:`), not a multi-package workspace. New dependencies that need install scripts (e.g. `esbuild`, `playwright`) must be listed with `: true`, or `pnpm install` fails with `ERR_PNPM_IGNORED_BUILDS`. There are no sub-packages.

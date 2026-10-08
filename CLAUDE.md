# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

`svelte-advanced-cropper` is a Svelte 5 port of [react-advanced-cropper](https://github.com/advanced-cropper/react-advanced-cropper), plus a SvelteKit rebuild of its docs site (https://advanced-cropper.github.io/react-advanced-cropper/).

- The cropper state, algorithms and math come from the framework-agnostic [`advanced-cropper`](https://github.com/advanced-cropper/advanced-cropper) core, which is a runtime dependency. Do not reimplement the core; port only the React layer (components, hooks, instance wiring).
- **Public API parity with react-advanced-cropper is a hard requirement:** the same exported names, props, settings, events, and instance methods.
- **Implementation must be idiomatic Svelte 5, not translated React.** Hooks become runes, classes with `$state`, or attachments. Render props and component props become snippets or component props. `forwardRef` and `useImperativeHandle` become exported instance functions or bindable props. React-only workarounds (`useForceRerender`, `usePersistentFunction`, `useStateWithCallback`, `useFirstMountState`, `useUpdateEffect`) are not ported as-is.
- The upstream study and the React → Svelte mapping live in `docs/study/`. Read it before porting a module.

## Upstream reference clones

`tmp/` is git-ignored scratch space and the **only** place for throwaway files. Never use the system temp dir or the session scratchpad. Upstream sources for reference:

- `tmp/react-advanced-cropper/src`: the React layer being ported
- `tmp/react-advanced-cropper/example`: the Docusaurus docs site (MDX in `docs/`, demos in `src/components`)
- `tmp/advanced-cropper/src`: the core (also installed as `node_modules/advanced-cropper`)

If `tmp/` is missing, re-clone using the commands in README.md.

## Commands

Tool versions are pinned in `mise.toml`. If node or pnpm on PATH don't match, prefix commands with `mise x --`.

- `pnpm dev`: docs site
- `pnpm build`: site build, then `svelte-package` → `dist/`, then `publint`
- `pnpm check`: `svelte-check`, the only source of Svelte template, compiler and a11y diagnostics
- `pnpm lint`: oxlint, type-aware through `oxlint-tsgolint`, configured in `.oxlintrc.json`. It lints only `<script>` blocks in `.svelte` files.
- `pnpm format` / `pnpm format:check`: oxfmt, configured in `.oxfmtrc.json`
- `pnpm test`: unit tests once, then e2e

Vitest runs as two projects (`vite.config.ts`): **client** (`src/**/*.svelte.{test,spec}.ts`, headless Chromium through `@vitest/browser-playwright`, render with `vitest-browser-svelte`) and **server** (other `src/**/*.{test,spec}.ts`, Node). `expect.requireAssertions` is on. `passWithNoTests` is a temporary setting until `src/lib` has tests.

```sh
pnpm test:unit --run src/lib/foo.spec.ts
pnpm test:unit --run --project client
pnpm test:unit --run -t "test name"
pnpm exec playwright test e2e/home.e2e.ts
```

Playwright tests live in `e2e/` (`*.e2e.ts`) and run against `pnpm build && pnpm preview` on port 4173.

## Layout and conventions

- `src/lib/` is the published package. Everything public is re-exported from `src/lib/index.ts`, which mirrors upstream `src/index.ts`, including the `advanced-cropper` core re-exports.
- `src/routes/` is the docs site and is not published. There is no Tailwind. Styles are plain CSS in scoped `<style>` blocks, as with the upstream per-component SCSS.
- Runes mode is forced for all project files (`vite.config.ts`).
- `package.json` subpath imports: `#lib` and `#lib/*` map to `src/lib`.
- No non-null assertions (`!`). This is enforced by `typescript/no-non-null-assertion`.
- Formatting: tabs, single quotes, no trailing commas, width 100.

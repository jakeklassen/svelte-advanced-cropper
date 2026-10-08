# svelte-advanced-cropper

A Svelte 5 port of [react-advanced-cropper](https://github.com/advanced-cropper/react-advanced-cropper), the library for building image croppers that fit your own design: custom stencils, handlers and wrappers, fixed or free aspect ratios, zoom, rotate, flip, and transitions.

Like the React version, it is built on [`advanced-cropper`](https://github.com/advanced-cropper/advanced-cropper), the framework-agnostic core that holds the cropper state, algorithms and math. This package provides the Svelte layer on top of it.

> **Status: early development.** No Svelte components have been ported yet. The package currently re-exports the `advanced-cropper` core API (state, algorithms, defaults, image/canvas helpers), which matches what `react-advanced-cropper` re-exports.

## Goals

- **One-to-one API parity** with `react-advanced-cropper`: the same components, props, settings, events, and cropper instance methods, so its documentation and recipes carry over.
- **Idiomatic Svelte 5, not translated React.** Runes, snippets and attachments replace hooks, render props and `forwardRef`. When React behavior exists only to work around React (forced re-renders, persistent-function hooks, state-with-callback), we use the Svelte equivalent instead of reproducing it.
- **A Svelte documentation site** in `src/routes`, rebuilding the [react-advanced-cropper docs](https://advanced-cropper.github.io/react-advanced-cropper/) and their interactive examples.

## Development

Tool versions are pinned in `mise.toml` (Node 26, pnpm 12).

```sh
mise install
pnpm install
pnpm dev                 # docs/showcase site
```

| Command                             | What it does                                                               |
| ----------------------------------- | -------------------------------------------------------------------------- |
| `pnpm build`                        | Build the site, then package `src/lib` into `dist/` and run `publint`      |
| `pnpm check`                        | Type-check with `svelte-check`                                             |
| `pnpm lint` / `pnpm lint:fix`       | [oxlint](https://oxc.rs/docs/guide/usage/linter), type-aware               |
| `pnpm format` / `pnpm format:check` | [oxfmt](https://oxc.rs/docs/guide/usage/formatter)                         |
| `pnpm test:unit`                    | Vitest: `*.svelte.spec.ts` in headless Chromium, other `*.spec.ts` in Node |
| `pnpm test:e2e`                     | Playwright against a production build (`e2e/`)                             |
| `pnpm test`                         | Unit tests once, then e2e                                                  |
| `pnpm test:e2e:install`             | Install the Chromium build that Playwright and Vitest browser mode use     |

oxlint checks the `<script>` blocks of `.svelte` files. Svelte compiler and template diagnostics, including a11y, come from `pnpm check`.

### Layout

- `src/lib/`: the published package (`svelte-package` → `dist/`). Everything public is re-exported from `src/lib/index.ts`.
- `src/routes/`: the documentation site. Not published.
- `e2e/`: Playwright tests.
- `tmp/`: git-ignored scratch space. The upstream `react-advanced-cropper` and `advanced-cropper` repos are cloned here for reference:

  ```sh
  git clone --depth 1 https://github.com/advanced-cropper/react-advanced-cropper.git tmp/react-advanced-cropper
  git clone --depth 1 https://github.com/advanced-cropper/advanced-cropper.git tmp/advanced-cropper
  ```

## License

MIT for the source code. See [LICENSE](LICENSE). This project is derived from Norserium's MIT-licensed `react-advanced-cropper`. Upstream marks its **documentation content** as belonging to Norserium rather than MIT, and its example photos as belonging to their owners. Content ported from the upstream docs site is subject to those terms.

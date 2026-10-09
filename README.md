# svelte-advanced-cropper

A Svelte 5 image cropper built on [`advanced-cropper`](https://github.com/advanced-cropper/advanced-cropper). Configure stencils as children, customize layers with snippets and read cropper state reactively. Supports fixed and movable stencils, touch gestures, rotation, zoom, previews and canvas export.

This independent project includes code derived from Norserium's MIT-licensed [`react-advanced-cropper`](https://github.com/advanced-cropper/react-advanced-cropper) and is not affiliated with the Advanced Cropper project.

**Documentation and live examples:** https://jakeklassen.github.io/svelte-advanced-cropper/

## Install

```sh
npm install svelte-advanced-cropper
# or
pnpm add svelte-advanced-cropper
yarn add svelte-advanced-cropper
bun add svelte-advanced-cropper
aube add svelte-advanced-cropper
```

Requires Svelte `^5.40`.

## Usage

`/photo.jpg` is an image in your application's public directory. Import the stylesheet once and give the cropper a definite height.

```svelte
<script lang="ts">
	import { Cropper, RectangleStencil, type CropperInstance } from 'svelte-advanced-cropper';
	import 'svelte-advanced-cropper/style.css';

	let cropper: CropperInstance | undefined = $state();
	const coordinates = $derived(cropper?.getCoordinates());
</script>

<Cropper bind:this={cropper} src="/photo.jpg" style="height: 360px">
	<RectangleStencil aspectRatio={16 / 9} />
</Cropper>

{#if coordinates}
	<p>{coordinates.width} × {coordinates.height} pixels</p>
{/if}

<button type="button" disabled={!coordinates} onclick={() => cropper?.rotateImage(90)}>
	Rotate
</button>
```

- **Croppers:** `Cropper` for a movable selection and `FixedCropper` for a fixed stencil with a moving image.
- **Stencils:** child `RectangleStencil`, `CircleStencil` or custom context-based stencils. With no children, `Cropper` supplies a rectangle.
- **Composition:** typed layer snippets for wrappers, boundaries, backgrounds and controls; one `class` prop and stable styling selectors.
- **Preview:** `<CropperPreview {cropper} />` updates reactively as the crop changes. Export a canvas explicitly with `cropper?.getCanvas()`.
- **Themes:** `svelte-advanced-cropper/style.css` and `svelte-advanced-cropper/themes/{default,classic,compact,bubble,corners}.css`, plus SCSS theme sources.

### Upgrading to 0.2.0

**0.2.0 is a breaking release.** Child stencils, typed snippets and structural instance types replace the 0.1.x composition API; public `use*` helpers and per-part class props are removed. Requires Svelte `^5.40`. See [Upgrade from 0.1.x](https://jakeklassen.github.io/svelte-advanced-cropper/docs/migration/from-0-1) or [Coming from react-advanced-cropper](https://jakeklassen.github.io/svelte-advanced-cropper/docs/migration/from-react) for before/after examples and the complete migration mapping.

## Development

Tool versions are pinned in `mise.toml` (Node 26, pnpm 12). Run the pnpm commands below through `mise x --` when working on the repository.

```sh
mise install
pnpm install
pnpm dev                 # docs site at http://localhost:5173
```

| Command                             | What it does                                                                             |
| ----------------------------------- | ---------------------------------------------------------------------------------------- |
| `pnpm build`                        | Build the docs site, then package `src/lib` into `dist/` (with styles) and run `publint` |
| `pnpm check`                        | Type-check with `svelte-check`                                                           |
| `pnpm lint` / `pnpm lint:fix`       | [oxlint](https://oxc.rs/docs/guide/usage/linter), type-aware                             |
| `pnpm format` / `pnpm format:check` | [oxfmt](https://oxc.rs/docs/guide/usage/formatter)                                       |
| `pnpm test:unit`                    | Vitest: `*.svelte.test.ts` in headless Chromium, other `*.test.ts` in Node               |
| `pnpm test:e2e`                     | Playwright against a production build (`e2e/`)                                           |
| `pnpm test`                         | Unit tests once, then e2e                                                                |
| `pnpm test:e2e:install`             | Install the Chromium build that Playwright and Vitest browser mode use                   |

oxlint checks the `<script>` blocks of `.svelte` files. Svelte compiler and template diagnostics, including a11y, come from `pnpm check`.

### Layout

- `src/lib/`: the published package. Everything public is re-exported from `src/lib/index.ts`.
- `src/routes/`, `src/site/`: the docs site (SvelteKit, mdsvex, prerendered for GitHub Pages). Not published. Demos live in `src/site/demos/`. See `docs/site-authoring.md`.
- `src/tests/`: library tests. `e2e/`: Playwright tests.
- `docs/study/`: design log and historical implementation studies; start with `00-index.md`.
- `tmp/`: git-ignored scratch space. The upstream repos are cloned here for reference:

  ```sh
  git clone --depth 1 https://github.com/advanced-cropper/react-advanced-cropper.git tmp/react-advanced-cropper
  git clone --depth 1 https://github.com/advanced-cropper/advanced-cropper.git tmp/advanced-cropper
  ```

### Deploying the docs

`.github/workflows/pages.yml` builds the site with `BASE_PATH=/<repo>` and deploys it to GitHub Pages on every push to `main`. Enable Pages with source "GitHub Actions" in the repository settings.

### Releasing

Releases use [Changesets](https://github.com/changesets/changesets) and publish to npm from CI.

1. With every change users will notice, run `pnpm changeset`, pick the bump (patch, minor or major), write the changelog line, and commit the generated `.changeset/*.md` file.
2. On every push to `main`, `.github/workflows/release.yml` runs the CI checks (it calls `ci.yml`) and then the release job. It keeps a "Version Packages" pull request open that bumps `package.json` and writes `CHANGELOG.md`.
3. Merging that pull request publishes the new version to npm and creates the git tag and GitHub release.

Publishing uses [npm trusted publishing](https://docs.npmjs.com/trusted-publishers): CI proves its identity to npm with a short-lived OIDC token, so no npm token is stored in the repository, and each release gets a provenance attestation. The trusted publisher is configured on npmjs.com for this repository and the `release.yml` workflow, so no other workflow can publish.

Pull requests opened by CI don't trigger CI themselves (a GitHub rule for `GITHUB_TOKEN`), so the "Version Packages" pull request shows no checks. Its changes are only the version bump and changelog, and the release job runs the full checks again after the merge.

## License

MIT for the source code. See [LICENSE](LICENSE). This project is derived from Norserium's MIT-licensed `react-advanced-cropper`. The docs site's text is original to this project. Upstream's documentation content belongs to Norserium and was not copied. Demo photos are from Unsplash (`static/img/images/CREDITS.md`).

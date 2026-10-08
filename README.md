# svelte-advanced-cropper

A Svelte 5 image cropper you can shape to your design: custom stencils, handlers and wrappers, fixed or free aspect ratios, zoom, rotate, flip, transitions, and full touch support.

It is a port of [react-advanced-cropper](https://github.com/advanced-cropper/react-advanced-cropper) built on the same framework-agnostic core, [`advanced-cropper`](https://github.com/advanced-cropper/advanced-cropper). The components, props, settings and methods match the React library one-to-one. The implementation is idiomatic Svelte 5: runes, snippets and attachments, not translated hooks.

**Documentation and live examples:** https://jakeklassen.github.io/svelte-advanced-cropper/

## Install

```sh
npm install svelte-advanced-cropper
```

Requires Svelte 5.

## Usage

```svelte
<script lang="ts">
	import { Cropper, type CropperRef } from 'svelte-advanced-cropper';
	import 'svelte-advanced-cropper/style.css';

	let cropper: CropperRef | undefined = $state();

	function onChange(cropper: CropperRef) {
		console.log(cropper.getCoordinates(), cropper.getCanvas());
	}
</script>

<Cropper
	bind:this={cropper}
	src="/photo.jpg"
	stencilProps={{ aspectRatio: 16 / 9 }}
	{onChange}
	style="height: 500px"
/>

<button onclick={() => cropper?.rotateImage(90)}>Rotate</button>
```

- **Croppers:** `Cropper` (free stencil) and `FixedCropper` (fixed stencil, moving image), plus `AbstractCropper` to build your own.
- **Stencils:** `RectangleStencil` (default) and `CircleStencil`, or pass any component as `stencilComponent`.
- **Themes:** `svelte-advanced-cropper/themes/{default,classic,compact,bubble,corners}.css`, or the `.scss` sources to customise the variables.
- **Preview:** `<CropperPreview cropper={cropper} />` mirrors a cropper's result live.

### Coming from react-advanced-cropper

Most code carries over directly. The differences come from Svelte itself:

| React                                    | Svelte                              |
| ---------------------------------------- | ----------------------------------- |
| `ref={cropperRef}`                       | `bind:this={cropper}`               |
| `className`                              | `class`                             |
| `style={{ height: 500 }}`                | `style="height: 500px"`             |
| `children`                               | `children` snippet                  |
| `<CropperPreview cropper={cropperRef}/>` | `<CropperPreview {cropper} />`      |
| `useCropperImage({ src })`               | `useCropperImage(() => ({ src }))`  |
| `react-advanced-cropper/dist/style.css`  | `svelte-advanced-cropper/style.css` |

The [migration guide](https://jakeklassen.github.io/svelte-advanced-cropper/docs/guides/coming-from-react) covers the full list.

## Development

Tool versions are pinned in `mise.toml` (Node 26, pnpm 12).

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
- `docs/study/`: the upstream study and the React → Svelte mapping (`00-index.md`).
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

MIT for the source code. See [LICENSE](LICENSE). This project is derived from Norserium's MIT-licensed `react-advanced-cropper`. The docs site's text is original to this project. Upstream's documentation content belongs to Norserium and was not copied. Demo photos are from Unsplash and Pexels (`static/img/images/CREDITS.md`).

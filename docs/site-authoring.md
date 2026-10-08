# Docs site authoring guide

The docs site in `src/routes/docs/**` rebuilds https://advanced-cropper.github.io/react-advanced-cropper/ for `svelte-advanced-cropper`: the same pages, sections and interactive demos, written for Svelte. The upstream source is in `tmp/react-advanced-cropper/example` (MDX in `docs/`, demos in `src/components/`). `docs/study/04-docs-site.md` has the full inventory, and `docs/study/00-index.md` the React → Svelte API mapping. Read both first.

## Hard rules

1. **Write your own prose.** Upstream documentation text belongs to Norserium and is not MIT. Cover the same topics, sections, options and caveats with the same accuracy, but in your own words, written for Svelte users. Do not copy sentences. Headings, API names and facts are fine. Demo **code** is MIT: port its logic freely.
2. **Port demos idiomatically**, not as React translations:
   - `useState` → `$state`, `useMemo` → `$derived`, `useEffect` → `$effect` (only when needed), `useRef` to a cropper → `bind:this`.
   - `className` → `class`, style objects → style strings.
   - Callbacks are props (`onChange={...}`), DOM events use `onclick`.
   - `classnames` → Svelte's `class={[...]}` arrays and objects.
   - Third-party helpers (`use-debounce`, `file-saver`, `react-indiana-drag-scroll`) → a few lines of plain code.
3. **Demos import the library by package name**: `import { Cropper } from 'svelte-advanced-cropper'` (aliased to `src/lib`). The source we display is then exactly what users would write. Never import `#lib` in a demo.
4. **Images**: only use the photos in `static/img/images/` through `import { image } from '#site/paths.ts'` and `image('photo-….jpg')`. Use the same photo the upstream demo uses. Never hotlink, and never copy upstream SVG illustrations, diagrams or logos. Recreate diagrams as simple HTML/CSS or inline SVG of your own.
5. **Icons**: `@lucide/svelte`, e.g. `import { RotateCw } from '@lucide/svelte'`. Do not port upstream's icon components.
6. **Only create or edit files you were assigned.** Shared infrastructure (`src/site/components/*`, `src/site/nav.ts`, `src/site/styles/site.css`, `vite.config.ts`, `src/lib/**`) is read-only for you. If you find a library bug, report it rather than fixing it. If you need a helper component, put it in your own demo folder.
7. **Scratch files** go only in `tmp/` in this project. Never use the system `/tmp` or `~`.
8. **Don't run `pnpm build`, `vite build`, `pnpm test` or `git commit`.** Other agents are working in the same tree. Verify with `mise x -- pnpm check` (must report 0 errors and 0 warnings in your files) and `mise x -- pnpm lint`.

## Files

- Page: `src/routes/docs/<section>/<Name>/+page.svx`. The URL matches upstream's, including casing (e.g. `/docs/components/Cropper`). The routes are listed in `src/site/nav.ts`.
- Demo: `src/site/demos/<group>/<Name>.svelte`. Groups: `examples`, `showcase`, `tutorials`, `croppers`, `schemes`, `algorithms`, `home`. Small helpers live next to the demo.
- Shared demo primitives you may use: `#site/demos/shared/SquareButton.svelte` and `VerticalButtons.svelte`. Plus the global `.demo-buttons` / `.demo-button` classes from `site.css`.

## Page anatomy (`.svx` = markdown + Svelte, via mdsvex)

```svelte
<script>
	import Example from '#site/components/Example.svelte';
	import Admonition from '#site/components/Admonition.svelte';
	import Tabs from '#site/components/Tabs.svelte';
	import TabItem from '#site/components/TabItem.svelte';
	import CodeBlock from '#site/components/CodeBlock.svelte';
	import StencilGridExample from '#site/demos/examples/StencilGridExample.svelte';
	import stencilGridSource from '#site/demos/examples/StencilGridExample.svelte?highlight';
</script>

# Page title Markdown prose. Links are root-relative: [Recipes](/docs/guides/recipes). The base path
is added at build time.

<Example source={stencilGridSource} title="StencilGridExample">
	<StencilGridExample />
</Example>

<Admonition type="tip" title="Optional title">
	Markdown inside a component needs blank lines around it.
</Admonition>
```

- `Example`: renders the live demo plus a "Show code" toggle with the demo's real, highlighted source. Pass extra files with `files={{ 'Helper.svelte': helperSource }}` (each imported with `?highlight`).
- `CodeBlock html={x.html} code={x.code}`: shows a `?highlight` import without a demo.
- Plain fenced code blocks (`svelte`, `ts`, `css`, `shell`, …) are highlighted at build time. Use them for snippets that aren't whole demo files.
- `Admonition type`: `note | tip | info | warning | danger`.
- `Tabs` / `TabItem label="…"`.
- **Gotchas:**
  - Outside code spans and fences, `{` starts a Svelte expression and `<Foo>` is markup. Wrap such text in backticks. `&#123;` does **not** work: mdsvex decodes it back to `{`.
  - In tables, `\|` inside a code span keeps the backslash. Write union types as separate code spans joined by `\|`, or as raw `<code>` with `&#124;`.
  - Inline code and fences are safe.
  - Tables are GitHub-flavoured markdown.
  - Headings `##` / `###` get ids automatically (repeats get `-1`, `-2` suffixes) and feed the "On this page" list.

## Svelte API cheatsheet (vs React)

- `const ref = useRef<CropperRef>(null)` + `ref={ref}` → `let cropper: CropperRef | undefined = $state()` + `bind:this={cropper}`. Then call `cropper?.getCanvas()`.
- Callbacks receive the same ref object: `onChange={(cropper) => …}`.
- `className="x"` → `class="x"`. Other `*ClassName` props keep their names.
- Classes you pass into library components land on elements in _another_ component, so style them with `:global(.x)` in the demo's `<style>`, or in a uniquely named class.
- `stencilComponent={CircleStencil}` is unchanged. Custom stencils, wrappers and backgrounds are Svelte components that receive the same props (`cropper`, `children` snippet, …).
- A custom `backgroundComponent` must declare a bindable element ref: `let { ref = $bindable(null), … } = $props()` and `bind:this={ref}`.
- `CropperPreview cropper={cropperRef}` takes the `bind:this` value directly (not `{ current }`).
- Hooks keep their names but take getters where React took values: `useCropperImage(() => ({ src }))`, `useAbstractCropper(() => props)`. `useMoveImageOptions` and friends are pure functions (wrap in `$derived`). `useUpdateEffect(effect, () => deps)`.
- Styles: users `import 'svelte-advanced-cropper/style.css'`, and themes via `svelte-advanced-cropper/themes/<name>.css`. The docs site already loads the default theme globally.
- To scope a theme to one demo (ThemeExample, Telegram), use a `<style lang="scss">` block with `.your-wrapper :global { @import 'advanced-cropper/themes/<name>.scss'; }` (see `src/site/demos/examples/ThemeExample.svelte`). Do not use `:global(.your-wrapper) { @import … }`: Svelte scopes the nested selectors, drops them as unused, and the theme has no effect. Sass is installed.

## Light and dark themes

The site defaults to dark, with a toggle in the navbar (`data-theme` on `<html>`, set before the first paint by `src/app.html`, stored in `localStorage.theme`). Every demo must read well in both:

- Page surfaces use the tokens from `src/site/styles/site.css`: `--color-surface`, `--color-surface-subtle`, `--color-surface-raised`, `--color-border`, `--color-text`, `--color-muted`, `--color-code`. Never hard-code white backgrounds, light-grey borders or dark body text.
- Deliberate demo visuals keep their own colours: the cropper's black backdrop, stencil and overlay colours, the showcase brand palettes, `--color-accent` (#61dafb). Give any such element a complete colour pair (background and text) so it doesn't inherit a colour that vanishes in one theme.
- Code fences are highlighted for both themes automatically.
- Check new demos in both themes before finishing.

## Quality bar

- Every upstream demo on your pages exists and works: the same behaviour, controls and photo.
- Pages cover every section upstream has. Upstream "not documented yet" stubs become real, concise reference pages: props table, events and exports, a short example. Use `src/lib/**` as the source of truth for props, defaults and types.
- Document the **Svelte** API (ours), not React's. Where they differ, say so briefly.
- Responsive: demos must not overflow on a 375px-wide screen.

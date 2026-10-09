# Docs site authoring guide

This site documents the Svelte-native API of `svelte-advanced-cropper`. Organize material around user tasks, component composition and public contracts. Historical upstream studies are background material, not a required page structure. Read `docs/study/00-index.md` for current decisions and preserved fixes.

## Hard rules

1. **Write original prose.** Norserium's upstream documentation text must not be copied. Explain behaviour from the current implementation and tests. Preserve appropriate attribution for MIT-derived code.
2. **Start with Svelte concepts:** `$state` for local UI state, `$derived` for cropper reads, child components for stencils, snippets for replaceable layers, context for custom stencils and `bind:this` for imperative methods. Use effects only for actual synchronization. Callbacks are props (`onChange={...}`); DOM events use `onclick`. Use `class` arrays/objects and style strings.
3. **Demos import the library by package name**: `import { Cropper } from 'svelte-advanced-cropper'` (aliased to `src/lib`). The source we display is then exactly what users would write. Never import `#lib` in a demo.
4. **Images**: only use the photos in `static/img/images/` through `import { image } from '#site/paths.ts'` and `image('calico-cat.jpg')`. The set is our own: animals and nature from Unsplash, with no people (see its `CREDITS.md`). Pick a photo whose shape suits the demo; don't reuse upstream's photos. A new photo must follow the same rules and be credited in `CREDITS.md`. Never hotlink, and never copy upstream SVG illustrations, diagrams or logos. Recreate diagrams as simple HTML/CSS or inline SVG of your own.
5. **Icons**: `@lucide/svelte`, e.g. `import { RotateCw } from '@lucide/svelte'`. Do not port upstream's icon components.
6. **Respect the current task's assigned files and execution constraints.** Shared helpers belong in `src/site/components/`; demo-specific helpers live next to their demo.
7. **Scratch files** go only in `tmp/` in this project. Never use the system temp directory or your home directory.
8. **Validate implementation work:** run `mise x -- pnpm format`, `mise x -- pnpm lint`, `mise x -- pnpm check`, relevant tests and the strict Pages build before declaring a docs change complete:

   `BASE_PATH=/svelte-advanced-cropper STRICT_LINKS=1 mise x -- pnpm exec vite build`

9. **Core imports:** the root/extensions-only restriction applies to `src/lib`. The Telegram site showcase may import `advanced-cropper/showcase/mobile`, which ships in the core package. Site demos may also import theme SCSS for scoped theme examples.

## Files

- Page: `src/routes/docs/<section>/<lowercase-kebab-name>/+page.svx` (or an existing top-level page such as `/docs/intro`). Canonical URLs are independent of upstream names. Add each page to `src/site/nav.ts`; do not create legacy redirects. Migration pages live at `/docs/migration/from-0-1` and `/docs/migration/from-react`.
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

# Page title Markdown prose. Links are root-relative: [Stencils](/docs/guides/stencils). The base
path is added at build time.

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

## Svelte authoring contracts

- Use child `RectangleStencil`, `CircleStencil` or custom stencils with direct props. No children means the default rectangle; supplied children need not contain a stencil.
- Use `CropperInstance<E>`, `FixedCropperInstance<E>` and `CropperPreviewInstance` for instance bindings; do not infer the generic contract with `ReturnType<typeof Cropper>`. Read getters with `$derived`; call `getCanvas()` explicitly when exporting.
- Keep built-in settings as flat props, such as `minWidth={100}`. The `settings` object is for extension keys and must not redefine built-in names. Core types and utilities are re-exported by the package.
- Prefer `<CropperPreview {cropper} />` over update callbacks. Preview snippets receive `preview` and the background receives the computed `size`.
- Replace layers with `wrapper`, `boundary`, `backgroundWrapper` and `background` snippets; previews support all except `backgroundWrapper`. Use the exported `*SnippetProps` types. Forward supplied `class`/`style` and render supplied `children` exactly once, including before state exists.
- Custom boundaries register a `BoundaryHandle` through `registerBoundary` and retain its cleanup. Custom export backgrounds use `{@attach attachSource(ready)}` on the actual drawn image/canvas; asynchronous canvas drawing supplies readiness for the current image. Cleanup must not unregister a replacement. Preview backgrounds do not register an export source.
- Custom stencils call `getCropperContext()` and `registerStencil(() => options)` during initialization, before state guards. Registration installs destruction cleanup. Read `context.image` and `context.disabled` reactively; effective disabled is inherited disabled OR local disabled.
- Custom `handler`/`line` snippets preserve the native event in `onMove` and forward `onMoveEnd`. Gesture listeners remain native and non-passive through attachments.
- Use one `class` and a style string per visual component. Target parts and states with the tested selectors in `/docs/reference/styling`; use direct-child selectors when nested bounding boxes must be styled independently. Demo styles reaching library elements need `:global(...)`.
- Obsolete API names belong only in migration examples: `stencilComponent`, `stencilProps`, `*Component`/prop bags, `*ClassName`, `CropperRef`, public `use*` and `bind:ref`. Use `CropperSource bind:element` for its image element. There is no public controller constructor or coordinate binding.
- Show all helper source files used by an example, keep package-name imports and use credited local images. Give grouped API entries explicit stable kebab-case anchors.

## Styles and theme scoping

- Styles: users `import 'svelte-advanced-cropper/style.css'`, and themes via `svelte-advanced-cropper/themes/<name>.css`. The docs site already loads the default theme globally.
- To scope a theme to one demo (ThemeExample, Telegram), use a `<style lang="scss">` block with `.your-wrapper :global { @import 'advanced-cropper/themes/<name>.scss'; }` (see `src/site/demos/examples/ThemeExample.svelte`). Do not use `:global(.your-wrapper) { @import … }`: Svelte scopes the nested selectors, drops them as unused, and the theme has no effect. Sass is installed.

## Light and dark themes

The site defaults to dark, with a toggle in the navbar (`data-theme` on `<html>`, set before the first paint by `src/app.html`, stored in `localStorage.theme`). Every demo must read well in both:

- Page surfaces use the tokens from `src/site/styles/site.css`: `--color-surface`, `--color-surface-subtle`, `--color-surface-raised`, `--color-border`, `--color-text`, `--color-muted`, `--color-code`. Never hard-code white backgrounds, light-grey borders or dark body text.
- Deliberate demo visuals keep their own colours: the cropper's black backdrop, stencil and overlay colours, the showcase brand palettes, `--color-accent` (#61dafb). Give any such element a complete colour pair (background and text) so it doesn't inherit a colour that vanishes in one theme.
- Code fences are highlighted for both themes automatically.
- Check new demos in both themes before finishing.

## Quality bar

- Every supported capability has a working example or meaningful automated coverage. Every retained demo works through the public 0.2.0 API; pages need not match upstream sections, names or ordering.
- Use `src/lib/index.ts`, public declarations, executable demos and contract tests as the source of truth for props, defaults and types.
- Responsive: demos must not overflow on a 375px-wide screen. Check both light and dark themes.

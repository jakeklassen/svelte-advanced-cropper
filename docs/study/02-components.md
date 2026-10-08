# 02 — Components: react-advanced-cropper → Svelte 5

Study of every React component in `tmp/react-advanced-cropper/src/components/**` (react-advanced-cropper
`0.20.2`, upstream commit `a51e293`, core `advanced-cropper@0.17.1`). Each component has its props,
DOM and CSS classes, refs, events, customization points, the React mechanics it uses, and a proposed
Svelte 5 mapping.

Hooks (`useAbstractCropper`, `useCropperInstance`, `useCropperImage`, and the rest) are covered only as
far as the components depend on them. Upstream citations use the form
`tmp/react-advanced-cropper/src/...:line`. Core SCSS is in `tmp/advanced-cropper/src/styles/**`.

---

## 0. Inventory

`src/components` holds **27** component files: AbstractCropper, 2 croppers, 2 stencils, 1 handler,
1 line, 3 helpers, and 17 service files. The brief said "20 service files", but there are 17.

| #   | File                                   | Export                                          | Kind                                  | Exported from `src/index.ts`            | Ref / imperative                            |
| --- | -------------------------------------- | ----------------------------------------------- | ------------------------------------- | --------------------------------------- | ------------------------------------------- |
| 1   | `AbstractCropper.tsx`                  | `AbstractCropper`                               | `forwardRef` via `createCropper`      | **No** (types only, through `types.ts`) | the full cropper API (`AbstractCropperRef`) |
| 2   | `croppers/Cropper.tsx`                 | `Cropper`                                       | `forwardRef`                          | yes                                     | forwards to AbstractCropper                 |
| 3   | `croppers/FixedCropper.tsx`            | `FixedCropper`                                  | `forwardRef`                          | yes                                     | forwards to AbstractCropper                 |
| 4   | `stencils/RectangleStencil.tsx`        | `RectangleStencil`                              | `forwardRef`                          | yes                                     | `{ aspectRatio }`                           |
| 5   | `stencils/CircleStencil.tsx`           | `CircleStencil`                                 | `forwardRef`                          | yes                                     | `{ aspectRatio: 1, boundingBox: 'circle' }` |
| 6   | `handlers/SimpleHandler.tsx`           | `SimpleHandler`                                 | FC + `useState`                       | yes                                     | —                                           |
| 7   | `lines/SimpleLine.tsx`                 | `SimpleLine`                                    | FC + `useState`                       | yes                                     | —                                           |
| 8   | `helpers/CropperPreview.tsx`           | `CropperPreview`                                | `forwardRef`                          | yes                                     | `{ refresh, update }`                       |
| 9   | `helpers/CropperPreviewBackground.tsx` | `CropperPreviewBackground`                      | FC                                    | yes                                     | —                                           |
| 10  | `helpers/CropperPreviewWrapper.tsx`    | `CropperPreviewWrapper`                         | FC                                    | yes                                     | —                                           |
| 11  | `service/ArtificialTransition.tsx`     | `ArtificialTransition`                          | FC + layout effect                    | **No**                                  | —                                           |
| 12  | `service/BoundingBox.tsx`              | `BoundingBox`                                   | FC + `useMemo`                        | yes                                     | —                                           |
| 13  | `service/CropperBackgroundImage.tsx`   | `CropperBackgroundImage`                        | `forwardRef` to `<img>`               | yes                                     | DOM `HTMLImageElement`                      |
| 14  | `service/CropperBackgroundWrapper.tsx` | `CropperBackgroundWrapper`                      | FC                                    | yes                                     | —                                           |
| 15  | `service/CropperCanvas.tsx`            | `CropperCanvas`                                 | `forwardRef`                          | yes                                     | `{ draw }`                                  |
| 16  | `service/CropperFade.tsx`              | `CropperFade`                                   | FC                                    | yes                                     | —                                           |
| 17  | `service/CropperSource.tsx`            | `CropperSource`                                 | `forwardRef` to `<img>`               | yes                                     | DOM `HTMLImageElement`                      |
| 18  | `service/CropperWrapper.tsx`           | `CropperWrapper`                                | FC                                    | yes                                     | —                                           |
| 19  | `service/DraggableArea.tsx`            | `DraggableArea`                                 | re-export alias of `DraggableElement` | yes                                     | —                                           |
| 20  | `service/DraggableElement.tsx`         | `DraggableElement`                              | **class component**                   | yes                                     | (class instance)                            |
| 21  | `service/HandlerWrapper.tsx`           | `HandlerWrapper`                                | FC                                    | **No**                                  | —                                           |
| 22  | `service/LineWrapper.tsx`              | `LineWrapper`                                   | FC                                    | **No**                                  | —                                           |
| 23  | `service/StencilGrid.tsx`              | `StencilGrid`                                   | FC + `useUpdateEffect`                | yes                                     | —                                           |
| 24  | `service/StencilOverlay.tsx`           | `StencilOverlay`                                | FC                                    | yes                                     | —                                           |
| 25  | `service/StencilWrapper.tsx`           | `StencilWrapper`                                | FC                                    | yes                                     | —                                           |
| 26  | `service/StretchableBoundary.tsx`      | `StretchableBoundary`                           | `forwardRef`                          | yes                                     | `{ stretchTo, reset }`                      |
| 27  | `service/TransformableImage.tsx`       | `TransformableImage`, `TransformableImageEvent` | **class component** + class           | yes                                     | (class instance)                            |

Public-export facts from `tmp/react-advanced-cropper/src/index.ts:1-57`:

- `AbstractCropper`, `ArtificialTransition`, `HandlerWrapper`, and `LineWrapper` are **not** exported. Their
  types do leak out, for example `AbstractCropperRef` and `AbstractCropperIntrinsicProps` through
  `types.ts:3-6`. For parity the Svelte port should keep these four internal, though exporting
  them would do no harm.
- `src/index.ts:56-57` imports `advanced-cropper/styles/index.scss` and `advanced-cropper/themes/default.scss`.
  Rollup extracts them to `dist/style.css`, and `scripts/themes.js` builds `dist/themes/{compact,classic,bubble,corners,default}.css`.
- `service/react.ts` exports `mergeRefs`, and `src/index.ts:33` re-exports it. It has no Svelte analogue. Since
  `bind:this` composes naturally, it can be skipped or kept as a no-op type export.
- The upstream docs (`example/docs/tutorials/custom-stencil.mdx:71,140`) import `StencilProps` / `StencilRef`
  from the package, but 0.20.2 does **not** export them. The docs are out of date with the code. The Svelte port should _add_
  `StencilProps`/`StencilRef`-style types because custom stencils need them.

---

## 1. Component hierarchy

### 1.1 `<Cropper>` with defaults

```
Cropper                                   (croppers/Cropper.tsx:20)   splits props → settings/props
└─ AbstractCropper                        (AbstractCropper.tsx:101)   owns cropper instance + refs
   └─ wrapperComponent = CropperWrapper                       div.advanced-cropper.{className}.advanced-cropper-wrapper
      └─ CropperFade                                          div.advanced-cropper-wrapper__fade.advanced-cropper-fade[--visible]
         └─ boundaryComponent = StretchableBoundary   (ref → refs.boundary)
            │                                                 div.advanced-cropper-boundary.advanced-cropper__boundary.{boundaryClassName}
            ├─ div.advanced-cropper-boundary__stretcher
            └─ div.advanced-cropper-boundary__content
               ├─ backgroundWrapperComponent = CropperBackgroundWrapper
               │  └─ TransformableImage                       div.advanced-cropper__background-wrapper   (wheel/touch/mouse)
               │     ├─ backgroundComponent = CropperBackgroundImage  (only when state != null; ref → refs.image)
               │     │                                        img.advanced-cropper-background-image.advanced-cropper__background.{backgroundClassName}
               │     └─ stencilComponent = RectangleStencil   (ref → stencilRef)  (renders nothing until state)
               │        └─ StencilWrapper → ArtificialTransition
               │           │                                  div.advanced-cropper-artificial-transition.advanced-cropper-stencil-wrapper.advanced-cropper-rectangle-stencil[--movable|--moving|--resizable|--resizing|--disabled]
               │           └─ BoundingBox                     div.advanced-cropper-bounding-box.advanced-cropper-rectangle-stencil__bounding-box
               │              ├─ DraggableArea (=DraggableElement)  div.advanced-cropper-draggable-element.advanced-cropper-rectangle-stencil__draggable-area
               │              │  └─ StencilOverlay                  div.advanced-cropper-stencil-overlay.advanced-cropper-rectangle-stencil__overlay
               │              │     ├─ [grid] StencilGrid           div.advanced-cropper-stencil-grid[--visible].advanced-cropper-rectangle-stencil__grid
               │              │     └─ div.advanced-cropper-rectangle-stencil__preview
               │              ├─ div  (lines; no class)
               │              │  └─ ×4 lineComponent = SimpleLine → LineWrapper → DraggableElement
               │              └─ div  (handlers; no class)
               │                 └─ ×8 div.advanced-cropper-bounding-box__handler-wrapper--{pos}
               │                       └─ handlerComponent = SimpleHandler → HandlerWrapper → DraggableElement
               └─ [canvas] CropperCanvas  (ref → refs.canvas)  canvas.advanced-cropper-canvas ×2
```

`CircleStencil` has the same tree with the `advanced-cropper-circle-stencil` prefix. It shows only the 4
corner handlers by default (`CircleStencil.tsx:87-92`).

### 1.2 `<FixedCropper>` with defaults

```
FixedCropper                              (croppers/FixedCropper.tsx:26)
└─ AbstractCropper  postProcess=fixedStencil, stencilConstraints=fixedStencilConstraints,
   │                settings={ defaultSize, aspectRatio, sizeRestrictions: withDefaultSizeRestrictions(sizeRestrictions),
   │                           ...userSettings (incl. stencilSize), transformImage: {...user, adjustStencil:false} }
   └─ (identical subtree to 1.1)
```

FixedCropper does **not** change the default stencil, wrapper, background, or boundary. The fixed
size comes entirely from settings and postProcess. Users usually pass
`stencilProps={{ handlers: {}, lines: {}, movable: false, resizable: false }}` themselves.

### 1.3 `<CropperPreview>`

```
CropperPreview                            (helpers/CropperPreview.tsx:75)
└─ wrapperComponent = CropperPreviewWrapper           div.{className}.advanced-cropper-preview.cropper-preview-wrapper
   └─ CropperFade                                     div.cropper-preview-wrapper__fade.advanced-cropper-fade[--visible]
      └─ boundaryComponent = StretchableBoundary (stretchAlgorithm=stretchPreviewBoundary; ref → boundaryRef)
         │                                            div.advanced-cropper-boundary.advanced-cropper-preview__boundary.{boundaryClassName}
         ├─ div.advanced-cropper-boundary__stretcher
         └─ div.advanced-cropper-boundary__content
            └─ div.{contentClassName}.advanced-cropper-preview__content  style={width,height px}
               └─ backgroundComponent = CropperPreviewBackground (only if instance)
                                                      img.advanced-cropper-background-image.{backgroundClassName}.advanced-cropper-preview__image[--visible]
```

Note the class `cropper-preview-wrapper`. It has **no** `advanced-` prefix (`CropperPreviewWrapper.tsx:18`).

---

## 2. Data flow

### 2.1 How components get cropper state: prop drilling only

- No React context is used anywhere in the package (grep confirms: no `createContext` or `useContext`).
- AbstractCropper holds a single `cropper` object, the "cropper interface" built in
  `hooks/useAbstractCropper.ts:117-168`. It passes this object explicitly as the `cropper` prop to
  `wrapperComponent`, `backgroundWrapperComponent`, `backgroundComponent`, and `stencilComponent`
  (`AbstractCropper.tsx:166,177,186,190`). The stencil also gets `image` (the current `CropperImage | null`).
- Children are _pull-based_. During render they call `cropper.getState()`, `getTransitions()`,
  `getInteractions()`, `getImage()`, `isLoaded()`, and so on. Each one declares a narrow
  `DesiredCropperRef` interface (for example `RectangleStencil.tsx:42-51`) describing the subset it needs. That is the
  real contract for custom components.
- Handlers and lines **never** receive `cropper`. BoundingBox gives them only
  `onMove`/`onMoveEnd` callbacks.
- Re-render model: `CropperInstance.setData` calls `notify` (`instance/CropperInstance.ts:37-40`),
  which is `useForceRerender` (`hooks/useCropperInstance.ts:27,55`). The **whole** AbstractCropper
  subtree then re-renders on every state change. No `React.memo` exists anywhere, and the `cropper` object is
  rebuilt on every render (`useAbstractCropper.ts:117`), so memoization would not work anyway.

**Svelte mapping.** Keep explicit `cropper` prop drilling. It is the public contract that custom
components rely on, and parity requires it. Make it reactive by backing the core instance's data with
`$state.raw`, because the core replaces `data` wholesale in `setData`. Any `cropper.getState()` read
inside a template or `$derived` then becomes a tracked dependency. The `cropper` object should be
**stable**, created once per AbstractCropper, and child components derive from it:
`const state = $derived(cropper.getState())`. `useForceRerender` is not ported. A `createContext`
pair (`svelte` 5.57 exports `createContext<T>(): [get, set, has]`, see
`node_modules/svelte/types/index.d.ts:502`) _could_ be offered later as an additive extra, but it is
outside parity and is not needed internally.

### 2.2 Prop channels from AbstractCropper to children

Spread order matters because later props win, both in JSX and in Svelte spreads.

| Channel                                 | Destination                  | Spread position (what it can't override)                                                 | Source                        |
| --------------------------------------- | ---------------------------- | ---------------------------------------------------------------------------------------- | ----------------------------- |
| `wrapperProps` (default `{}`)           | `wrapperComponent`           | first → cannot override `disabled`, `className`, `cropper`, `style`, `loading`, `loaded` | `AbstractCropper.tsx:163-168` |
| `boundaryProps` (default `undefined`)   | `boundaryComponent`          | first → cannot override `ref`, `className`                                               | `:171-173`                    |
| `backgroundWrapperProps` (default `{}`) | `backgroundWrapperComponent` | first → cannot override `disabled`, `cropper`, `className`                               | `:176-179`                    |
| `backgroundProps` (default `{}`)        | `backgroundComponent`        | first → cannot override `ref`, `crossOrigin`, `cropper`, `className`                     | `:183-187`                    |
| `stencilProps` (default `{}`)           | `stencilComponent`           | first → cannot override `disabled`, `ref`, `cropper`, `image`                            | `:190`                        |

Notable points:

- `wrapperProps` is how custom wrappers receive extra data. Telegram's showcase passes
  `{navigationProps, navigation, spinnerClassName}`. `backgroundWrapperProps` is how users pass
  `scaleImage`, `moveImage`, `rotateImage`, and `timeout` to the default `CropperBackgroundWrapper`.
- `stencilProps` does a second job: it is **also fed to `stencilConstraints`**
  (`AbstractCropper.tsx:137-140`) and is passed down to `useAbstractCropper` as a parameter (`:133`), which ignores it.
- `backgroundWrapperClassName` is declared in `AbstractCropperProps` (`:81`) but **never used**. It
  isn't destructured, so it falls into `...parameters` and is silently dropped. The background wrapper's
  class is hard-coded to `'advanced-cropper__background-wrapper'` (`:179`). This is an upstream bug. Parity means
  accepting the prop. Applying it would be a harmless fix, so decide which behaviour you want and document it.
- `backgroundClassName` and `boundaryClassName` are merged with `cn()` in AbstractCropper. The component never receives a separate prop for them.
- The deprecated `loading` and `loaded` props go to the wrapper (`:156-159,168`). Neither default wrapper reads them.

### 2.3 `stencilConstraints`, settings, and stencil "imperative options"

```ts
// AbstractCropper.tsx:128-142
const stencilRef = useRef<StencilComponent>(null);
useAbstractCropper(() => ({
	...parameters,
	crossOrigin,
	stencilProps,
	canvas,
	settings: {
		...settings,
		...stencilConstraints(settings, { ...stencilProps, ...stencilRef.current })
	}
}));
```

- `useAbstractCropper` → `useCropperInstance` wraps this closure with `usePersistentFunction`
  (`hooks/useCropperInstance.ts:29`). The core calls it **lazily**, every time it needs props or
  settings. The result is a live mix of the latest `stencilProps` and the stencil's imperative handle.
- **The stencil's imperative handle overrides `stencilProps`.** For `RectangleStencil` the handle is
  `{ aspectRatio: createAspectRatio(aspectRatio || {minimum: minAspectRatio, maximum: maxAspectRatio}) }`
  (`RectangleStencil.tsx:137-144`). The raw `stencilProps.aspectRatio` is therefore replaced by a normalized
  `{minimum, maximum}`. Before the stencil mounts (`stencilRef.current === null`), only the raw props apply.
- `CircleStencil` exposes `{ aspectRatio: 1, boundingBox: 'circle' }` (`CircleStencil.tsx:126-129`).
  Its TS `Methods` type (`:77-79`) omits `boundingBox`, but the core's
  `showcase/mobile` `stencilConstraints` reads `stencilOptions.boundingBox`
  (`tmp/advanced-cropper/src/showcase/mobile/index.ts:52-64`). It must be exposed.
- Default `stencilConstraints = defaultStencilConstraints`
  (`tmp/advanced-cropper/src/defaults/defaultStencilConstraints.ts:13-22`). It returns
  `{aspectRatio: createAspectRatio(isFunction(o.aspectRatio) ? o.aspectRatio() : o.aspectRatio)}` **only if
  the user did not set `aspectRatio` in settings**. Otherwise it returns `{}`. A user-level `aspectRatio` prop
  therefore beats the stencil. The stencil's aspect ratio is spread **over** the user settings
  (`...settings, ...constraints`).
- **`aspectRatio` may be a function** (`isFunction` check). The Svelte port depends on this. See 2.4.
- FixedCropper: `fixedStencilConstraints(rawSettings, stencilOptions)`
  (`tmp/advanced-cropper/src/extensions/stencil-size/index.ts:33-58`) returns
  `{ stencilSize(state, settings) }`. That wraps the user's `stencilSize` (a `Size` or a function) and
  intersects its ratio with the stencil's aspect ratio. Because `stencilSize` is a **setting** for FixedCropper
  (`FixedCropper.tsx:27`, `[...defaultSettings, 'stencilSize']`), it reaches `settings.stencilSize`, gets
  wrapped here, and is then consumed by `sizeRestrictions`/`aspectRatio`/`defaultSize`/`fixedStencil`
  in the extension.

### 2.4 Svelte plan for stencil options

`bind:this` on a dynamic component returns the component's **exports object**. Svelte cannot export
`$derived` state, which would be the error `derived_invalid_export` (`node_modules/svelte/src/compiler/errors.js:133`), so:

- `RectangleStencil.svelte`: `export function aspectRatio() { return createAspectRatio(aspectRatioProp || {minimum: minAspectRatio, maximum: maxAspectRatio}); }`
  Core's `defaultStencilConstraints`/`fixedStencilConstraints` already accept a function, so this works
  without changes. A user-written `stencilConstraints` that expects a plain value would break. Document
  that stencil options may be functions, which core's own types already permit.
- `CircleStencil.svelte`: `export const aspectRatio = 1; export const boundingBox = 'circle';`
- AbstractCropper: `let stencilInstance = $state<Record<string, unknown>>();`
  `<Stencil bind:this={stencilInstance} … />` and `stencilConstraints(settings, { ...stencilProps, ...stencilInstance })`.
  Spreading copies the enumerable exports, matching `...stencilRef.current`. I compiled a probe with
  `svelte/compiler` 5.57.2 to confirm the shape: prod exports are a plain object `{ aspectRatio, boundingBox }`; dev exports are
  `{ ...$.legacy_api(), get aspectRatio(){…}, get boundingBox(){…} }`. In dev, the spread therefore also carries
  `$destroy`/`$on`/`$set` stubs that throw only when called. That is harmless for constraints, but filtering keys that start with
  `$` keeps `stencilOptions` clean.
- Alternative: a `$bindable` `options` prop on the stencil. It is less parity-friendly for custom stencils ported
  from React docs, which "expose aspectRatio via ref". Exports are the closest analogue to `useImperativeHandle`.

### 2.5 How props become settings (`useAbstractCropperProps`)

`hooks/useAbstractCropperProps.ts:8-26` walks `Object.keys(props)`. A key goes into `settings` if it
appears in `service/constants.ts` `defaultSettings` (19 names: `transformImage, moveCoordinates,
resizeCoordinates, defaultCoordinates, defaultVisibleArea, areaPositionRestrictions, areaSizeRestrictions,
sizeRestrictions, positionRestrictions, aspectRatio, minWidth, minHeight, maxWidth, maxHeight, defaultSize,
defaultPosition, defaultTransforms, imageRestriction, priority`). Every other key goes into `props`.
FixedCropper adds `'stencilSize'`.

Consequences:

- Extension settings for `Cropper` other than those 19 (for example a custom `CustomCropperProps<{foo}>`) land in
  `props`. They are then spread into `parameters`, **not** into `settings`. Only FixedCropper's `stencilSize` is special-cased.
- `Cropper.tsx:26` destructures `stencilSize` and `autoZoom` out of `cropperProps.settings`. Neither key is in
  `defaultSettings`, so both are **always `undefined` there**. The deprecated `autoZoom` and `stencilSize`
  branches (`Cropper.tsx:30-55`) are **dead code** in 0.20.2: `<Cropper stencilSize>` silently does nothing,
  and `hybridStencilAutoZoom` is never applied. **Do not port** this deprecation path. If you want parity
  with a warning, warn when the `stencilSize` or `autoZoom` props are present on `Cropper`.
- `useAbstractCropperProps.ts:4` imports types from `'../../../../Advanced Cropper/advanced-cropper/dist'`,
  a path on the author's machine. It works only because TypeScript elides type-only imports. Do not copy it.

Svelte: `let { ...all } = $props()` followed by a `$derived` split, `settings = pick(all, SETTINGS_KEYS)` and
`rest = omit(all, SETTINGS_KEYS)`. Plain object spreading of `$props()` rest is reactive (the rest object is a
proxy over props), so a `$derived.by` that iterates keys re-runs when props change.

---

## 3. Cross-cutting concerns

### 3.1 Class names (`classnames`)

- Every component uses `classnames` (`cn`) with strings, `cond && 'x'`, objects (`{'x': bool}`), and arrays
  (`LineWrapper.tsx:29-34`, `StretchableBoundary.tsx:70-71`).
- Svelte ≥ 5.16 accepts clsx-style values on the native `class` attribute (`ClassValue` in
  `node_modules/svelte/elements.d.ts:2081`). For **DOM elements**, use `class={[…]}` or `class={{…}}` directly.
- For **props passed to replaceable child components** (`className`, `wrapperClassName`, `defaultClassName`,
  `hoverClassName`, …), pass **strings**. A user's custom component is typed `className?: string` and may
  do string concatenation. Add a tiny internal `cn()` (≈10 lines) in `src/lib/service/cn.ts`
  rather than a new dependency. `clsx` is only a transitive dependency of `svelte` and is not resolvable under
  pnpm without being declared.
- Class _order_ is irrelevant to CSS. DOM-snapshot tests should compare class **sets**.

### 3.2 `className` vs `class`

React uses `className` everywhere, including many derived names (`backgroundClassName`,
`boundaryClassName`, `handlerClassNames`, `lineWrapperClassNames`, `movingClassName`, …). Parity
requires these names. Recommendation:

- Keep **`className`** as the public prop on every component (parity with docs and custom-component
  contracts). On top-level user-facing components (`Cropper`, `FixedCropper`, `CropperPreview`), also accept
  Svelte's `class` and merge it: `cn('advanced-cropper', className, klass)`.
- Internally, always pass `className` to replaceable components. That is the contract custom components implement.

### 3.3 `style`

- React `style` is a `CSSProperties` object, merged by spreading:
  `style={{...transformStyles, ...style}}` (`CropperBackgroundImage.tsx:36-39`,
  `CropperPreviewBackground.tsx:41-44`). The user style wins.
- Core helpers return **objects with camelCase keys**: `getBackgroundStyle`/`getPreviewStyle` give
  `{width,height,left,top,transition,transform,willChange}` (`tmp/advanced-cropper/src/image/index.ts:384-405`).
- Svelte's `style` attribute is a string, and `style:prop={v}` directives exist. Recommendation:
  public `style?: string` (idiomatic). Internally convert core objects with a `styleToString(obj)` helper
  (camelCase → kebab-case) and concatenate `${core};${user}`. Later declarations win, which matches the React merge order.
  `SimpleHandler.wrapperStyle` becomes a `string` too.

### 3.4 Refs: three different React patterns, three Svelte mappings

| React pattern                                     | Where                                                                                              | Svelte 5 mapping                                                                                                                        |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `useImperativeHandle` exposing **methods/values** | AbstractCropper/Cropper/FixedCropper, stencils, CropperPreview, CropperCanvas, StretchableBoundary | `export function …` / `export const …` in the component, consumed via `bind:this`                                                       |
| `forwardRef` to a **DOM element**                 | CropperBackgroundImage, CropperSource                                                              | `ref = $bindable<HTMLImageElement \| null>(null)` prop + `bind:this={ref}` on the `<img>`, consumed via `bind:ref` (bits-ui convention) |
| Class component instance                          | DraggableElement, TransformableImage                                                               | Not needed. Instance fields become plain `let` variables in `<script>`. Nothing upstream reads these instances via ref.                 |

Custom `backgroundComponent`s (for example the upstream ImageEditor's `AdjustableCropperBackground`, which forwards a
**canvas** ref) need a contract. In Svelte: "your background component must accept a bindable `ref` prop and bind
it to the drawable element (`HTMLImageElement | HTMLCanvasElement`)." AbstractCropper renders
`<Background bind:ref={imageElement} …/>`, and `getCanvas()` uses `imageElement`.

### 3.5 DOM events in Svelte: delegation and passive pitfalls

Facts checked in `node_modules/svelte/src/utils.js:110-134,261`:

- Svelte **delegates** `mousedown`, `mousemove`, `mouseup`, `mouseover`, `mouseout`, `touchstart`, `touchmove`, `touchend`,
  `click`, `pointer*`, and others to the app root when declared as `on…` attributes.
- `touchstart` and `touchmove` declared as attributes are **passive**, so `preventDefault()` is ignored.
- `on(element, type, handler, options)` from `svelte/events` attaches a **native** listener, honours
  `{ passive: false }`, and preserves ordering with delegated handlers
  (`node_modules/svelte/src/internal/client/dom/elements/events.js:104-111`).

Why this matters. The upstream interaction model depends on native-listener ordering and on `stopPropagation`:

- The ancestor `TransformableImage` listens on its container for native `mousedown` and `touchstart`
  (`TransformableImage.tsx:234-242`). It does this deliberately with `addEventListener` and `passive: false`, because of
  facebook/react#9809. The same reason applies in Svelte.
- The descendant `DraggableElement`s (stencil area, handlers, lines) also use native `mousedown` and `touchstart`, and they call
  `e.stopPropagation()` (`DraggableElement.tsx:138-139,179`). The parent's native listener therefore never
  sees the event, so dragging the stencil does not also pan the image.
- If the Svelte port used `onmousedown={…}` attributes (delegated to root), the stopPropagation would run
  **after** the ancestor's native listener had already fired. Stencil drags would also move the image.

**Rule for the port:** every interactive listener in DraggableElement and TransformableImage is registered
inside an `{@attach}` attachment using `on(node, 'mousedown' | 'touchstart' | 'wheel', h, { passive: false })`.
Window listeners use `on(window, …, { passive: false })` inside the same attachment, so cleanup is automatic when
the attachment's teardown runs. Handlers read props at call time, which is live in Svelte. Avoid reading reactive values
synchronously in the attachment body, or the attachment will re-run and re-register everything. Plain
`onmouseover`/`onmouseleave` attributes are fine for hover, and so is `onmousedown={preventDefault}` on `<img>`. Both only
call `preventDefault`, and ordering doesn't matter for them.

### 3.6 Styles

The core ships per-component SCSS under `tmp/advanced-cropper/src/styles/**`, aggregated by `styles/index.scss`,
plus themes in `tmp/advanced-cropper/src/themes/*.scss`. All selectors are **global**, single-class BEM. Users
override them with their own global CSS of equal specificity, and themes load after the base styles.

The project CLAUDE.md says "plain CSS in scoped `<style>` blocks". Caveats:

1. Svelte scoping adds a `.svelte-xyz` class, so a scoped rule gains +0-1-0 specificity. A user rule such as
   `.advanced-cropper-simple-handler { display:none }` would then **lose** to the scoped base rule. That
   breaks parity with the documented theming (`example/docs/guides/customize-appearance.mdx`, `themes.mdx`).
2. Classes passed into child components (for example `advanced-cropper-rectangle-stencil__grid` set on
   `StencilGrid` by the stencil) are not matched by the parent's scoped styles.

Recommendation: wrap base rules in `:global(...)` inside each component's `<style>`. That keeps file
co-location with zero added specificity. Alternatively, ship `styles.css` plus `themes/*.css` like upstream. Themes must be
global CSS either way.

### 3.7 SCSS → class map, used in each section below

| Core SCSS file                               | Root class                                                                                                                                                  |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `styles/AbstractCropper.scss`                | `.advanced-cropper` (+ `__boundary`, `__wrapper`, `__background-wrapper`, `__stencil-wrapper`; `__wrapper` and `__stencil-wrapper` are **unused** by React) |
| `styles/service/StretchableBoundary.scss`    | `.advanced-cropper-boundary` (+`__content`, `__stretcher`)                                                                                                  |
| `styles/service/CropperWrapper.scss`         | `.advanced-cropper-wrapper__fade`                                                                                                                           |
| `styles/service/CropperFade.scss`            | `.advanced-cropper-fade` (+`--visible`)                                                                                                                     |
| `styles/service/CropperBackgroundImage.scss` | `.advanced-cropper-background-image`                                                                                                                        |
| `styles/service/CropperCanvas.scss`          | `.advanced-cropper-canvas {display:none}`                                                                                                                   |
| `styles/service/CropperSource.scss`          | `.advanced-cropper-source`                                                                                                                                  |
| `styles/service/ArtificialTransition.scss`   | `.advanced-cropper-artificial-transition {will-change: transform}`                                                                                          |
| `styles/service/StencilWrapper.scss`         | `.advanced-cropper-stencil-wrapper {will-change: transform}`                                                                                                |
| `styles/service/BoundingBox.scss`            | `.advanced-cropper-bounding-box` (+`__handler-wrapper--*`, `__handler--*`, `__line--*`)                                                                     |
| `styles/service/DraggableElement.scss`       | `.advanced-cropper-draggable-element {}` (empty)                                                                                                            |
| `styles/service/HandlerWrapper.scss`         | `.advanced-cropper-handler-wrapper` (30×30, cursors per direction, `--disabled`, `__draggable`)                                                             |
| `styles/service/LineWrapper.scss`            | `.advanced-cropper-line-wrapper` (12px hit area, cursors, `--disabled`, `__content--*`)                                                                     |
| `styles/service/StencilGrid.scss`            | `.advanced-cropper-stencil-grid` (table layout, `--visible`, `__row`, `__cell--top/left/right/bottom`)                                                      |
| `styles/service/StencilOverlay.scss`         | `.advanced-cropper-stencil-overlay` (1000px box-shadow mask)                                                                                                |
| `styles/stencils/RectangleStencil.scss`      | `.advanced-cropper-rectangle-stencil` (+`__draggable-area/__overlay/__preview/__grid`, `--movable`)                                                         |
| `styles/stencils/CircleStencil.scss`         | `.advanced-cropper-circle-stencil` (+`__overlay`/`__preview` border-radius 50%, `--movable`)                                                                |
| `styles/handlers/SimpleHandler.scss`         | `.advanced-cropper-simple-handler {display:block}`                                                                                                          |
| `styles/lines/SimpleLine.scss`               | `.advanced-cropper-simple-line` (+`--north/south/east/west` borders)                                                                                        |
| `styles/helpers/CropperPreview.scss`         | `.advanced-cropper-preview` (+`__content`, `__image`, `__image--visible`, `__boundary`)                                                                     |
| `styles/helpers/CropperPreviewWrapper.scss`  | `.cropper-preview-wrapper__fade`                                                                                                                            |
| `themes/default.scss`                        | colors for simple-handler, simple-line (`--hover`), circle-stencil `__preview`, stencil-overlay, stencil-grid                                               |

Classes that are emitted but have **no** core rule are theme hooks only: `--moving`, `--resizing`, `--resizable`,
`--disabled` on stencils, and `advanced-cropper-simple-handler-wrapper*`. Themes such as `bubble`/`corners`/`classic`/`compact`
style the `--hover`, `--{direction}`, `--moving`, and `--resizing` variants.

---

## 4. Croppers

### 4.1 AbstractCropper — `src/components/AbstractCropper.tsx`

**1. Purpose and position.** The engine-level component that `Cropper` and `FixedCropper` render. It
owns the cropper instance through `useAbstractCropper`, assembles the five replaceable parts (wrapper,
boundary, background wrapper, background, stencil) plus `CropperCanvas`, and exposes the imperative API.
It is not exported from the package index. It is wrapped with `createCropper` (`service/cropper.ts:3-8`), which
is just `forwardRef` with a generic-friendly signature so that `<AbstractCropper<FixedCropperSettings> …>`
type-checks (`AbstractCropper.tsx:198`, `FixedCropper.tsx:29`).

**2. Props.** `AbstractCropperProps<Settings>` (`:74-94`) is `Omit<AbstractCropperHookProps, 'settings'>`
plus its own props (`useAbstractCropper.ts:19-32`).

| Prop                                                                                                                                                                                                                 | Type (quoted)                                                                                                                      | Default                                | Req     | Behaviour                                                                                                    |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------ |
| `settings`                                                                                                                                                                                                           | `CropperInstanceSettingsProp<Settings>`                                                                                            | —                                      | **yes** | Core settings. Merged with `stencilConstraints(...)` output (`:135-141`).                                    |
| `stencilComponent`                                                                                                                                                                                                   | `StencilComponent` (`= any`, `types.ts:10`)                                                                                        | `RectangleStencil`                     |         | Rendered with `{...stencilProps} disabled ref cropper image`                                                 |
| `stencilProps`                                                                                                                                                                                                       | `ArbitraryProps` (`Record<string, any>`)                                                                                           | `{}`                                   |         | Spread onto the stencil, and fed to `stencilConstraints`                                                     |
| `stencilConstraints`                                                                                                                                                                                                 | `StencilConstraints<AbstractCropperSettingsProp<Settings>>` = `(settings, stencilOptions) => Partial<Settings>` (`types.ts:34-37`) | `defaultStencilConstraints`            |         | See §2.3                                                                                                     |
| `wrapperComponent`                                                                                                                                                                                                   | `CropperWrapperComponent` = `FC<{cropper:any; className?; style?; children?; disabled?}>`                                          | `CropperWrapper`                       |         | Root element                                                                                                 |
| `wrapperProps`                                                                                                                                                                                                       | `ArbitraryProps`                                                                                                                   | `{}`                                   |         | Spread first onto the wrapper                                                                                |
| `backgroundWrapperComponent`                                                                                                                                                                                         | `CropperBackgroundWrapperComponent` = `FC<{cropper:any; children?; className?; style?; disabled?}>`                                | `CropperBackgroundWrapper`             |         | Interaction layer around background and stencil                                                              |
| `backgroundWrapperProps`                                                                                                                                                                                             | `ArbitraryProps`                                                                                                                   | `{}`                                   |         | e.g. `{scaleImage, moveImage, rotateImage, timeout}`                                                         |
| `backgroundWrapperClassName`                                                                                                                                                                                         | `string`                                                                                                                           | —                                      |         | **Declared, never applied** (bug, §2.2)                                                                      |
| `backgroundComponent`                                                                                                                                                                                                | `CropperBackgroundComponent` (`any`)                                                                                               | `CropperBackgroundImage`               |         | Rendered only when `cropper.getState()` is truthy; must forward a ref to the drawable element                |
| `backgroundProps`                                                                                                                                                                                                    | `ArbitraryProps`                                                                                                                   | `{}`                                   |         | Spread first                                                                                                 |
| `backgroundClassName`                                                                                                                                                                                                | `string`                                                                                                                           | —                                      |         | Merged into `advanced-cropper__background`                                                                   |
| `boundaryComponent`                                                                                                                                                                                                  | `CropperBoundaryComponent` (`any`)                                                                                                 | `StretchableBoundary`                  |         | Must expose `stretchTo(size)` and `reset()` via ref                                                          |
| `boundaryProps`                                                                                                                                                                                                      | `ArbitraryProps`                                                                                                                   | `undefined`                            |         | e.g. `{stretchAlgorithm, sizeAlgorithm}`                                                                     |
| `boundaryClassName`                                                                                                                                                                                                  | `string`                                                                                                                           | —                                      |         | Merged into `advanced-cropper__boundary`                                                                     |
| `className`                                                                                                                                                                                                          | `string`                                                                                                                           | —                                      |         | Merged into `advanced-cropper` and passed to the wrapper                                                     |
| `style`                                                                                                                                                                                                              | `CSSProperties`                                                                                                                    | —                                      |         | Passed to the wrapper                                                                                        |
| `disabled`                                                                                                                                                                                                           | `boolean`                                                                                                                          | `undefined`                            |         | Passed to wrapper, background wrapper, and stencil                                                           |
| `canvas`                                                                                                                                                                                                             | `boolean`                                                                                                                          | `true`                                 |         | Renders `CropperCanvas`; also forwarded to image loading (`useCropperImage` `canvas` → crossOrigin fallback) |
| `crossOrigin`                                                                                                                                                                                                        | `'anonymous' \| 'use-credentials' \| boolean`                                                                                      | `true`                                 |         | Passed to the background component and the image loader                                                      |
| `src`                                                                                                                                                                                                                | `string \| null`                                                                                                                   | —                                      |         | Image URL (via `...parameters`)                                                                              |
| `checkOrientation`                                                                                                                                                                                                   | `boolean`                                                                                                                          | `true` (hook)                          |         | EXIF orientation                                                                                             |
| `unloadTime`                                                                                                                                                                                                         | `number`                                                                                                                           | `500` (hook)                           |         | Delay before the image is swapped or cleared                                                                 |
| `autoReconcileState`                                                                                                                                                                                                 | `boolean`                                                                                                                          | `true` (hook)                          |         | Reconcile after each render when idle                                                                        |
| `onReady` / `onError` / `onUpdate`                                                                                                                                                                                   | `(cropper: AbstractCropperRef) => void`                                                                                            | —                                      |         | Image lifecycle (hook). `onUpdate` is **also** an instance callback, so it fires from both places            |
| `transitions`                                                                                                                                                                                                        | `CropperTransitionsSettings \| boolean`                                                                                            | `true` (`useCropperInstance.ts:40-43`) |         | Core parameter                                                                                               |
| `postProcess`                                                                                                                                                                                                        | `PostprocessFunction \| PostprocessFunction[]`                                                                                     | —                                      |         | Core parameter                                                                                               |
| `setCoordinatesAlgorithm`, `setVisibleAreaAlgorithm`, `setBoundaryAlgorithm`, `transformImageAlgorithm`, `moveCoordinatesAlgorithm`, `resizeCoordinatesAlgorithm`, `createStateAlgorithm`, `reconcileStateAlgorithm` | core algorithm types                                                                                                               | —                                      |         | `AbstractCropperInstanceParameters` (`tmp/advanced-cropper/src/instance/AbstractCropperInstance.ts:128-139`) |
| `onChange`, `onTransitionsStart`, `onTransitionsEnd`, `onResize`, `onResizeEnd`, `onMove`, `onMoveEnd`, `onTransformImage`, `onTransformImageEnd`, `onInteractionStart`, `onInteractionEnd`                          | `(cropper) => void`                                                                                                                | —                                      |         | Instance callbacks (`AbstractCropperInstance.ts:112-126`)                                                    |
| `getInstance`                                                                                                                                                                                                        | `() => instance`                                                                                                                   | —                                      |         | Accepted by the type but **overwritten** by `useAbstractCropper.ts:56-61`                                    |

The docs list `imageClassName`, `stretchAlgorithm`, and `flip/rotate/zoom/moveImageAlgorithm` as Cropper
props (`example/docs/components/Cropper.mdx:61,469,678-711`). **None of them exist** in 0.20.2 or core 0.17.1.
`stretchAlgorithm` only works through `boundaryProps`. Port the code, not the docs.

**3. DOM and classes.** See tree §1.1. AbstractCropper itself renders no DOM element. It assigns:

- wrapper: `className = cn('advanced-cropper', className)` (`:165`)
- boundary: `cn('advanced-cropper__boundary', boundaryClassName)` (`:173`)
- background wrapper: `'advanced-cropper__background-wrapper'` (`:179`, fixed)
- background: `cn('advanced-cropper__background', backgroundClassName)` (`:187`)
- styled by `styles/AbstractCropper.scss`. `.advanced-cropper` is the flex column, overflow hidden, black background, white text;
  `__boundary` is flex-grow; `__background-wrapper` is absolutely positioned and fills its parent.

**4. Refs / imperative API.** `useImperativeHandle(ref, () => cropper)` (`:154`). It has no deps array, so the
handle is replaced on every render. The typed interface `AbstractCropperRef` (`:42-72`) has 29 members:
`reset, refresh, clear, setCoordinates, setState, setImage, flipImage, zoomImage, rotateImage, reconcileState,
moveImage, moveCoordinates, moveCoordinatesEnd, resizeCoordinates, resizeCoordinatesEnd, transformImage,
transformImageEnd, getCoordinates, getVisibleArea, getTransforms, getStencilCoordinates, getDefaultState,
getCanvas, getSettings, getImage, getState, getTransitions, isLoading, isLoaded`.
The **runtime** object (`useAbstractCropper.ts:117-168`) also has `setVisibleArea`, `startTransitions`,
`hasInteractions`, and `getInteractions` (33 total). The stencils depend on `getInteractions` and `hasInteractions`. `reset` and
`refresh` return `Promise<void>`.

Internal refs: `refs.boundary` (StretchableBoundary methods), `refs.image` (background DOM element),
`refs.canvas` (`CropperCanvas.draw`), and `stencilRef` (stencil options).

**5. Events.** None directly. `useAbstractCropper` registers `window` `resize` and `orientationchange`
(`useWindowResize.ts:16-24`), which call `refreshCropper()`.

**6. Customization points.** These are the five component props in the table. Each one's prop contract:

- `wrapperComponent`: `{...wrapperProps, disabled, className, cropper, style, loading, loaded, children}`.
  It must render `children` and apply `className` and `style` to its root for the base CSS to work.
- `boundaryComponent`: `{...boundaryProps, className, children}`, plus a ref exposing
  `stretchTo(size: Size|null): Promise<Size|null>` and `reset(): void`.
- `backgroundWrapperComponent`: `{...backgroundWrapperProps, disabled, cropper, className, children}`.
  It is expected to translate gestures into `cropper.transformImage` and `transformImageEnd`.
- `backgroundComponent`: `{...backgroundProps, crossOrigin, cropper, className}`, plus a ref to the drawable element.
- `stencilComponent`: `{...stencilProps, disabled, cropper, image}`, plus a ref exposing stencil options
  (`aspectRatio`, optionally `boundingBox` or anything the user's `stencilConstraints` reads).

**7. React mechanics.**

- `createCropper` exists only for the generic `forwardRef` typing.
- `stencilRef.current` is read lazily inside the persistent settings closure, so the handle is current
  whenever the core asks.
- `{cropper.getState() && <Background/>}`: the image element isn't mounted until a state exists, so
  `refs.image` stays null until then.
- Ordering in `useAbstractCropper` (hooks study). `setCurrentImage(image, cb)` (`useStateWithCallback`)
  runs `cropper.reset(boundary, image)` **after** React commits the new `image`, so the stencil and background
  render against the new image first. `useCropperAutoReconcile` runs a `useLayoutEffect` with no deps
  that calls `reconcileState()` after every render when idle, and pauses during reset and refresh.

**8. Svelte mapping.** File `src/lib/components/AbstractCropper.svelte`. Internal; do not export from index.

- Props: `let { settings, stencilComponent: Stencil = RectangleStencil, stencilProps = {}, stencilConstraints = defaultStencilConstraints,
  wrapperComponent: Wrapper = CropperWrapper, wrapperProps = {}, backgroundWrapperComponent: BackgroundWrapper = CropperBackgroundWrapper,
  backgroundWrapperProps = {}, backgroundComponent: Background = CropperBackgroundImage, backgroundProps = {}, backgroundClassName,
  boundaryComponent: Boundary = StretchableBoundary, boundaryProps, boundaryClassName, className, class: klass, style,
  canvas = true, crossOrigin = true, disabled, ...parameters } = $props();`
  Renaming during destructuring gives capitalized identifiers, so `<Stencil …/>` renders dynamically. In Svelte 5, components
  are dynamic by default, so `<svelte:component>` is not needed.
- Customization points stay **component props**, not snippets:
  - Parity: users write `stencilComponent={CircleStencil}`, and Svelte 5 components are plain values.
  - The stencil, boundary, and background need an **imperative surface** (`bind:this` exports or `bind:ref`).
    A snippet has no instance, no exports, and no `bind:`.
  - The wrapper components receive `children`, which becomes a Svelte `children` snippet. Custom wrappers implement
    `{@render children?.()}`. That is the one place snippets appear.
  - Optional extra (not parity): snippet overrides such as `wrapper?: Snippet<[WrapperProps]>` could be added
    later. Do not add them now.
- Imperative API: `export function reset() {…}`, `refresh`, …, all 33 runtime members, typed as
  `AbstractCropperRef` extended with the 4 extras. A shared `createCropperApi(...)` in a `.svelte.ts` module
  builds the object once. The component then does `export const getState = api.getState;` and so on, one line per member.
  Svelte requires exports to be statically declared. Do **not** rebuild the API on every update.
- Refs: `let boundary = $state<StretchableBoundaryMethods>()` with `<Boundary bind:this={boundary} …>`;
  `let imageElement = $state<HTMLElement|null>(null)` with `<Background bind:ref={imageElement} …>`; `let canvasApi` with
  `<CropperCanvas bind:this={canvasApi}/>`; `let stencilInstance` with `<Stencil bind:this={stencilInstance}/>`.
- Settings closure: the core instance gets `getProps = () => ({ ...parameters, crossOrigin, canvas, stencilProps,
  settings: { ...settings, ...stencilConstraints(settings, { ...stencilProps, ...stencilInstance }) } })`.
  Reading `$props` inside a function always sees current values, so `usePersistentFunction` is unnecessary.
  Wrap with `untrack` if it is ever called from inside a `$derived`/`$effect` to avoid accidental dependency capture.
- `useWindowResize` becomes `<svelte:window onresize={refresh} onorientationchange={refresh} />`. Both
  are typed for `<svelte:window>` (`node_modules/svelte/elements.d.ts:1503`), aren't delegated, and are cleaned up automatically.
- Do **not** port: `deprecatedWrapperProps` (`loading` and `loaded` are deprecated; pass them for parity only if cheap),
  `forceRerender`, the new handle object on every render, or `createCropper`.

### 4.2 Cropper — `src/components/croppers/Cropper.tsx`

**1. Purpose.** The public default cropper. It splits flat props into `settings` and `props`
(§2.5) and renders `AbstractCropper`.

**2. Props.** `CropperProps<Extension = {}> = CustomCropperProps<Extension>` (`:16`; `types.ts:58-62`):
`AbstractCropperIntrinsicProps<ExtendedSettings<E>>` (all AbstractCropper props except `settings`)
plus every `AbstractCropperSettings` key as an **optional flat prop** (`minWidth`, `maxWidth`, `minHeight`, `maxHeight`,
`imageRestriction`, `defaultSize`, `defaultPosition`, `defaultCoordinates`, `defaultVisibleArea`, `defaultTransforms`,
`priority`, `aspectRatio`, `sizeRestrictions`, `positionRestrictions`, `areaSizeRestrictions`,
`areaPositionRestrictions`, `transformImage`, `moveCoordinates`, `resizeCoordinates`) plus the extension's keys.
Deprecated (dead, §2.5): `stencilSize`, `autoZoom`.

**3. DOM.** None of its own. Same as AbstractCropper.

**4. Refs.** `forwardRef` passes `ref` through to AbstractCropper. `CropperRef<E> = CustomCropperRef<E> = AbstractCropperRef<ExtendedSettings<E>>`.
`displayName = 'CropperComponent'` (`:60`).

**5–6.** None of its own.

**7. React mechanics.** `useDeprecationWarning` (a `useRef` list that de-duplicates messages; `deprecationWarning` only in
`NODE_ENV === 'development'`). It mutates `intrinsicProps.postProcess` in render (`:39`), which is dead in practice.

**8. Svelte mapping.** `src/lib/components/croppers/Cropper.svelte`.

- `let { ...all } = $props(); const split = $derived(splitCropperProps(all, DEFAULT_SETTINGS));`
  then `<AbstractCropper bind:this={inner} {...split.props} settings={split.settings} />`.
- Re-export the API: `export function getState() { return inner?.getState() ?? null }` and so on for every member.
  Or generate the forwarding functions once from a key list in a `.svelte.ts` helper, then
  `export const reset = api.reset` (one line each). Forwarders that just call `inner` are simplest.
- `bind:this` on `<Cropper>` gives users `cropper.getCoordinates()`, the analogue of `ref.current`.
- Drop the dead deprecation branch. Optionally warn in dev (`import { DEV } from 'esm-env'` or
  `import.meta.env.DEV`) if `stencilSize`/`autoZoom` are passed.

### 4.3 FixedCropper — `src/components/croppers/FixedCropper.tsx`

**1. Purpose.** A cropper whose stencil has a fixed on-screen size (`stencilSize`). The image moves and zooms
under the stencil.

**2. Props.** `FixedCropperProps = Omit<CustomCropperProps<FixedCropperSettings>, 'sizeRestrictions' | 'aspectRatio'>`
(`:16-22`). `FixedCropperSettings { stencilSize: StencilSize<this> }` (`:18-20`). `StencilSize` is
`Size | ((state, settings) => Size)` (`extensions/stencil-size/index.ts:25-27`). `stencilSize` is **required**
by the type. The `Omit` is type-only: at runtime a passed `aspectRatio` or `sizeRestrictions` still lands in settings and
overrides the extension defaults.

Applied defaults (`:29-42`):

| What                                    | Value                                               | User-overridable?               |
| --------------------------------------- | --------------------------------------------------- | ------------------------------- |
| `postProcess`                           | `fixedStencil`                                      | yes (props spread after)        |
| `stencilConstraints`                    | `fixedStencilConstraints`                           | yes                             |
| `settings.defaultSize`                  | `defaultSize` (extension)                           | yes                             |
| `settings.aspectRatio`                  | `aspectRatio` (extension, derived from stencilSize) | yes at runtime, not by type     |
| `settings.sizeRestrictions`             | `withDefaultSizeRestrictions(sizeRestrictions)`     | yes at runtime, not by type     |
| `settings.transformImage.adjustStencil` | `false`                                             | **no**, forced after the spread |

**3–6.** No DOM of its own. `ref` is forwarded. `displayName = 'FixedCropper'`.

**7.** Uses `useAbstractCropperProps(props, [...defaultSettings, 'stencilSize'])`.

**8. Svelte mapping.** `src/lib/components/croppers/FixedCropper.svelte`. It is the same as Cropper but with the
`stencilSize` key added to the settings list and the defaults above. Forward the API the same way. Put the
forwarding in one shared helper so Cropper and FixedCropper don't duplicate 33 export lines. Note that
`export const x = helper.x` still has to be written per name.

---

## 5. Stencils

### 5.1 RectangleStencil — `src/components/stencils/RectangleStencil.tsx`

**1. Purpose.** The default stencil. It is rendered by AbstractCropper inside the background wrapper. It positions itself with
`getStencilCoordinates(state)` (visible-area → boundary pixels) and composes BoundingBox (resize),
DraggableArea (move), StencilOverlay (mask), and the optional StencilGrid.

**2. Props** (`:53-79`, defaults `:85-128`).

| Prop                                                                                                      | Type                                                                                                                                                           | Default         | Behaviour                                                                   |
| --------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- | --------------------------------------------------------------------------- |
| `cropper`                                                                                                 | `DesiredCropperRef` (getState, getTransitions, getInteractions, hasInteractions, resizeCoordinates, resizeCoordinatesEnd, moveCoordinates, moveCoordinatesEnd) | **required**    | Injected by AbstractCropper                                                 |
| `coordinates`                                                                                             | `Coordinates \| ((state: CropperState \| null) => Coordinates)`                                                                                                | —               | Override the stencil box (else `getStencilCoordinates(state)`)              |
| `aspectRatio`                                                                                             | `RawAspectRatio`                                                                                                                                               | —               | Exposed via ref (normalized)                                                |
| `minAspectRatio` / `maxAspectRatio`                                                                       | `number`                                                                                                                                                       | —               | Used if `aspectRatio` is falsy                                              |
| `handlerComponent`                                                                                        | `FC<any>`                                                                                                                                                      | `SimpleHandler` | Passed to BoundingBox                                                       |
| `handlers`                                                                                                | `Partial<Record<OrdinalDirection, boolean>>`                                                                                                                   | all 8 `true`    | Which handlers render                                                       |
| `handlerClassNames`                                                                                       | `HandlerClassNames` (`{default?, disabled?, hover?, [ordinal]?}`)                                                                                              | `{}`            | → BoundingBox                                                               |
| `handlerWrapperClassNames`                                                                                | same                                                                                                                                                           | `{}`            | → BoundingBox                                                               |
| `lines`                                                                                                   | `Partial<Record<CardinalDirection, boolean>>`                                                                                                                  | all 4 `true`    |                                                                             |
| `lineComponent`                                                                                           | `FC<any>`                                                                                                                                                      | `SimpleLine`    |                                                                             |
| `lineClassNames` / `lineWrapperClassNames`                                                                | `LineClassNames` (`{default?, disabled?, hover?, [cardinal]?}`)                                                                                                | `{}`            |                                                                             |
| `className`                                                                                               | `string`                                                                                                                                                       | —               | Root                                                                        |
| `movingClassName` / `resizingClassName`                                                                   | `string`                                                                                                                                                       | —               | Added while `interactions.moveCoordinates` / `.resizeCoordinates` is active |
| `gridClassName`, `previewClassName`, `boundingBoxClassName`, `overlayClassName`, `draggableAreaClassName` | `string`                                                                                                                                                       | —               | Sub-element classes                                                         |
| `movable`                                                                                                 | `boolean`                                                                                                                                                      | `true`          | `moveAllowed = movable && !disabled`                                        |
| `resizable`                                                                                               | `boolean`                                                                                                                                                      | `true`          | `resizeAllowed = resizable && !disabled`                                    |
| `grid`                                                                                                    | `boolean`                                                                                                                                                      | `undefined`     | Render StencilGrid                                                          |
| `disabled`                                                                                                | `boolean`                                                                                                                                                      | —               | Injected by AbstractCropper (overrides stencilProps)                        |

Not declared but injected: `image` (AbstractCropper `:190`) and `ref`. RectangleStencil ignores `image`.

**3. DOM.** `state && (...)` (`:176-177`): it renders nothing (`null`) until state exists.

```
div  .advanced-cropper-artificial-transition .advanced-cropper-stencil-wrapper            (ArtificialTransition/StencilWrapper)
     .advanced-cropper-rectangle-stencil .{className} .{movingClassName?} .{resizingClassName?}
     .advanced-cropper-rectangle-stencil--movable   (moveAllowed)
     .advanced-cropper-rectangle-stencil--moving    (interactions.moveCoordinates)
     .advanced-cropper-rectangle-stencil--resizable (resizeAllowed)
     .advanced-cropper-rectangle-stencil--resizing  (interactions.resizeCoordinates)
     .advanced-cropper-rectangle-stencil--disabled  (disabled)
     style="left:0;top:0;width:Wpx;height:Hpx;transform:translate3d(Lpx,Tpx,0px)"
  div .advanced-cropper-bounding-box .{boundingBoxClassName} .advanced-cropper-rectangle-stencil__bounding-box
    div .advanced-cropper-draggable-element .advanced-cropper-rectangle-stencil__draggable-area .{draggableAreaClassName}
      div .advanced-cropper-stencil-overlay .advanced-cropper-rectangle-stencil__overlay .{overlayClassName}
        [grid] div .advanced-cropper-stencil-grid [--visible] .advanced-cropper-rectangle-stencil__grid .{gridClassName}
        div .advanced-cropper-rectangle-stencil__preview .{previewClassName}
    div  (lines …)
    div  (handlers …)
```

Styled by `styles/stencils/RectangleStencil.scss` (absolute, 100%×100%, `--movable {cursor: move}`), plus
the service SCSS files of the children.

**4. Refs.** `useImperativeHandle(ref, () => ({ aspectRatio: createAspectRatio(aspectRatio || {minimum: minAspectRatio, maximum: maxAspectRatio}) }))`
(`:137-144`). No deps, so it is recomputed every render.

**5. Events.** No DOM listeners of its own. Callbacks into the cropper:

- `onMove(directions)` → `cropper.moveCoordinates(directions)` if `moveAllowed` (`:146-150`)
- `onMoveEnd()` → `cropper.moveCoordinatesEnd()` (always) (`:152-156`)
- `onResize(anchor, directions, options)` → `cropper.resizeCoordinates(...)` if `resizeAllowed` (`:158-162`)
- `onResizeEnd()` → `cropper.resizeCoordinatesEnd()` (always) (`:164-168`)

The BoundingBox receives `disabled={!resizeAllowed}` and the DraggableArea receives `disabled={!moveAllowed}`.

**6. Customization.** `handlerComponent` and `lineComponent` (contracts in §6.1/§6.2). The grid has 3×3 cells, or 9×9 while
`interactions.transformImage.rotate` is active (`:225-226`). The grid is visible only while `cropper.hasInteractions()`.

**7. React mechanics.** Nothing special. Plain recomputation every render driven by the whole-tree rerender.
`forwardRef` is used only to expose options.

**8. Svelte mapping.** `src/lib/components/stencils/RectangleStencil.svelte`.

- `const state = $derived(cropper.getState())`, `transitions`, `interactions`, `moveAllowed`, `resizeAllowed`,
  and `box = $derived(coordinates ? (isFunction(coordinates) ? coordinates(state) : coordinates) : getStencilCoordinates(state))`.
- `{#if state}<StencilWrapper …>…{/if}`.
- `export function aspectRatio() { … }` (§2.4). This is a function, not a value, so it stays live.
- Rectangle and Circle are about 95% identical. Factor out an internal `StencilFrame.svelte` (prefix
  `'rectangle' | 'circle'`) to share markup, or accept the duplication for 1:1 readability. Either is fine;
  the DOM must be identical.
- Class merging: native `class={[…]}` for DOM nodes. `cn()` strings for props passed to BoundingBox, DraggableArea,
  StencilOverlay, and StencilGrid, which are component props.

### 5.2 CircleStencil — `src/components/stencils/CircleStencil.tsx`

Identical to RectangleStencil except:

- **No** `aspectRatio`, `minAspectRatio`, or `maxAspectRatio` props (`:52-75`).
- Default `handlers` are the 4 corners only: `eastNorth, westNorth, westSouth, eastSouth` (`:87-92`).
- Imperative handle `{ aspectRatio: 1, boundingBox: 'circle' }` (`:126-129`). `boundingBox` is not in the TS type (§2.3).
- Class prefix `advanced-cropper-circle-stencil` with the same modifiers and elements (`:164-215`).
- `handlerComponent`/`lineComponent` typed `ComponentType<any>` rather than `FC<any>`.
- CSS `styles/stencils/CircleStencil.scss`. `__overlay` and `__preview` get `border-radius:50%`, the overlay gets `overflow:hidden`, and the root
  uses `box-sizing: content-box` (Rectangle uses `border-box`). `themes/default.scss` adds a `__preview` border.

**Svelte:** `CircleStencil.svelte`, with `export const aspectRatio = 1; export const boundingBox = 'circle';`.

---

## 6. Handlers and lines

### 6.1 SimpleHandler — `src/components/handlers/SimpleHandler.tsx`

**1. Purpose.** The default `handlerComponent`. BoundingBox renders one per enabled ordinal or cardinal handler.

**2. Props** (`:6-16`). This is the **handler contract**: BoundingBox passes exactly these props
(`BoundingBox.tsx:256-264`).

| Prop                 | Type                                                               | Default | Behaviour                                                                    |
| -------------------- | ------------------------------------------------------------------ | ------- | ---------------------------------------------------------------------------- |
| `defaultClassName`   | `string`                                                           | —       | Handler element class (`handlerClassNames.default` + `[name]`)               |
| `hoverClassName`     | `string`                                                           | —       | Added while hovered (`handlerClassNames.hover`)                              |
| `wrapperClassName`   | `string`                                                           | —       | Wrapper class (BoundingBox `__handler` classes + `handlerWrapperClassNames`) |
| `wrapperStyle`       | `CSSProperties`                                                    | —       | Wrapper style. **Never passed** by BoundingBox; usable only for direct use   |
| `verticalPosition`   | `VerticalCardinalDirection` (`'north'\|'south'`)                   | —       | BoundingBox passes `null` for pure horizontals                               |
| `horizontalPosition` | `HorizontalCardinalDirection` (`'east'\|'west'`)                   | —       | `null` for pure verticals                                                    |
| `disabled`           | `boolean`                                                          | —       |                                                                              |
| `onMove`             | `(shift: MoveDirections, event: TouchEvent \| MouseEvent) => void` | —       | Drag delta                                                                   |
| `onMoveEnd`          | `() => void`                                                       | —       |                                                                              |

**3. DOM.**

```
div .advanced-cropper-simple-handler-wrapper .{wrapperClassName}
    .advanced-cropper-simple-handler-wrapper--{vertical}  .--{horizontal}  .--{horizontal}-{vertical}  [.--hover]
    .advanced-cropper-handler-wrapper .advanced-cropper-handler-wrapper--{snake-pos} [.advanced-cropper-handler-wrapper--disabled]   (HandlerWrapper)
    style={wrapperStyle}
  div .advanced-cropper-draggable-element .advanced-cropper-handler-wrapper__draggable                                            (DraggableElement)
    div .advanced-cropper-simple-handler [--hover] .{defaultClassName} [.{hoverClassName}]
        .advanced-cropper-simple-handler--{vertical} .--{horizontal} .--{horizontal}-{vertical}
```

CSS: `styles/handlers/SimpleHandler.scss` (`display:block`), `styles/service/HandlerWrapper.scss`, and themes.
The wrapper's `--hover` modifier exists on handler wrappers but **not** on line wrappers (§6.2).

**4. Refs.** None.

**5. Events.** Hover state (`useState`) toggled by HandlerWrapper's `onEnter`/`onLeave` (from DraggableElement);
drag events are passed through as `onDrag={onMove}` and `onDragEnd={onMoveEnd}`.

**6. Customization.** It is itself the customization point. A custom handler receives the props above.

**7. React mechanics.** `useState(hover)`.

**8. Svelte.** `src/lib/components/handlers/SimpleHandler.svelte`. `let hover = $state(false)`. Native `class={[…]}` on the
inner div. Pass `className={cn(…)}` to HandlerWrapper. `wrapperStyle?: string`.

### 6.2 SimpleLine — `src/components/lines/SimpleLine.tsx`

**2. Props** (`:6-14`). This is the **line contract** (`BoundingBox.tsx:241-250`): `defaultClassName?`, `hoverClassName?`,
`wrapperClassName?`, `position?: CardinalDirection`, `disabled?`, `onMove?(directions, event)`, `onMoveEnd?()`.

**3. DOM.**

```
div .advanced-cropper-draggable-element                                  (DraggableElement root = LineWrapper)
    .advanced-cropper-line-wrapper .advanced-cropper-line-wrapper--{position} [.advanced-cropper-line-wrapper--disabled]
    .advanced-cropper-simple-line-wrapper .{wrapperClassName} .advanced-cropper-simple-line-wrapper--{position}
  div .advanced-cropper-line-wrapper__content .advanced-cropper-line-wrapper__content--{position}
    div .advanced-cropper-simple-line [--hover] .{defaultClassName} [.{hoverClassName}] .advanced-cropper-simple-line--{position}
```

CSS: `styles/lines/SimpleLine.scss` (border-width per side), `styles/service/LineWrapper.scss`, and `themes/default.scss`
(`--hover` border color, `transition: border 0.5s`).

**4–7.** No refs. Hover `useState`, same as SimpleHandler. LineWrapper has no wrapper element of its own: the
DraggableElement _is_ the root (§8.12).

**8. Svelte.** `src/lib/components/lines/SimpleLine.svelte`, mirroring SimpleHandler.

---

## 7. Helpers (preview)

### 7.1 CropperPreview — `src/components/helpers/CropperPreview.tsx`

**1. Purpose.** A standalone component, not rendered by the croppers, that shows the cropped area at
any size. It can be driven three ways (`:104-112`). In priority order:

1. `cropper` prop: a **React RefObject** to a cropper (`cropper={cropperRef}`).
2. An instance pushed imperatively via `ref.update(cropperInstance)` (stored in `internalInstance`).
3. Static props `state`, `image`, `transitions`, `loaded`, and `loading`, wrapped into an ad-hoc
   `{getState, getTransitions, getImage, isLoaded, isLoading}` object.

**2. Props** (`:55-73`, defaults `:77-95`).

| Prop                  | Type                                                                  | Default                    | Behaviour                                                                           |
| --------------------- | --------------------------------------------------------------------- | -------------------------- | ----------------------------------------------------------------------------------- |
| `cropper`             | `RefObject<DesiredCropperRef \| null>`                                | —                          | Live cropper via ref object                                                         |
| `state`               | `CropperState \| null`                                                | `null`                     | Static mode                                                                         |
| `image`               | `CropperImage \| null`                                                | `null`                     | Static mode                                                                         |
| `transitions`         | `CropperTransitions \| null`                                          | `null`                     | Static mode                                                                         |
| `loaded`              | `boolean`                                                             | `true`                     | Static mode (drives the fade)                                                       |
| `loading`             | `boolean`                                                             | `false`                    | Static mode                                                                         |
| `className`           | `string`                                                              | —                          | Root (wrapper)                                                                      |
| `contentClassName`    | `string`                                                              | —                          | `__content` div                                                                     |
| `backgroundComponent` | `ComponentType<{cropper:any; size: Size\|null; className?}>`          | `CropperPreviewBackground` |                                                                                     |
| `backgroundProps`     | `ArbitraryProps`                                                      | —                          | Spread **first**                                                                    |
| `backgroundClassName` | `string`                                                              | —                          | Merged with `advanced-cropper-preview__image`                                       |
| `boundaryComponent`   | `CropperBoundaryComponent`                                            | `StretchableBoundary`      | Needs `stretchTo` via ref; receives `stretchAlgorithm`                              |
| `boundaryProps`       | `ArbitraryProps`                                                      | —                          | Spread **after** `stretchAlgorithm`, so it can override it (unlike AbstractCropper) |
| `boundaryClassName`   | `string`                                                              | —                          |                                                                                     |
| `wrapperComponent`    | `ComponentType<{cropper:any; className?; style?; loading?; loaded?}>` | `CropperPreviewWrapper`    | (`loading`/`loaded` are typed but **not passed**)                                   |
| `wrapperProps`        | `ArbitraryProps`                                                      | —                          | Spread first                                                                        |
| `style`               | `CSSProperties`                                                       | —                          | Wrapper root                                                                        |

**3. DOM.** See §1.3. The content div gets an inline `{width:'Wpx', height:'Hpx'}` once a size is known
(`:120-125`). The image gets `advanced-cropper-preview__image--visible` only when `src` is truthy (`:195`).
CSS: `styles/helpers/CropperPreview.scss`, `styles/helpers/CropperPreviewWrapper.scss`, `styles/service/StretchableBoundary.scss`, and `CropperFade.scss`.

**4. Refs.** `CropperPreviewRef { refresh(): void; update(cropper?): void }` (`:36-39,155-165`).
`update(c)` stores `c` (or clears it) in `internalInstance` and refreshes.

**5. Events.** `useWindowResize(refresh)` (`:151`) registers window `resize` and `orientationchange`.
`refresh()` (`:127-149`) calls `boundaryRef.current.stretchTo(coordinates)` and then sets `size` so the content box fits the
coordinates' ratio inside the stretched boundary. It then calls `rerender()`.

**6. Customization.** `wrapperComponent` gets `{...wrapperProps, className, cropper: instance.current, style, children}`.
`boundaryComponent` gets `{ref, stretchAlgorithm: stretchPreviewBoundary, ...boundaryProps, className, children}`.
`backgroundComponent` gets `{...backgroundProps, cropper, size, className}`.

**7. React mechanics.**

- `useForceRerender` in `refresh`: the cropper lives in a _ref_, so React wouldn't re-render the preview when
  the cropper changes. Users must call `previewRef.current.update(cropper)` from the Cropper's `onUpdate`, or
  pass the ref and rely on parent re-renders. That is the reason `update()` exists at all.
- `useLayoutEffect(refresh, [coordinates?.height, coordinates?.width])` (`:153`) re-stretches before paint
  when the crop's size changes. Position changes don't need re-stretching.

**8. Svelte mapping.** `src/lib/components/helpers/CropperPreview.svelte`.

- `cropper` prop: accept the **instance itself** (what `bind:this` gives on `<Cropper>`). For parity
  with copied React code, also accept `{ current }`: `const source = $derived(cropper && 'current' in cropper ? cropper.current : cropper)`.
- `let internalInstance = $state<DesiredCropperRef|null>(null)`. `const instance = $derived(source ?? internalInstance ?? staticInstance)`
  where `staticInstance` is an object whose getters read the static props.
- Because `getState()` and the other getters read `$state` in the Svelte cropper instance, the preview updates
  **automatically**. `export function update(c?)` and `export function refresh()` stay for parity, but
  `rerender()` is dropped.
- `let size = $state<Size|null>(null)`. Use `$effect(() => { coordinates?.width; coordinates?.height; untrack(refresh); })`
  for the layout-effect behaviour. Svelte `$effect` runs after DOM update and before paint in practice; `$effect.pre`
  is wrong here because the boundary must already be in the DOM to be measured.
- `<svelte:window onresize={refresh} onorientationchange={refresh}/>`.
- `boundary` via `bind:this`. `stretchTo` is async (a Promise), so guard against stale results.

### 7.2 CropperPreviewBackground — `src/components/helpers/CropperPreviewBackground.tsx`

**2. Props** (`:12-18`): `className?`, `cropper: {getState, getTransitions, getImage}` (**required**),
`crossOrigin?: 'anonymous'|'use-credentials'|boolean` (default `true`), `size?: Size|null`, `style?: CSSProperties`.
CropperPreview never passes `crossOrigin`, so it is always `'anonymous'` unless set via `backgroundProps`.

**3. DOM.** `src ? <img key={src} class="advanced-cropper-background-image {className}" src crossOrigin style onMouseDown={preventDefault}/> : null`.
Style is `getPreviewStyle(image, state, size, transitions)` (only if `size && image && state.coordinates`) merged with the user style.
`crossOrigin` maps `true` → `'anonymous'` and `false` → `undefined` (`:40`). CSS: `CropperBackgroundImage.scss` and `CropperPreview.scss` `__image`.

**4–7.** No ref, unlike CropperBackgroundImage. `key={src}` forces a fresh `<img>` per source.
`onMouseDown={preventDefault}` blocks the native image drag ghost.

**8. Svelte.** `CropperPreviewBackground.svelte`: `{#if src}{#key src}<img … onmousedown={preventDefault} />{/key}{/if}`.
Accept an optional bindable `ref` for symmetry with CropperBackgroundImage (harmless). The style string is
`styleToString(getPreviewStyle(...)) + user style`.

### 7.3 CropperPreviewWrapper — `src/components/helpers/CropperPreviewWrapper.tsx`

**2. Props** (`:9-14`): `cropper?: {isLoaded(): boolean}`, `className?`, `style?`, `children?`.
**3. DOM.** `div.{className}.cropper-preview-wrapper[style]` > `CropperFade(visible = cropper?.isLoaded(), className 'cropper-preview-wrapper__fade')` > children.
CSS: `styles/helpers/CropperPreviewWrapper.scss`.
**8. Svelte.** `CropperPreviewWrapper.svelte` with `children: Snippet`. Keep the unprefixed `cropper-preview-wrapper` class (parity).

---

## 8. Service components

### 8.1 ArtificialTransition — `src/components/service/ArtificialTransition.tsx` (not exported)

**1. Purpose.** The animated absolutely-positioned box used by StencilWrapper. It interpolates
`left/top/width/height` with the core `Animation` class when `transitions.active`, so the stencil animates in
sync with the background image's CSS transition.

**2. Props** (`:6-14`): `className?`, `transitions?: CropperTransitions`, `width?`, `height?`, `left?`, `top?` (numbers, px),
`children?`.

**3. DOM.** `div.advanced-cropper-artificial-transition.{className}` with inline style
`{left:0, top:0, width:'Wpx', height:'Hpx', transform:'translate3d(Lpx,Tpx,0px)'}` (`:58-66`).
CSS: `styles/service/ArtificialTransition.scss` (`will-change: transform`).

**4–5.** Internal `root` ref only. No listeners. `requestAnimationFrame` runs through `Animation` (`tmp/advanced-cropper/src/animation/index.ts:24-80`).

**7. React mechanics (the tricky part).**

- `useTransition(transitions)` (`hooks/useTransition.ts:4-29`) keeps one `Animation` in a ref plus an `active` state. `run(cb)`
  starts the animation if `transitions.active` (`onStart → setActive(true)`, `onProgress → cb(p)`, `onStop → setActive(false)`).
  Otherwise, if no animation is running, it calls `cb(1)` immediately.
- `useLayoutEffect` (`:25-56`), keyed on the 4 values plus `rememberedValues` and `transitionsActive`. When the values
  change (`deepCompare`), it remembers them. The start point is the **current interpolated values** if an
  animation is in flight, otherwise the previously remembered values. Each animation frame writes **directly to
  `root.current.style`**, bypassing React rendering for 60fps updates.
- The render reads `transitionsActive ? transitionValues.current : values`. While animating, React re-renders
  write the interpolated values back rather than clobbering the in-flight animation.

**8. Svelte mapping.** `src/lib/components/service/ArtificialTransition.svelte` (internal).

- Simpler and idiomatic: `let current = $state({left, top, width, height})`, with the template rendering from `current`
  via `style:width="{current.width}px"` and `style:transform=…`. Animation frames assign `current.x = …`. Svelte's
  fine-grained updates touch only these 2–3 style properties, so you don't need to write `node.style` directly or deal with
  the dual-source logic.
- `$effect` tracking `width/height/left/top` (and `transitions`): `untrack` everything else. If the values differ
  from `remembered`, start the animation from `current` when active, otherwise from `remembered`. Use the core `Animation` class.
- Use `$effect` rather than `$effect.pre`. The first frame must not flash. Because the template renders
  `current`, and `current` only changes inside the animation callback (or immediately via `cb(1)`, which runs synchronously
  inside the effect before paint), no flash occurs.
- Cancel the animation on destroy. The upstream doesn't: `Animation` keeps running rAF after unmount, which is harmless
  but sloppy. Add a `stop()` in the `$effect` cleanup only on teardown, not on every re-run, or the in-flight interpolation would break.

### 8.2 BoundingBox — `src/components/service/BoundingBox.tsx` (exported)

**1. Purpose.** Renders the stencil's children plus line and handler components around a box, and turns their drags
into `onResize(anchor, directions, options)`. Used by both stencils.

**2. Props** (`:38-54`, defaults `:88-118`).

| Prop                       | Type                                                                                 | Default         | Behaviour                                                                                                |
| -------------------------- | ------------------------------------------------------------------------------------ | --------------- | -------------------------------------------------------------------------------------------------------- |
| `style`                    | `CSSProperties`                                                                      | —               | Root                                                                                                     |
| `className`                | `string`                                                                             | —               | Root                                                                                                     |
| `handlerComponent`         | `FC<any>`                                                                            | `SimpleHandler` |                                                                                                          |
| `handlers`                 | `boolean \| Partial<Record<OrdinalDirection, boolean>>`                              | all 8 `true`    | `true`/`false` toggles all                                                                               |
| `handlerClassNames`        | `{default?, disabled?, hover?, [ordinal]?}`                                          | `{}`            | `default` + `[name]` → handler `defaultClassName`; `hover` → `hoverClassName`; **`disabled` is ignored** |
| `handlerWrapperClassNames` | same                                                                                 | `{}`            | `default` + `[name]` → `wrapperClassName`; **`disabled` and `hover` are ignored**                        |
| `lines`                    | `boolean \| Partial<Record<CardinalDirection, boolean>>`                             | all 4 `true`    |                                                                                                          |
| `lineComponent`            | `FC<any>`                                                                            | `SimpleLine`    |                                                                                                          |
| `lineClassNames`           | `{default?, disabled?, hover?, [cardinal]?}`                                         | `{}`            | `default` + `[name]` + (`disabled` when disabled) → `defaultClassName`; `hover` → `hoverClassName`       |
| `lineWrapperClassNames`    | same                                                                                 | `{}`            | `default` + `[name]` + (`disabled` when disabled) → `wrapperClassName`; `hover` is ignored               |
| `disabled`                 | `boolean`                                                                            | `false`         | Passed to each line/handler; suppresses `onResize`                                                       |
| `onResize`                 | `(anchor: ResizeAnchor, directions: MoveDirections, options: ResizeOptions) => void` | —               |                                                                                                          |
| `onResizeEnd`              | `() => void`                                                                         | —               |                                                                                                          |
| `reference`                | `Coordinates \| null`                                                                | `null`          | The stencil passes `state.coordinates`                                                                   |
| `children`                 | `ReactNode`                                                                          | —               |                                                                                                          |

**3. DOM** (`:236-276`).

```
div.advanced-cropper-bounding-box.{className}  style
  {children}
  div                              ← lines container (no class)
    <lineComponent> ×N   key=name, in order: east, west, south, north
  div                              ← handlers container (no class)
    div.advanced-cropper-bounding-box__handler-wrapper.advanced-cropper-bounding-box__handler-wrapper--{snake}  key=name
      <handlerComponent>  wrapperClassName = "advanced-cropper-bounding-box__handler advanced-cropper-bounding-box__handler--{snake} …"
```

The points order comes from `HORIZONTAL_DIRECTIONS = ['east','west',null]` × `VERTICAL_DIRECTIONS = ['south','north',null]`
(`:19-20,121-139`), skipping `(null,null)`. The order is **eastSouth, eastNorth, east, westSouth, westNorth,
west, south, north**. Lines are the cardinal subset: east, west, south, north. Line wrappers get
`advanced-cropper-bounding-box__line advanced-cropper-bounding-box__line--{name}`.
CSS: `styles/service/BoundingBox.scss`. The handler-wrapper positions are per snake-case direction, and so are lines.

**4.** No refs.

**5. Events / resize logic** (`:198-234`). `onHandlerMove(h, v)` returns `(directions, nativeEvent) => …`:

- `respectDirection = 'width'` for pure horizontal (h only) and `'height'` for pure vertical (v only).
- If `!disabled`, it calls `onResize(anchor = getDirectionNames(h, v).camelCase, {left, top}, { reference: lastReference || reference,
  preserveAspectRatio: nativeEvent && nativeEvent.shiftKey, respectDirection, compensate: true })`, and on the first move
  stores `lastReference = reference`. This freezes the starting coordinates for the whole drag.
- `onHandlerMoveEnd` calls `onResizeEnd?.()` and resets `lastReference = null`.

**7. React mechanics.** `useMemo` for points (static), lineNodes, and handlerNodes. Because the stencil passes fresh object
defaults each render, the memos rarely hit. `lastReference` is `useState`, but it is only read in handlers. It doesn't need to
trigger renders: it only does so because React has no better instance storage in function components besides `useRef`.

**8. Svelte mapping.** `src/lib/components/service/BoundingBox.svelte`.

- `const POINTS` is a module-level constant computed once (`<script module>` or a `.ts` helper).
- `const lineNodes = $derived(...)` and `const handlerNodes = $derived(...)`. Build class strings with `cn()`,
  since they are passed to replaceable components.
- `let lastReference: Coordinates | null = null` is a **plain non-reactive `let`**, because it is never rendered.
- `{#each lineNodes as line (line.name)}<line.component …/>{/each}`. `<line.component>` with a dot is
  valid dynamic-component syntax in Svelte 5. Alternatively, use `const Line = $derived(lineComponent)` once, since all lines share one component.
- `children: Snippet` → `{@render children?.()}`.

### 8.3 CropperBackgroundImage — `src/components/service/CropperBackgroundImage.tsx`

**1. Purpose.** The default `backgroundComponent`: the transformed source image behind the stencil.
**2. Props** (`:12-17`): `className?`, `cropper: {getState, getTransitions, getImage}` (**required**),
`crossOrigin?` (default `true`), `style?: CSSProperties`.
**3. DOM.** `src ? <img key={src} ref class="advanced-cropper-background-image {className}" src crossOrigin style onMouseDown={preventDefault}/> : null`
(`:29-42`). The style is `getBackgroundStyle(image, state, transitions)` (an object with
`width,height,left,top,transition,transform,willChange`) merged with the user style. With AbstractCropper's className the
element also gets `advanced-cropper__background`. CSS: `styles/service/CropperBackgroundImage.scss`
(`position:absolute; pointer-events:none; user-select:none; max-width:none !important`).
**4. Refs.** `forwardRef<HTMLImageElement>`. AbstractCropper stores it as `refs.image` and uses it in `getCanvas()` as the
`drawCroppedArea` source. `displayName` is set.
**5.** `onMouseDown={preventDefault}` (`service/events.ts:3-5`) suppresses native image dragging.
**7.** `key={src}` remounts the `<img>` when the source changes. That prevents a frame where the old bitmap appears with the
new geometry, and keeps `refs.image` pointing at the decoded element for the new src.
**8. Svelte.** `CropperBackgroundImage.svelte`. `let { ref = $bindable(null), cropper, className, crossOrigin = true, style } = $props()`.
`{#if src}{#key src}<img bind:this={ref} class={['advanced-cropper-background-image', className]} {src}
crossorigin={…} style={styleToString(bg) + (style ?? '')} onmousedown={preventDefault} />{/key}{/if}`.
Note that `crossorigin` is lower-case in Svelte HTML typings. When the `{#if}` closes, `bind:this` sets `ref` back to `null`,
which matches React's ref detach.

### 8.4 CropperBackgroundWrapper — `src/components/service/CropperBackgroundWrapper.tsx`

**1. Purpose.** The default `backgroundWrapperComponent`. It adapts the cropper to `TransformableImage`.
**2. Props** (`:15-25`).

| Prop                             | Type                                                                                     | Default                                        | Behaviour                                                                                                        |
| -------------------------------- | ---------------------------------------------------------------------------------------- | ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `cropper`                        | `{transformImage, transformImageEnd, getTransitions}`                                    | **required**                                   |                                                                                                                  |
| `scaleImage`                     | `boolean \| ScaleImageOptions` (`{touch?, wheel?: boolean \| {ratio?}, adjustStencil?}`) | `true`                                         | `getOptions` → `{touch, wheel}`. `true` gives `{touch:true, wheel:{ratio:0.1}}`; `adjustStencil` is dropped here |
| `moveImage`                      | `boolean \| MoveImageOptions` (`{touch?, mouse?}`)                                       | `true`                                         | → `{touch, mouse}`                                                                                               |
| `rotateImage`                    | `boolean \| RotateImageOptions` (`{touch?}`)                                             | `false`                                        | → `{touch}`                                                                                                      |
| `timeout`                        | `number`                                                                                 | `undefined` (TransformableImage default `500`) | Debounce for the transform-end gesture                                                                           |
| `disabled`                       | `boolean`                                                                                | —                                              |                                                                                                                  |
| `className`, `style`, `children` |                                                                                          |                                                | Passed through                                                                                                   |

**3. DOM.** Only what TransformableImage renders: `div.{className}[style]` (AbstractCropper's `advanced-cropper__background-wrapper`).
**5.** Wires `onTransform={cropper.transformImage}` and `onTransformEnd={cropper.transformImageEnd}`. It passes
`disabled={transitions.active || disabled}`, so gestures are ignored during transitions, and
`preventDefault={!disabled}`, so a disabled cropper does **not** swallow page scroll or touch.
**7.** `useMoveImageOptions`, `useScaleImageOptions`, and `useRotateImageOptions` are just `useMemo(getOptions(...))`
(`hooks/use*ImageOptions.ts`).
**8. Svelte.** `CropperBackgroundWrapper.svelte`. Use `$derived(getOptions(...))` for the three option sets. The hooks
`useMoveImageOptions` and the rest are public exports (`src/index.ts:29-31`), so ship them as plain functions (they need no reactivity).
`children: Snippet`.

### 8.5 CropperCanvas — `src/components/service/CropperCanvas.tsx`

**1. Purpose.** Two hidden canvases used by `getCanvas()` for drawing the crop result.
**2. Props.** None (`forwardRef((_, ref) …)`).
**3. DOM.** A fragment: `<canvas class="advanced-cropper-canvas"/>` ×2 (main and spare). CSS `styles/service/CropperCanvas.scss` (`display:none`).
**4. Refs.** `CropperCanvasMethods { draw(state, image: HTMLElement, options?: DrawOptions): HTMLCanvasElement | null }`
(`:4-6,12-26`) calls `drawCroppedArea(state, image, canvas, spareCanvas, options)`, or returns `null` if refs are missing.
**8. Svelte.** `CropperCanvas.svelte`: two `bind:this` canvases and `export function draw(...)`.

### 8.6 CropperFade — `src/components/service/CropperFade.tsx`

**2. Props:** `visible?: unknown` (coerced with `Boolean`), `className?`, `style?`, `children?`.
**3. DOM:** `div.{className}.advanced-cropper-fade[.advanced-cropper-fade--visible][style]`. CSS `styles/service/CropperFade.scss`
(`opacity`/`visibility` 0.5s transition, flex column).
**8. Svelte:** `CropperFade.svelte`. Keep `visible: unknown` and the `Boolean(visible)` coercion. Use a CSS transition rather than
`transition:` directives, because the element stays mounted.

### 8.7 CropperSource — `src/components/service/CropperSource.tsx`

**1. Purpose.** A hidden `<img>` source. Exported but **not used** by any React component (a Vue-cropper legacy).
**2. Props:** `HTMLAttributes<HTMLImageElement>` plus `src?: string | null` and `crossOrigin?` (default `true`).
**3. DOM:** `src ? <img key={src} ref src class="advanced-cropper-source" crossOrigin {...props}/> : null`.
`{...props}` comes **after** `className`, so a user `className` _replaces_ `advanced-cropper-source`. CSS `styles/service/CropperSource.scss`.
**4.** `forwardRef<HTMLImageElement>`.
**8. Svelte:** `CropperSource.svelte`, with `ref = $bindable(null)`, `...rest: HTMLImgAttributes`, and the spread placed last for the same precedence.

### 8.8 CropperWrapper — `src/components/service/CropperWrapper.tsx`

**1. Purpose.** The default `wrapperComponent`. It fades the cropper in once loaded.
**2. Props** (`:12-18`): `cropper?: {getState, isLoading, isLoaded}`, `className?`, `style?`, `children?`, `disabled?` (**ignored**).
**3. DOM:** `div.{className}.advanced-cropper-wrapper[style]` > `CropperFade(visible = state && loaded, className 'advanced-cropper-wrapper__fade')` > children.
With AbstractCropper the root becomes `div.advanced-cropper.{userClass}.advanced-cropper-wrapper`.
CSS `styles/service/CropperWrapper.scss` (`__fade {flex-grow:1; min-height:0}`) and `AbstractCropper.scss`.
**8. Svelte:** `CropperWrapper.svelte` with `children: Snippet` and `$derived(!!cropper?.getState() && !!cropper?.isLoaded())`.

### 8.9 DraggableArea — `src/components/service/DraggableArea.tsx`

A one-line alias: `export { DraggableElement as DraggableArea } from './DraggableElement'`.
**Svelte:** `DraggableArea.ts` → `export { default as DraggableArea } from './DraggableElement.svelte'`, re-exported
from `src/lib/index.ts`. There is no separate `.svelte` file.

### 8.10 DraggableElement — `src/components/service/DraggableElement.tsx` (class component)

**1. Purpose.** The low-level single-pointer drag primitive behind the stencil's move area, every handler, and every line.
It reports **incremental** deltas, with optional "anchor" logic.

**2. Props** (`:5-16`, `defaultProps :25-30`).

| Prop                  | Type                                                                          | Default | Behaviour                                                                             |
| --------------------- | ----------------------------------------------------------------------------- | ------- | ------------------------------------------------------------------------------------- |
| `className`           | `string`                                                                      | —       |                                                                                       |
| `children`            | `ReactNode`                                                                   | —       |                                                                                       |
| `disabled`            | `boolean`                                                                     | `false` |                                                                                       |
| `onMove`              | `(directions: MoveDirections, nativeEvent: MouseEvent \| TouchEvent) => void` | —       |                                                                                       |
| `onMoveEnd`           | `() => void`                                                                  | —       |                                                                                       |
| `onMoveStart`         | `() => void`                                                                  | —       |                                                                                       |
| `onLeave` / `onEnter` | `() => void`                                                                  | —       | Hover lifecycle (also driven by touch)                                                |
| `useAnchor`           | `boolean`                                                                     | `true`  | Suppresses movement on an axis while the pointer is moving back toward its grab point |
| `activationDistance`  | `number`                                                                      | `30`    | Touch must travel this far (px) before a drag starts. Handlers and lines pass `0`     |
| (`rerender`)          | —                                                                             | `true`  | In defaultProps but unused                                                            |

**3. DOM.** `div.advanced-cropper-draggable-element.{className}` with React `onMouseOver`/`onMouseLeave` (`:239-251`).
CSS `styles/service/DraggableElement.scss` (empty rule).

**5. Events.** This is the heart of the interaction model. Every listener is `passive: false`:

| Listener     | Target                    | Registered               | Behaviour                                                                                                                                                                                                                             |
| ------------ | ------------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `mousedown`  | container (native)        | `componentDidMount :227` | Left button only (`e.button === 0`) and not disabled. Records the touch and initializes the anchor (`clientXY - rect.leftTop`). **`e.stopPropagation()`** stops TransformableImage from also starting. Calls `onMoveStart`            |
| `touchstart` | container (native)        | `:224`                   | If `e.cancelable`: records touches; with exactly 1 touch and not disabled it is a move start (`onMoveStart`). Sets hover → `onEnter`. If `started \|\| shouldStartMove`: **`preventDefault()` + `stopPropagation()`**                 |
| `mousemove`  | **window**                | `:217`                   | If not disabled and active: `processMove`, `preventDefault` (if cancelable), **`stopPropagation`**                                                                                                                                    |
| `mouseup`    | **window**                | `:216`                   | `processEnd`: `onMoveEnd` if it had touches and isn't disabled; `onLeave` if hovered; clears touches                                                                                                                                  |
| `touchmove`  | **window**                | `:218`                   | If not `started`: once the distance from the first touch exceeds `activationDistance`, init the anchor and set `started = true` (this move is **not** emitted). If started: `processMove` plus `preventDefault` and `stopPropagation` |
| `touchend`   | **window**                | `:219`                   | `started = false; processEnd()`                                                                                                                                                                                                       |
| `mouseover`  | element (React synthetic) | render                   | Sets hover → `onEnter` if not disabled                                                                                                                                                                                                |
| `mouseleave` | element (React synthetic) | render                   | Unsets hover → `onLeave` only if not dragging (it fires on mouseup instead)                                                                                                                                                           |

`processMove` (`:45-80`) emits only for a 1→1 touch. The delta is `new - previous`, with each axis zeroed when `useAnchor` is
set and the pointer is moving **toward** the anchor on that axis. This stops the stencil from "running away" when the user
drags past a limit and comes back. It then calls `onMove(direction, e)`.
`componentDidUpdate` clears touches when `disabled` turns on (`:233-237`). `componentWillUnmount` removes all listeners (`:203-213`).

**7. React mechanics. Why a class.** Stable bound handlers (class fields) for add/removeEventListener;
mutable instance fields (`touches`, `started`, `hovered`, `anchor`) that must **not** trigger renders; and native
listeners instead of React props to get `passive: false` and correct `stopPropagation` ordering (comment citing
facebook/react#9809, `:223`).

**8. Svelte mapping.** `src/lib/components/service/DraggableElement.svelte`.

- `let touches: SimpleTouch[] = []; let started = false; let hovered = false; let anchor = {left:0, top:0}`:
  plain `let`s, non-reactive on purpose.
- One attachment on the div:
  ```svelte
  <div class={['advanced-cropper-draggable-element', className]} {@attach draggable}
       onmouseover={onMouseOver} onmouseleave={onMouseLeave}>{@render children?.()}</div>
  ```
  where `draggable = (node) => { const offs = [on(node,'mousedown',onMouseDown,{passive:false}), on(node,'touchstart',onTouchStart,{passive:false}),
  on(window,'mouseup',…), on(window,'mousemove',…,{passive:false}), on(window,'touchmove',…,{passive:false}), on(window,'touchend',…)];
  return () => offs.forEach(f => f()); }`. The attachment body reads no reactive state, so it runs once per mount.
- `onMove`, `disabled`, and the rest are read from props **inside** handlers, so they are always current (no stale closures).
- `$effect(() => { if (disabled) touches = []; })` replaces `componentDidUpdate`. It also runs at mount (touches are
  empty then, so this is harmless).
- `onmouseover` is delegated in Svelte. That's fine because it doesn't depend on propagation order.
- Optional improvement (do not change semantics): pointer events could replace the mouse/touch pairs, but parity of
  `touches.length` logic and `activationDistance` favours a literal port.

### 8.11 HandlerWrapper — `src/components/service/HandlerWrapper.tsx` (not exported)

**2. Props** (`:11-22`): `className?`, `style?`, `children?`, `onDrag?(shift, event)`, `onDragEnd?()`, `onLeave?()`, `onEnter?()`,
`disabled?`, `horizontalPosition?`, `verticalPosition?`.
**3. DOM:**

```
div.{className}.advanced-cropper-handler-wrapper.advanced-cropper-handler-wrapper--{snake}[.advanced-cropper-handler-wrapper--disabled]  style
  DraggableElement className="advanced-cropper-handler-wrapper__draggable" activationDistance={0}
```

`snake = getDirectionNames(h, v).snakeCase` (for example `east-north`), or no modifier if both are null. CSS `styles/service/HandlerWrapper.scss`
(30×30 hit box centered with `translate(-50%,-50%)`, resize cursors, `--disabled {cursor:auto}`).
**5:** `onDrag` → `onMove`, `onDragEnd` → `onMoveEnd`, `onLeave`/`onEnter` passed through.
**8. Svelte:** `HandlerWrapper.svelte` (internal), with a `children` snippet.

### 8.12 LineWrapper — `src/components/service/LineWrapper.tsx` (not exported)

**2. Props** (`:6-15`): `className?`, `children?`, `onDrag?`, `onDragEnd?`, `onLeave?`, `onEnter?`, `disabled?`,
`position?: HorizontalCardinalDirection | VerticalCardinalDirection`. There is **no** `style`.
**3. DOM:** the DraggableElement _is_ the root. Its className is
`['advanced-cropper-line-wrapper', '--{position}', '--disabled'?, className]` with `activationDistance={0}`, wrapping
`div.advanced-cropper-line-wrapper__content.advanced-cropper-line-wrapper__content--{position}` > children.
CSS `styles/service/LineWrapper.scss` (12px hit area, cursors, content positioning).
**8. Svelte:** `LineWrapper.svelte` (internal).

### 8.13 StencilGrid — `src/components/service/StencilGrid.tsx`

**2. Props** (`:5-10`): `visible?: boolean` (default `false`), `columns?: number` (`3`), `rows?: number` (`3`), `className?`.
**3. DOM:**

```
div.advanced-cropper-stencil-grid[.advanced-cropper-stencil-grid--visible].{className}
  div.advanced-cropper-stencil-grid__row ×rows
    div.advanced-cropper-stencil-grid__cell[--top if i=0][--bottom if last row][--left if j=0][--right if last col] ×cols
```

CSS `styles/service/StencilGrid.scss` (table layout, `opacity 0.3s` fade; outer borders transparent via the `--top`, `--left`, and other edge modifiers).
**7. React mechanics:** `currentRows`/`currentColumns` state is updated from props **only while `visible`**
(`useUpdateEffect`, `:18-23`). When an interaction ends, the grid fades out _keeping_ its last layout. For example, it doesn't
jump from 9×9 back to 3×3 mid-fade after a rotate gesture.
**8. Svelte:** `StencilGrid.svelte`.

```ts
let current = $state({ rows: untrack(() => rows), columns: untrack(() => columns) });
$effect.pre(() => {
	if (visible) current = { rows, columns };
});
```

Or, without an effect, a latch inside `$derived.by` (`let latched = {rows, columns}` as a non-reactive closure variable,
updated when `visible`). Render with `{#each {length: current.rows}, i}{#each {length: current.columns}, j}…`.
Skip-first-mount isn't needed because the initial state already equals the props.

### 8.14 StencilOverlay — `src/components/service/StencilOverlay.tsx`

**2. Props:** `className?`, plus implicit `children` (React 17 `FC` includes `children`).
**3. DOM:** `div.advanced-cropper-stencil-overlay.{className}` > children. CSS `styles/service/StencilOverlay.scss`
(`box-shadow: 0 0 0 1000px currentColor` darkens outside the stencil; `pointer-events:none`). The theme sets `color: rgba(black,.5)`.
**8. Svelte:** `StencilOverlay.svelte` with a `children` snippet.

### 8.15 StencilWrapper — `src/components/service/StencilWrapper.tsx`

**2. Props** (`:7-15`): `children?`, `className?`, `transitions?`, `width?`, `height?`, `left: number` (required), `top: number` (required).
**3. DOM:** delegates to `ArtificialTransition` with `className = cn('advanced-cropper-stencil-wrapper', className)`,
giving `div.advanced-cropper-artificial-transition.advanced-cropper-stencil-wrapper.{className}`. CSS `styles/service/StencilWrapper.scss`.
**8. Svelte:** `StencilWrapper.svelte`, a thin pass-through.

### 8.16 StretchableBoundary — `src/components/service/StretchableBoundary.tsx`

**1. Purpose.** The default `boundaryComponent` for both the cropper and the preview. It sizes a "stretcher" div so the boundary
takes the image's aspect ratio within the available space, then measures the result to produce the cropper `boundary` size.

**2. Props** (`:11-19`).

| Prop                 | Type                                                                                               | Default                                                      |
| -------------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| `className`          | `string`                                                                                           | —                                                            |
| `style`              | `CSSProperties`                                                                                    | —                                                            |
| `stretcherClassName` | `string`                                                                                           | —                                                            |
| `contentClassName`   | `string`                                                                                           | —                                                            |
| `stretchAlgorithm`   | `BoundaryStretchAlgorithm` = `(boundary: HTMLElement, stretcher: HTMLElement, size: Size) => void` | `stretchCropperBoundary` (preview: `stretchPreviewBoundary`) |
| `sizeAlgorithm`      | `BoundarySizeAlgorithm` = `(boundary: HTMLElement, size: Size) => Size`                            | `fillBoundary`                                               |
| `children`           | `ReactNode`                                                                                        | —                                                            |

**3. DOM:**

```
div.advanced-cropper-boundary.{className}  style   (ref boundaryRef)
  div.advanced-cropper-boundary__stretcher.{stretcherClassName}   (ref stretcherRef)
  div.advanced-cropper-boundary__content.{contentClassName}
    {children}
```

CSS `styles/service/StretchableBoundary.scss` (`user-select:none; direction:ltr; position:relative`; content absolute and 100%; stretcher
`max-width/height:100%`). With AbstractCropper it also gets `advanced-cropper__boundary` (flex-grow).

**4. Refs** (`:21-24,42-66`). `StretchableBoundaryMethods`:

- `stretchTo(size: Size | null): Promise<Size | null>`. If the size and both elements exist, it runs
  `stretchAlgorithm(boundary, stretcher, size)`, then `sizeAlgorithm(boundary, size)`, resolving the size, or `null` when the result is 0×0.
  Otherwise it clears the stretcher's inline width and height and resolves `null`. The promise is always already resolved,
  so it is synchronous in effect, but callers `await` it.
- `reset()` clears the stretcher's inline width and height.
  `stretchCropperBoundary` mutates `stretcher.style` and reads `clientWidth/Height`, which forces synchronous layout
  (`tmp/advanced-cropper/src/boundary/index.ts:4-17`).

**8. Svelte:** `StretchableBoundary.svelte` with `bind:this` on both divs, `export function stretchTo(...)`, and
`export function reset()`. A custom `boundaryComponent` must export the same two functions; document this as the contract.
Leave the stretcher's `style` **un-managed** by Svelte (no `style=` attribute on it), so the imperative writes are never overwritten.

### 8.17 TransformableImage — `src/components/service/TransformableImage.tsx` (class component)

**1. Purpose.** The gesture surface for moving, zooming, and rotating the image (wheel, 1–2 finger touch, mouse drag). It
emits `ImageTransform`s. Rendered by CropperBackgroundWrapper. Also exported for custom background wrappers (for example
the example site's `BackgroundWrapperWithNotifications` uses `onEvent`).

**2. Props** (`:12-31`, defaults `:52-59`).

| Prop                             | Type                                                                       | Default                               | Behaviour                                                                                                                                  |
| -------------------------------- | -------------------------------------------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `onTransform`                    | `(transform: ImageTransform) => void`                                      | —                                     |                                                                                                                                            |
| `onTransformEnd`                 | `() => void`                                                               | —                                     |                                                                                                                                            |
| `onEvent`                        | `(transformEvent: TransformableImageEvent, nativeEvent: Event) => unknown` | —                                     | If provided, it **replaces** the default `preventDefault/stopPropagation`. Calling `transformEvent.preventDefault()` cancels the transform |
| `disabled`                       | `boolean`                                                                  | —                                     | Events are still processed (and prevented), but no transform is applied                                                                    |
| `touchMove`                      | `boolean`                                                                  | `true`                                |                                                                                                                                            |
| `mouseMove`                      | `boolean`                                                                  | `true`                                |                                                                                                                                            |
| `touchScale`                     | `boolean`                                                                  | `true`                                |                                                                                                                                            |
| `touchRotate`                    | `boolean`                                                                  | `false`                               |                                                                                                                                            |
| `wheelScale`                     | `boolean \| {ratio: number}`                                               | `true`                                | `true` → ratio `0.1`                                                                                                                       |
| `timeout`                        | `number`                                                                   | `500`                                 | Debounce for the wheel gesture end. **Read once in the constructor** (`:70`); later changes are ignored                                    |
| `preventDefault`                 | `boolean`                                                                  | `true` (destructuring default `:104`) |                                                                                                                                            |
| `children`, `className`, `style` |                                                                            |                                       |                                                                                                                                            |

`TransformableImageEvent` (`:33-43`) is an exported class: `{ active: boolean; defaultPrevented: boolean; preventDefault(): void }`.
`active` is whether a transform gesture is in progress.

**3. DOM.** `div.{className}[style]` (`:246-253`). It has **no class of its own**; its class comes from AbstractCropper.

**5. Events.** All listeners are `passive: false` (`:225-244`).

| Listener     | Target    | Behaviour                                                                                                                                                                        |
| ------------ | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `wheel`      | container | If `wheelScale` and `processEvent` allows: `processStart()`, `onTransform(wheelEventToImageTransform(e, container, ratio))`. With no touches, debounce `processEnd` by `timeout` |
| `touchstart` | container | If cancelable and (`touchMove` or (scale/rotate with >1 touches)) and `processEvent` allows: store the touches that lie **inside** the container rect                            |
| `mousedown`  | container | If `mouseMove` and `event.buttons === 1` and allowed: `touches = [{clientX, clientY}]` and `processStart()`                                                                      |
| `touchmove`  | window    | If touches: filter to known identifiers; if allowed, `processMove` (`touchesToImageTransform(new, old, container, {scale, rotate, move})`) then `processStart`                   |
| `mousemove`  | window    | If touches and allowed: `processMove` with one touch                                                                                                                             |
| `touchend`   | window    | When `event.touches.length === 0`: clear and `processEnd()`                                                                                                                      |
| `mouseup`    | window    | Clear and `processEnd()`                                                                                                                                                         |

`processEvent(e)` (`:103-115`) builds a `TransformableImageEvent`. It calls `onEvent` if given; otherwise, when
`preventDefault` is set, it calls `e.preventDefault()` and `e.stopPropagation()`. It returns `!disabled && !transformEvent.defaultPrevented`.
`processStart` sets `transforming = true` and clears the pending debounce. `processEnd` calls `onTransformEnd` once per gesture.

Because the stencil's DraggableElements stop `mousedown`/`touchstart` propagation natively, TransformableImage only
sees events on the background area. That is the nesting contract from §3.5.

**7. React mechanics.** A class component for stable handlers and mutable fields. `shouldComponentUpdate() { return true }`
(`:208-210`) is a no-op (the default behaviour). `debounce` comes from the core (`DebouncedFunction` with `.clear()`).

**8. Svelte mapping.** `src/lib/components/service/TransformableImage.svelte`, plus `TransformableImageEvent` in
`src/lib/components/service/TransformableImageEvent.ts` (or `<script module>`). It must be exported as a value.

- Plain `let touches`, `let transforming`. Upstream reads `timeout` once. For an improvement that is
  harmless, create the debounced function in an `$effect` keyed on `timeout` that returns `() => debounced.clear()`.
  Otherwise construct it once with `untrack(() => timeout)` for strict parity.
- One attachment registering `on(node,'wheel'|'touchstart'|'mousedown',…,{passive:false})` plus window
  `mousemove/mouseup/touchmove/touchend`, all `{passive:false}`. Attributes are wrong here (§3.5):
  `ontouchstart`/`ontouchmove` are passive in Svelte, and a delegated `onmousedown` would break the stopPropagation
  contract with DraggableElement. `onwheel` is neither delegated nor forced passive, but keep it in the same attachment
  for symmetry and explicit `passive:false`.
- `disabled`, `onTransform`, and the rest are read live inside handlers.
- `children: Snippet`.

---

## 9. Svelte port: consolidated decisions

### 9.1 File layout (`src/lib`)

```
src/lib/
  components/
    AbstractCropper.svelte            (internal)
    croppers/Cropper.svelte
    croppers/FixedCropper.svelte
    stencils/RectangleStencil.svelte
    stencils/CircleStencil.svelte
    handlers/SimpleHandler.svelte
    lines/SimpleLine.svelte
    helpers/CropperPreview.svelte
    helpers/CropperPreviewBackground.svelte
    helpers/CropperPreviewWrapper.svelte
    service/ArtificialTransition.svelte   (internal)
    service/BoundingBox.svelte
    service/CropperBackgroundImage.svelte
    service/CropperBackgroundWrapper.svelte
    service/CropperCanvas.svelte
    service/CropperFade.svelte
    service/CropperSource.svelte
    service/CropperWrapper.svelte
    service/DraggableArea.ts              (alias re-export)
    service/DraggableElement.svelte
    service/HandlerWrapper.svelte         (internal)
    service/LineWrapper.svelte            (internal)
    service/StencilGrid.svelte
    service/StencilOverlay.svelte
    service/StencilWrapper.svelte
    service/StretchableBoundary.svelte
    service/TransformableImage.svelte
    service/TransformableImageEvent.ts
  service/cn.ts                         (classnames replacement, string output)
  service/style.ts                      (styleToString for core style objects)
  service/events.ts                     (preventDefault)
  service/constants.ts                  (DEFAULT_SETTINGS list)
```

Every public component is re-exported by name from `src/lib/index.ts`
(`export { default as Cropper } from './components/croppers/Cropper.svelte'`), along with its `*Props`/`*Ref`
types, which go in `<script module lang="ts">` exports or a sibling `types.ts`.

### 9.2 Customization points: component prop vs snippet

| Upstream prop                              | Svelte form             | Why                                                                                                                                              |
| ------------------------------------------ | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `stencilComponent`                         | **Component prop**      | Needs `bind:this` exports (`aspectRatio`, `boundingBox`); parity `stencilComponent={CircleStencil}`                                              |
| `boundaryComponent` (cropper and preview)  | **Component prop**      | Needs `bind:this` exports (`stretchTo`, `reset`)                                                                                                 |
| `backgroundComponent` (cropper)            | **Component prop**      | Needs `bind:ref` to the drawable element for `getCanvas`                                                                                         |
| `backgroundComponent` (preview)            | **Component prop**      | Parity; receives `size`                                                                                                                          |
| `wrapperComponent` (cropper and preview)   | **Component prop**      | Parity. Could be a snippet (no imperative surface), but users port wrapper components, and wrappers often have state (Telegram/Twitter showcase) |
| `backgroundWrapperComponent`               | **Component prop**      | Parity; usually wraps `TransformableImage` with its own state                                                                                    |
| `handlerComponent`, `lineComponent`        | **Component prop**      | Each instance has local hover state; rendered in `{#each}`                                                                                       |
| `children` of every wrapper-like component | **`children: Snippet`** | The idiomatic Svelte replacement for `ReactNode` children                                                                                        |

Snippets are better when the customization is stateless markup that wants to close over the _parent's_ scope (for example
adding an overlay inside the wrapper). That is possible today via `children`, or by writing a wrapper component. Snippet-typed
alternatives (`stencil?: Snippet<[StencilProps]>`) are not added, because they would break `bind:this` on the stencil and
fork the API.

### 9.3 Imperative surface

| Component                                | Svelte exports (`bind:this`)                | Bindable props                  |
| ---------------------------------------- | ------------------------------------------- | ------------------------------- |
| Cropper / FixedCropper / AbstractCropper | 33 functions from §4.1 (point 4)            | —                               |
| RectangleStencil                         | `aspectRatio()` (function)                  | —                               |
| CircleStencil                            | `aspectRatio = 1`, `boundingBox = 'circle'` | —                               |
| CropperPreview                           | `refresh()`, `update(cropper?)`             | —                               |
| CropperCanvas                            | `draw(state, image, options?)`              | —                               |
| StretchableBoundary                      | `stretchTo(size)`, `reset()`                | —                               |
| CropperBackgroundImage                   | —                                           | `ref: HTMLImageElement \| null` |
| CropperSource                            | —                                           | `ref: HTMLImageElement \| null` |
| CropperPreviewBackground                 | —                                           | `ref` (optional, for symmetry)  |

### 9.4 Do not port literally

- `useForceRerender` (AbstractCropper/CropperInstance and CropperPreview): replaced by `$state.raw` in the instance.
- `usePersistentFunction`: functions reading `$props` are already live.
- `useStateWithCallback` used to sequence `cropper.reset` after the image commit. Use `await tick()` after
  assigning `currentImage` instead (hooks study).
- `useUpdateEffect`/`useFirstMountState` (StencilGrid, hooks): use a plain `$effect`, since initial state already equals props.
- Class components (DraggableElement, TransformableImage): plain `let` plus an attachment.
- `useMemo` in BoundingBox and the option hooks: use `$derived`.
- `key={src}` → `{#key src}`.
- `createCropper`, `mergeRefs`, and `displayName`: not needed (export `mergeRefs` only if API parity checks demand the name).
- The dead `Cropper` deprecation branch for `stencilSize`/`autoZoom` (§2.5) and the broken type import path.
- Direct `root.style` writes in ArtificialTransition: render from `$state` instead.
- `deprecatedWrapperProps` (`loading`/`loaded`): pass them only if cheap; they are deprecated upstream.

### 9.5 Behaviour that **must** be preserved exactly

1. Native, non-passive `mousedown`/`touchstart` on DraggableElement with `stopPropagation`, nested inside native
   TransformableImage listeners (§3.5).
2. `passive: false` on window `touchmove`/`mousemove` so `preventDefault` blocks page scroll during drags.
3. Anchor logic and `activationDistance` (30 for the stencil area, 0 for handlers and lines) in DraggableElement.
4. `lastReference` freezing and `shiftKey` → `preserveAspectRatio` in BoundingBox.
5. Stencil option precedence: `{...stencilProps, ...stencilExports}`, then `{...settings, ...constraints}`, and a user
   `aspectRatio` disables the stencil's aspect ratio.
6. Spread order and override rules of the `*Props` channels (§2.2).
7. Background rendered only when `state` exists. The stencil renders nothing without state.
8. The grid layout latch while it is fading out (StencilGrid).
9. `CropperBackgroundWrapper`: `disabled = transitions.active || disabled` and `preventDefault = !disabled`.
10. Class names, including the oddities: unprefixed `cropper-preview-wrapper`, no `--hover` on line wrappers, and
    `advanced-cropper__background-wrapper` hard-coded.

---

## 10. Upstream quirks and bugs found

| #   | Where                                     | Issue                                                                                                                                        | Port decision                                                           |
| --- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| 1   | `Cropper.tsx:26-55` + `constants.ts`      | `stencilSize`/`autoZoom` never reach `cropperProps.settings`, so the deprecated paths are dead                                               | Drop; optional dev warning                                              |
| 2   | `AbstractCropper.tsx:81`                  | `backgroundWrapperClassName` declared but never applied                                                                                      | Accept the prop; apply it (document as a fix) or ignore (strict parity) |
| 3   | `AbstractCropper.tsx:42-72`               | Ref type lacks `setVisibleArea`, `startTransitions`, `hasInteractions`, `getInteractions`, which exist at runtime                            | Type all 33                                                             |
| 4   | `CircleStencil.tsx:77-79`                 | `Methods` type omits `boundingBox`                                                                                                           | Type it                                                                 |
| 5   | `BoundingBox.tsx:177-187`                 | `handlerClassNames.disabled`, `handlerWrapperClassNames.disabled/hover`, `lineWrapperClassNames.hover` declared but unused                   | Keep the types; replicate the behaviour                                 |
| 6   | `CropperPreview.tsx:41-47`                | `PreviewWrapperComponent` typed with `loading/loaded`, never passed                                                                          | Same                                                                    |
| 7   | `TransformableImage.tsx:70`               | `timeout` read once in the constructor                                                                                                       | Optionally reactive                                                     |
| 8   | `DraggableElement.tsx:29`                 | `rerender` defaultProp unused                                                                                                                | Drop                                                                    |
| 9   | `useAbstractCropperProps.ts:4`            | Type import from an absolute author-machine path                                                                                             | Drop                                                                    |
| 10  | `useAbstractCropper` + instance callbacks | `onUpdate` is fired by both the hook (loading changes) and the core instance                                                                 | Preserve (parity)                                                       |
| 11  | `SimpleHandler.tsx:10`                    | `wrapperStyle` never supplied by BoundingBox                                                                                                 | Keep the prop                                                           |
| 12  | docs vs code                              | `imageClassName`, `stretchAlgorithm` (top-level), `*ImageAlgorithm` props, and `StencilProps`/`StencilRef` exports are documented but absent | Port the code; consider adding the `StencilProps`/`StencilRef` types    |
| 13  | `ArtificialTransition`                    | Animation not cancelled on unmount                                                                                                           | Cancel in cleanup                                                       |
| 14  | `AbstractCropper.scss`                    | `.advanced-cropper__wrapper` and `__stencil-wrapper` rules exist with no React consumer                                                      | Keep the CSS (themes or users may rely on it)                           |

---

## 11. Upstream tests

- **`tests/components/croppers/Cropper.test.tsx`** (5 lines) is the only test file:
  ```tsx
  import React from 'react';
  import { cleanup } from '@testing-library/react';
  describe('Cropper', () => {
  	afterEach(cleanup);
  });
  ```
  It contains **no tests**. Jest would report "Your test suite must contain at least one test", so `yarn test`
  fails as-is. There is effectively zero upstream test coverage to port.
- **`jest.config.js`**: `preset: 'ts-jest'`, `clearMocks: true`, `testEnvironment: 'jest-environment-jsdom'`,
  `testEnvironmentOptions: { resources: "usable" }` (loads images and subresources in jsdom). devDependencies include
  `@testing-library/react@12`, `jest@29`, `ts-jest@29`, and `@testing-library/cypress`/`cypress@12`, but there is no
  `cypress/` directory. `.babelrc` uses the obsolete `env`/`stage-0`/`react` presets and is unused by ts-jest.
- jsdom has no layout. `getBoundingClientRect` and `clientWidth` are all 0, so StretchableBoundary would resolve `null` and the cropper
  would never initialize. That is probably why no real tests were written.

**Svelte test plan.** The project runs Vitest browser mode on real Chromium (`*.svelte.test.ts`), which has real layout:

- Rendering and DOM contract per component: assert class **sets** and structure from §1 and §§5–8.
- DraggableElement and TransformableImage: dispatch real `mousedown`/`mousemove`/`mouseup`, `touch*`, and `wheel` events;
  assert `onMove` deltas, the anchor behaviour, `activationDistance`, and that a stencil drag does **not** trigger `onTransform`
  (the stopPropagation contract), and that `preventDefault` is applied (`event.defaultPrevented`).
- BoundingBox: `respectDirection`, `preserveAspectRatio` with `shiftKey`, and `reference` freezing.
- Cropper: `bind:this` API surface (all 33 members exist), `onReady` after load, `getCanvas()` returns a canvas,
  and `stencilComponent={CircleStencil}` produces a 1:1 aspect ratio.
- Playwright e2e (`e2e/*.e2e.ts`) for docs-site demos.

---

## 12. Summary

1. 27 component files: 3 croppers (AbstractCropper is internal), 2 stencils, 1 handler, 1 line, 3 preview helpers, and 17 service
   files (not 20). AbstractCropper, ArtificialTransition, HandlerWrapper, and LineWrapper are not exported.
2. State flows only by **prop drilling** one `cropper` object. Children pull via `getState()` during render, and the whole tree
   force-re-renders on every change. In Svelte, back the instance data with `$state.raw` and keep the stable `cropper` prop contract.
3. All seven `*Component` customization points stay **component props**. Stencil, boundary, and background need an imperative
   surface (exports or `bind:ref`) that snippets can't provide. Only `children` becomes a snippet.
4. Refs map by pattern: `useImperativeHandle` → `export function`/`export const` via `bind:this`; DOM `forwardRef` →
   `ref = $bindable()`.
5. Stencil options (`aspectRatio`, `boundingBox`) reach `stencilConstraints` through the stencil ref. In Svelte, export
   `aspectRatio` as a **function**; the core already accepts a function there.
6. The event model relies on native, non-passive listeners and `stopPropagation` ordering. Svelte delegates `mousedown` and
   makes `touchstart`/`touchmove` passive, so all drag and gesture listeners must use `on()` with `{passive:false}` in attachments.
7. `Cropper`'s `stencilSize`/`autoZoom` deprecation path is dead code, and `backgroundWrapperClassName` is never applied.
   The documentation and the code have also drifted apart.
8. Use the native `class={[…]}` for DOM, and a small string `cn()` for props passed to replaceable components. `style` becomes
   a string, with core style objects serialized. Base CSS must be `:global` or shipped as a stylesheet, or theme overrides lose on specificity.
9. Hardest to port: **DraggableElement** and **TransformableImage** (event semantics), **AbstractCropper** (instance wiring,
   ordering of image commit → reset, a 33-member forwarded API through Cropper and FixedCropper), and **ArtificialTransition**
   (rAF interpolation against reactive props).
10. Upstream has no real tests: one empty Jest suite, and jsdom has no layout. The Svelte port needs browser-mode tests from scratch.

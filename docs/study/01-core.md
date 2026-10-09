# 01 — `advanced-cropper@0.17.1` core study

> Historical study of the upstream implementation and earlier port. Proposed mappings and release observations below are not the 0.2.0 API; see the [current design log](00-index.md) for superseding decisions.

Scope: everything under `tmp/advanced-cropper/src` (the framework-agnostic core), cross-checked against
the shipped package at `node_modules/advanced-cropper` (pnpm store `advanced-cropper@0.17.1`) and against
`tmp/react-advanced-cropper` where the React layer shows how the core is meant to be driven.

The clone HEAD is `b1a9186` (2024-06-09, "Handle differing source and result sizes in updateCanvas").
`package.json` says `0.17.1`. Spot diffs of `dist` against `src` (instance `.d.ts`, `canvas/updateCanvas`,
`service/index`) match, so this document treats `src` as the source of truth for what is installed.

Notation: `src/x.ts:12` means `tmp/advanced-cropper/src/x.ts:12`. "Image px" means coordinates in the
(rotated) image's pixel space. "Boundary px" means on-screen pixels inside the cropper boundary.

---

## 0. TL;DR for the Svelte layer

- The core's only stateful piece is `AbstractCropperInstance` (`src/instance/AbstractCropperInstance.ts:162`).
  It is **not** constructed with options. You subclass it and implement **three protected abstract methods**:
  `getProps()`, `getData()`, `setData(data)`. There is no `getSettings`/`setState`/`getTransitions` contract
  for the host to implement: those are _public methods the base class already provides_.
- `getData()` must return the **latest data synchronously** right after `setData()`. The base class does
  `setData(...)` and then `getData()` several times inside one call. The React layer stores data in a
  plain field and forces a re-render (`tmp/react-advanced-cropper/src/instance/CropperInstance.ts:37-44`).
  In Svelte, use a `$state.raw` class field. Don't use a deep `$state` proxy, because the core always
  replaces data wholesale.
- **Callbacks only fire if `getProps().getInstance` returns a truthy value** (`runCallback`, `:141-151`).
  The Svelte layer must provide `getInstance` that returns the public "cropper ref" object.
- `settings` handed to the core must be **complete `CoreSettings`**. The core never fills defaults. The
  React layer builds them with `createDefaultSettings` and defaults `imageRestriction: fitArea`,
  `transformImage.adjustStencil: true`, `transitions: true`
  (`tmp/react-advanced-cropper/src/hooks/useCropperInstance.ts:29-53`). The Svelte layer must do the same.
- All DOM work (boundary measurement, image loading, canvas, rAF) lives in free functions that the
  framework layer calls. The core never attaches event listeners (except `img` load/error in
  `createImage`), never observes resize, and never touches the DOM at module top level, so it is
  SSR-import-safe.
- The core ships **SCSS only, no CSS**. React compiles `styles/index.scss` + `themes/default.scss` into
  `dist/style.css` and each theme into `dist/themes/*.css` (+ copies `.scss`). To keep identical consumer
  paths, our `package.json#exports` must expose `./dist/style.css` and `./dist/themes/*`. The current
  `exports` only has `"."`, so those imports would be **blocked**.

---

## 1. Module map (what actually ships)

### 1.1 Build and layout facts

- Rollup inputs (`tmp/advanced-cropper/rollup.config.js`): `algorithms, service, state, defaults, instance,
  extensions/{absolute-zoom,stencil-size,prevent-zoom,fit-to-image,mimes}, showcase/mobile, animation,
  canvas, boundary, image, types, utils, index`. Uses `preserveModules: true`, ESM into `dist/`, CJS into
  `dist/node/`, and `external: ['tslib']`. `rollup-plugin-copy` copies `src/styles/**/*` → `dist/styles` and
  `src/themes/**/*` → `dist/themes`.
- `scripts/packages.js` writes a **nested `package.json` into every directory that has an `index.js`**
  (excluding `node/`): `{ sideEffects:false, module:"./index.js", main:"../node/<dir>/index.js", types:"./index.d.ts" }`.
  This is the old "proxy directory" subpath technique. **There is no `exports` field anywhere.**
- `constants/` is not a rollup input but gets emitted (preserveModules) _and_ receives a nested
  `package.json`, so `advanced-cropper/constants` resolves. It is **not** re-exported from the root.
- `tsconfig` targets **ES5** with `importHelpers` (`tmp/advanced-cropper/tsconfig.json`), so classes are
  compiled to ES5 constructor functions and spreads to `tslib` helpers (`__assign`, `__rest`, `__spreadArrays`).

### 1.2 Subpaths (verified: each has a nested `package.json` in `node_modules/advanced-cropper`)

| Import path                 | Source                                    | Purpose                                                                                                                                                               | Key runtime exports                                                                                                                                                                                                                                                                                                                                                                                              |
| --------------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `advanced-cropper`          | `src/index.ts:1-11`                       | Barrel: `export *` from algorithms, service, state, defaults, instance, boundary, animation, canvas, image, types, utils. **Not** constants, extensions, or showcase. | everything below except those three groups                                                                                                                                                                                                                                                                                                                                                                       |
| `/algorithms`               | `src/algorithms/*`                        | Pure geometry on `Coordinates`/state                                                                                                                                  | `moveCoordinatesAlgorithm`, `resizeCoordinatesAlgorithm`, `anchoredResizeCoordinatesAlgorithm`, `fitDirections`, `anchorToAllowedDirections`, `anchorMoveToResizeDirections`, `rotateImageAlgorithm`, `flipImageAlgorithm`, `transformImageAlgorithm`; type `RotateImageAlgorithm`, `ResizeLimitations`                                                                                                          |
| `/service`                  | `src/service/*`                           | Restriction math, normalisation, helpers                                                                                                                              | see §2.6; includes `isEqualState`, `hasInteractions`, `getEmptyInteractions`, `touchesToImageTransform`, `wheelEventToImageTransform`, `getTransitionStyle`                                                                                                                                                                                                                                                      |
| `/state`                    | `src/state/*`                             | Pure `(state, settings, …) => state` reducers                                                                                                                         | `copyState`, `createState`, `moveCoordinates`, `resizeCoordinates`, `setBoundary`, `setCoordinates`, `SetCoordinatesMode`, `setVisibleArea`, `transformImage`, `reconcileState` + `*Algorithm` types, `ResizeOptions`, `CreateStateOptions`                                                                                                                                                                      |
| `/defaults`                 | `src/defaults/*`                          | Default settings factory and default restriction/size/position functions                                                                                              | `createDefaultSettings`, `withDefault{Size,Position,AreaPosition,AreaSize}Restrictions`, `defaultSize`, `defaultPosition`, `defaultVisibleArea`, `defaultPositionRestrictions`, `defaultAreaPositionRestrictions`, `defaultAreaSizeRestrictions`, `pixelsRestrictions`, `retrieveSizeRestrictions`, `fitBoundary`, `fillBoundary`, `defaultStencilConstraints`; types `DefaultSettings`, `DefaultSettingsParams` |
| `/instance`                 | `src/instance/AbstractCropperInstance.ts` | The stateful controller to subclass                                                                                                                                   | `AbstractCropperInstance` + option/props/callback types                                                                                                                                                                                                                                                                                                                                                          |
| `/animation`                | `src/animation/index.ts`                  | rAF tween driver                                                                                                                                                      | `Animation`                                                                                                                                                                                                                                                                                                                                                                                                      |
| `/boundary`                 | `src/boundary/index.ts`                   | DOM stretcher algorithms                                                                                                                                              | `stretchCropperBoundary`, `stretchPreviewBoundary`, type `BoundaryStretchAlgorithm`                                                                                                                                                                                                                                                                                                                              |
| `/canvas`                   | `src/canvas/index.ts`                     | Draw the result to a canvas                                                                                                                                           | `drawCroppedArea`, `prepareSource`, `updateCanvas`, type `DrawOptions`                                                                                                                                                                                                                                                                                                                                           |
| `/image`                    | `src/image/index.ts`                      | Image loading/EXIF and CSS transform styles                                                                                                                           | `loadImage`, `createImage`, `getImageStyle`, `getBackgroundStyle`, `getPreviewStyle`, `getStyleTransforms`                                                                                                                                                                                                                                                                                                       |
| `/types`                    | `src/types/index.ts`                      | All shared types                                                                                                                                                      | runtime: enums `ImageRestriction`, `Priority` only                                                                                                                                                                                                                                                                                                                                                               |
| `/utils`                    | `src/utils/index.ts`                      | Generic helpers                                                                                                                                                       | 32 functions (see §2.7)                                                                                                                                                                                                                                                                                                                                                                                          |
| `/constants`                | `src/constants/index.ts`                  | Direction arrays                                                                                                                                                      | `ALL_DIRECTIONS`, `HORIZONTAL_DIRECTIONS`, `VERTICAL_DIRECTIONS`                                                                                                                                                                                                                                                                                                                                                 |
| `/extensions/absolute-zoom` | `src/extensions/absolute-zoom/index.ts`   | Slider-style absolute zoom                                                                                                                                            | `getAbsoluteZoom`, `getZoomFactor`                                                                                                                                                                                                                                                                                                                                                                               |
| `/extensions/stencil-size`  | `src/extensions/stencil-size/index.ts`    | Fixed-size stencil (FixedCropper)                                                                                                                                     | `fixedStencil` (postprocess), `fixedStencilAlgorithm`, `fixedStencilConstraints`, `getStencilSize`, `sizeRestrictions`, `defaultSize`, `aspectRatio`; types `StencilSize`, `FixedStencilSettings`                                                                                                                                                                                                                |
| `/extensions/prevent-zoom`  | `src/extensions/prevent-zoom/index.ts`    | Postprocess that locks the visible area to the image                                                                                                                  | `preventZoom`                                                                                                                                                                                                                                                                                                                                                                                                    |
| `/extensions/fit-to-image`  | `src/extensions/fit-to-image/index.ts`    | Keep a stencil inside a rotated image                                                                                                                                 | `approximateSizeInsideImage`, `fitToImage`, `moveToImage`, enum `BoundingBoxType`; types `BoundingBox`, `RotatedImage`, `FitToImageSettings`. (`getRotatedImage` and the `*BoundingBox` helpers are only reachable through deep file paths.)                                                                                                                                                                     |
| `/extensions/mimes`         | `src/extensions/mimes/index.ts`           | Magic-byte MIME sniffing                                                                                                                                              | `getMimeType(data, fallback?)`                                                                                                                                                                                                                                                                                                                                                                                   |
| `/showcase/mobile`          | `src/showcase/mobile/index.ts`            | Telegram-like "mobile" cropper recipe (used by React docs examples, not by React lib)                                                                                 | `stencilConstraints`, `transformImage`, `resizeCoordinates`, `defaultSize`, `fitStencilToImage`, `zoomStencil`                                                                                                                                                                                                                                                                                                   |
| `/styles/*.scss`            | `src/styles/**`                           | **Raw SCSS files only** (no `package.json`, no CSS). `dist/styles` contains both nested (`service/…`) and flattened copies; `index.scss` uses the nested paths.       | n/a                                                                                                                                                                                                                                                                                                                                                                                                              |
| `/themes/*.scss`            | `src/themes/*`                            | 5 theme SCSS files (no CSS)                                                                                                                                           | n/a                                                                                                                                                                                                                                                                                                                                                                                                              |

What React re-exports (and so our public API must too, for one-to-one parity;
`tmp/react-advanced-cropper/src/index.ts:34-54`): `export *` from `advanced-cropper`, `/defaults`,
`/algorithms`, `/image`, `/canvas`, `/service`, `/state`. It re-exports explicitly `isLower, isGreater,
isRoughlyEqual, isNumber, isUndefined, isArray, isNumeric, isWheelEvent, isMouseEvent, isTouchEvent`, and
`export type { StencilSize } from 'advanced-cropper/extensions/stencil-size'`. Separately,
`FixedCropper` uses `fixedStencil` and `fixedStencilConstraints` from `/extensions/stencil-size`.

---

## 2. Data model

### 2.1 Geometry primitives (`src/types/index.ts`)

```ts
interface Coordinates {
	width: number;
	height: number;
	top: number;
	left: number;
} // :3-8
type VisibleArea = Coordinates; // :10
interface Size {
	width: number;
	height: number;
}
type ImageSize = Size;
type Boundary = Size; // :48-54
interface Point {
	top: number;
	left: number;
}
interface Position {
	left;
	top;
} // :43, :77
interface Limits {
	top?;
	left?;
	right?;
	bottom?;
} // :12-17
type PositionRestrictions = Limits;
type AreaPositionRestrictions = Limits; // :27-29
interface SizeRestrictions {
	minWidth;
	maxWidth;
	minHeight;
	maxHeight;
}
type AreaSizeRestrictions = SizeRestrictions; // :19-25
interface AspectRatio {
	minimum: number;
	maximum: number;
}
type RawAspectRatio = Partial<AspectRatio> | number; // :63-70
interface MoveDirections {
	top;
	left;
}
interface ResizeDirections {
	top;
	left;
	right;
	bottom;
} // :31-41
type OrdinalDirection =
	| 'west'
	| 'east'
	| 'north'
	| 'south'
	| 'westNorth'
	| 'westSouth'
	| 'eastNorth'
	| 'eastSouth'; // :102-108
type ResizeAnchor = OrdinalDirection | 'center'; // :68
interface Scale {
	factor: number;
	center?: Point;
}
interface Rotate {
	angle: number;
	center?: Point;
} // :110-118
interface Flip {
	horizontal?: boolean;
	vertical?: boolean;
} // :120-123
interface Transforms {
	rotate: number;
	flip: { horizontal: boolean; vertical: boolean };
} // :125-131
interface ImageTransform {
	scale?: number | Scale;
	move?: { left?; top? };
	rotate?: number | Rotate;
	flip?: Flip;
} // :141-149
type CoordinatesTransform =
	| ((state: CropperState, settings: CoreSettings) => Partial<Coordinates> | null)
	| Partial<Coordinates>
	| null; // :151-154
enum ImageRestriction {
	fillArea = 'fillArea',
	fitArea = 'fitArea',
	stencil = 'stencil',
	none = 'none'
} // :82-87
enum Priority {
	coordinates = 'coordinates',
	visibleArea = 'visibleArea'
} // :89-92
type BivarianceConstraint<T extends (...a: any) => any> = {
	method(...args: Parameters<T>): ReturnType<T>;
}['method']; // :220-222
```

### 2.2 `CropperState` (`src/types/index.ts:156-170`)

```ts
interface CropperState {
	boundary: Boundary; // on-screen size of the cropper area (px)
	imageSize: ImageSize; // natural image size, UNROTATED
	transforms: Transforms; // cumulative rotate (deg, unbounded) + flip flags
	visibleArea: VisibleArea | null; // the part of the (rotated) image shown in the boundary, image px
	coordinates: Coordinates | null; // the stencil / crop rectangle, image px
}
interface InitializedCropperState {
	/* same but visibleArea & coordinates non-null */
}
```

Invariants and conventions:

- `visibleArea` always has the **boundary's aspect ratio** (enforced by `fitVisibleArea`, `src/service/fitVisibleArea.ts:15-27`).
- **Coefficient** = `visibleArea.width / boundary.width` (image px per screen px), `getCoefficient`
  (`src/service/helpers.ts:38-40`). Every screen-space input (drag deltas, wheel/touch centers) is
  multiplied by it in `normalize*` (`src/service/normalize.ts`).
- Stencil screen box = `getStencilCoordinates(state)` = `(coordinates - visibleArea.topLeft) / coefficient`
  (`src/service/helpers.ts:42-55`).
- The rotated image's bounding size is `getTransformedImageSize(state)` = `rotateSize(imageSize, rotate)`
  (`src/service/helpers.ts:102-111`). Restrictions are expressed in that rotated frame.
- `isInitializedState(state)` means `visibleArea && coordinates` are non-null (`src/service/helpers.ts:14-16`).
  Every reducer is a no-op on uninitialised state.

### 2.3 Settings

```ts
interface CoreSettings {                                   // src/types/index.ts:194-208
  areaPositionRestrictions: AreaPositionRestrictions | (state, settings: this) => AreaPositionRestrictions;
  areaSizeRestrictions:     AreaSizeRestrictions     | (state, settings: this) => AreaSizeRestrictions;
  sizeRestrictions:         SizeRestrictions         | (state, settings: this) => SizeRestrictions;
  positionRestrictions:     PositionRestrictions     | (state, settings: this) => PositionRestrictions;
  aspectRatio:              AspectRatio              | (state, settings: this) => RawAspectRatio;
}
interface InitializeSettings {                             // :210-215
  defaultCoordinates: DefaultCoordinates<this>;   // CoordinatesTransform | CoordinatesTransform[] | fn
  defaultVisibleArea: DefaultVisibleArea<this>;   // VisibleArea | fn
  defaultTransforms?: DefaultTransforms<this>;    // PartialTransforms | fn
  priority?: Priority;
}
interface ModifierSettings {                               // :224-230
  transformImage?: { adjustStencil?: boolean };   // zoom resizes the stencil too
  moveCoordinates?: {}; resizeCoordinates?: {};
}
type AbstractCropperInstanceSettings = CoreSettings & ModifierSettings & InitializeSettings; // instance:100
```

Semantics:

- **sizeRestrictions**: min/max size of `coordinates` (image px). `calculateSizeRestrictions` defaults
  missing fields to `0`/`Infinity`, parses numeric strings, and caps max by the position-restriction span
  (`src/service/sizeRestrictions.ts:39-66`).
- **positionRestrictions**: where `coordinates` may lie (image px).
- **areaSizeRestrictions / areaPositionRestrictions**: same for `visibleArea`. `calculateAreaSizeRestrictions`
  fits finite max values to the boundary ratio. **It mutates the object returned by the setting**
  (`src/service/sizeRestrictions.ts:69-79`). If a user passes a static object, the core writes into it.
  The Svelte layer should hand the core plain snapshots, never `$state` proxies, or it risks
  `state_unsafe_mutation` and surprise mutation of user props.
- **aspectRatio** normalised by `createAspectRatio` (`src/service/utils.ts:328-340`): number → `{min=max}`,
  missing → `{0, Infinity}`.

`DefaultSettings` (extra user-facing knobs consumed by the defaults, `src/defaults/index.ts:44-52`):
`minWidth?, minHeight?, maxWidth?, maxHeight?, defaultSize?: DefaultSize<this>, defaultPosition?:
DefaultPosition<this>, imageRestriction?: ImageRestriction`.

`createDefaultSettings<Settings>(params: DefaultSettingsParams<Settings>)` (`src/defaults/index.ts:104-189`)
returns `{...params, sizeRestrictions, areaPositionRestrictions, areaSizeRestrictions, positionRestrictions,
defaultCoordinates, defaultVisibleArea, aspectRatio}`. Every one of these is a **function** of
`(state, basicSettings)` that uses the user's value if present and otherwise falls back to:

| key                        | fallback                                                                                                                                                                                                                                                          |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sizeRestrictions`         | `pixelsRestrictions` → `{minWidth,minHeight,maxWidth,maxHeight}` from settings (`defaultSizeRestrictions.ts:11-22`)                                                                                                                                               |
| `areaPositionRestrictions` | `defaultAreaPositionRestrictions`. `fillArea`: image bounds. `fitArea`: image bounds on the constrained axis, centred-overflow on the other. `stencil`/`none`: `{}` (`defaultAreaPositionRestrictions.ts:4-55`)                                                   |
| `areaSizeRestrictions`     | `defaultAreaSizeRestrictions`. `fillArea`: max = image. `fitArea`: max = image fitted to boundary ratio. Otherwise unbounded (`defaultAreaSizeRestrictions.ts:4-34`)                                                                                              |
| `positionRestrictions`     | `defaultPositionRestrictions`: image bounds unless `imageRestriction` is unset or `'none'` (`defaultPositionRestrictions.ts:4-22`)                                                                                                                                |
| `defaultCoordinates`       | `[size, (state) => position]`, with size from `params.defaultSize ?? defaultSize` (80% of the visible area/image at the clamped ratio, `defaultSize.ts:11-47`) and position from `params.defaultPosition ?? defaultPosition` (centred, `defaultPosition.ts:4-12`) |
| `defaultVisibleArea`       | `defaultVisibleArea`: fit the coordinates (or the whole image) at the boundary ratio, centred on the stencil, kept inside the image when possible (`defaultVisibleArea.ts:11-78`)                                                                                 |
| `aspectRatio`              | `createAspectRatio(params.aspectRatio)`                                                                                                                                                                                                                           |

Also: `withDefaultSizeRestrictions / withDefaultPositionRestrictions / withDefaultAreaPositionRestrictions /
withDefaultAreaSizeRestrictions(value | fn)` (`:54-102`) merge a user value **with** the default instead of
replacing it.

`defaultStencilConstraints(rawSettings: {aspectRatio?: unknown}, stencilProps: {aspectRatio?: (() =>
RawAspectRatio) | RawAspectRatio})` (`src/defaults/defaultStencilConstraints.ts:13-22`) returns
`{aspectRatio}` from the stencil **only if** the cropper settings have none. This is how the React
`AbstractCropper` lets the stencil component dictate aspect ratio (`stencilConstraints` prop,
`tmp/react-advanced-cropper/src/components/AbstractCropper.tsx:109`).

**Where the "default postprocess / auto zoom" lives:** not in the core defaults. The core has no default
`postProcess`. Auto-zoom variants are opt-in postprocess functions: `fixedStencil`
(`extensions/stencil-size`), `preventZoom` (`extensions/prevent-zoom`), and `fitStencilToImage`/`zoomStencil`
(`showcase/mobile`). React's deprecated `autoZoom` setting maps to `hybridStencilAutoZoom` in
`tmp/react-advanced-cropper/src/deprecated/hybridAutoZoom.ts`, which is a React-layer file.

### 2.4 Postprocess pipeline

```ts
interface PostprocessAction<Name extends string = string> {
	name?: Name;
	immediately?: boolean;
	transitions?: boolean;
	interaction?: boolean;
} // types:268-273
type PostprocessFunction<Settings = CoreSettings, State = CropperState> = BivarianceConstraint<
	(state: State, settings: Settings, action: PostprocessAction) => State
>; // types:275-277
type AbstractCropperInstancePostprocess =
	| 'interactionEnd'
	| 'createState'
	| 'reconcileState'
	| 'transformImage'
	| 'transformImageEnd'
	| 'setCoordinates'
	| 'setVisibleArea'
	| 'setBoundary'
	| 'moveCoordinates'
	| 'moveCoordinatesEnd'
	| 'resizeCoordinates'
	| 'resizeCoordinatesEnd'; // instance:78-90
```

- `props.postProcess` is a function or an array, reduced left to right (`applyPostProcess`, `instance:212-231`).
  The action always arrives normalised: `{name, interaction=false, transitions=false, immediately=false}`.
- `setState(..., {postprocess:true})` emits name **`'setState'`**, which is missing from the union (`instance:510`).
- Convention: "immediately" postprocessors (`fixedStencil`, `preventZoom`, `fitStencilToImage`, `zoomStencil`)
  act only when `action.immediately` is true. That is at the _end_ of an interaction or on programmatic
  calls, not on every pointer move, so the auto-zoom animates once on release.

### 2.5 Reducers (`/state`), signatures and behaviour

```ts
copyState<T extends CropperState | null>(state: T): T                         // deepClone (state/copyState.ts:4)
createState(options: CreateStateOptions, settings: CoreSettings & InitializeSettings): CropperState   // createState.ts:15-50
  interface CreateStateOptions { boundary: Boundary; image: Size & { transforms?: Transforms } }
  // builds state from image.transforms (EXIF), applies defaultTransforms, then:
  //   priority===visibleArea: setVisibleArea(defaultVisibleArea, safe=false) → setCoordinates(defaultCoordinates, 'limit')
  //   else (default):         setCoordinates(defaultCoordinates, 'unsafe') → setVisibleArea(defaultVisibleArea, safe=true)
setCoordinates(state, settings, transform: CoordinatesTransform | CoordinatesTransform[],
               mode: boolean | SetCoordinatesMode = true): CropperState         // setCoordinates.ts:34-149
  enum SetCoordinatesMode { limit, zoom, unsafe }   // true→zoom, false→unsafe
  // each transform: resize (approximateSize w/ aspect+size restrictions) then move (clamped to position restrictions);
  // 'limit' also clamps to the visible area; 'zoom' grows/moves the visibleArea to contain the coordinates then fitVisibleArea.
setVisibleArea(state, settings, visibleArea, safe = true)                       // setVisibleArea.ts:11-28 (fitVisibleArea, then fitCoordinates if safe)
setBoundary(state, settings, boundary)                                          // setBoundary.ts:24-75 (keep visibleArea width, re-ratio, rescale to contain coordinates/min size, re-clamp, fitCoordinates)
moveCoordinates(state, settings, directions: MoveDirections)                    // moveCoordinates.ts:18-38 (applyMove, clamp to visibleArea ∩ positionRestrictions)
resizeCoordinates(state, settings, anchor: ResizeAnchor, directions: MoveDirections, options: ResizeOptions) // resizeCoordinates.ts:29-61
  interface ResizeOptions { compensate?: boolean; preserveAspectRatio?: boolean; respectDirection?: 'width'|'height'; reference?: Coordinates | null }
  // anchoredResizeCoordinatesAlgorithm with size restrictions capped by visibleArea and min = getMinimumSize (≈20 screen px)
transformImage(state, settings: CoreSettings & ModifierSettings, transform: ImageTransform)  // transformImage.ts:8-24
  // rotate → rotateImageAlgorithm; flip → flipImageAlgorithm; move|scale → transformImageAlgorithm
reconcileState(state, settings)                                                 // reconcileState.ts:27-106 (fix ratio/size/position after settings changed)
type CreateStateAlgorithm<S>, SetCoordinatesAlgorithm<S>, SetVisibleAreaAlgorithm<S>, SetBoundaryAlgorithm<S>,
     MoveAlgorithm<S>, ResizeAlgorithm<S>, TransformImageAlgorithm<S>, ReconcileStateAlgorithm<S>   // pluggable via instance props
```

Algorithms worth knowing (`/algorithms`):

- `transformImageAlgorithm` (`src/algorithms/transformImageAlgorithm.ts:23-185`). The scale factor is
  **inverted**: zooming the image in shrinks the visible area. It moves the visibleArea, scales it within area
  and stencil limits, keeps the stencil's relative position, and with `settings.transformImage.adjustStencil`
  resizes only the area when the stencil can't scale.
- `rotateImageAlgorithm` (`rotateImageAlgorithm.ts:28-87`) rotates around `rotate.center` or the stencil centre.
- `flipImageAlgorithm` (`flipImageAlgorithm.ts:14-77`) mirrors the coordinates and the visible area around
  the image centre in the unrotated frame, then toggles the flags.
- `resizeCoordinatesAlgorithm` and `fitDirections` (`resizeCoordinatesAlgorithm.ts:40-346`) do the
  4-direction resize with compensation, aspect-ratio enforcement and limit fitting. `anchoredResizeCoordinatesAlgorithm`
  (`:400-427`) turns an anchor plus a move delta into directions. Quirk: `anchorMoveToResizeDirections` line
  `:375` has `top: 0 && … ? … : -directions.top`, which always evaluates to `-directions.top`.

### 2.6 `/service` (pure helpers, all exported)

- restriction getters (resolve value-or-function): `getSizeRestrictions`, `getPositionRestrictions`,
  `getAreaSizeRestrictions`, `getAreaPositionRestrictions`, `getAspectRatio`, `getDefaultCoordinates`,
  `getDefaultVisibleArea`, `getDefaultTransforms` (`helpers.ts`)
- state queries: `isInitializedState`, `getCoefficient`, `getStencilCoordinates`, `getTransformedImageSize`,
  `getMinimumSize` (magic `20 * coefficient`, `helpers.ts:113-119`), `getRoundedCoordinates`
  (`:120-148`, rounds while keeping restrictions), `isConsistentState` (`:150-162`), `isEqualState` (deepCompare)
- fitting: `fitCoordinates`, `fitVisibleArea`, `approximateSize({width,height,sizeRestrictions?,aspectRatio?}): Size`
- size restrictions: `mergeSizeRestrictions`, `reconcileSizeRestrictions`, `calculateSizeRestrictions`,
  `calculateAreaSizeRestrictions`
- normalisation (screen to image px): `normalizeMoveDirections`, `normalizeResizeDirections`, `normalizeCenter`,
  `normalizeFlip` (swaps h/v when rotated ~90°), `normalizeImageTransform` (**mutates the passed
  transform**, `normalize.ts:71-95`), `fillMoveDirections`, `fillResizeDirections`
- gesture to transform (DOM `getBoundingClientRect`):
  `touchesToImageTransform(touches: SimpleTouch[], previousTouches: SimpleTouch[], container: HTMLElement, options?: {rotate?, move?, scale?})`
  → `{move?, scale?, rotate?}` (`imageTransforms.ts:31-92`), and
  `wheelEventToImageTransform(event: WheelEvent & {wheelDelta?}, container: HTMLElement, ratio = 0.1)`
  → `{scale:{factor, center}}` (`:94-106`)
- interactions: `hasInteractions(i)`, `getEmptyInteractions()` (`interactions.ts`)
- geometry (`utils.ts`): `diff, getCenter, getOppositeSide, sizeDistance, applyDirections, inverseMove, applyMove,
  coordinatesToPositionRestrictions, applyScale, ratio, maxScale, minScale, getBrokenRatio, fitToSizeRestrictions,
  getIntersections, resizeToSizeRestrictions, rotateSize, rotatePoint, positionToSizeRestrictions,
  mergePositionRestrictions, fitToPositionRestrictions, moveToPositionRestrictions, aspectRatioIntersection,
  createAspectRatio, isConsistentSize, isConsistentPosition, getCloserSize`
- `getTransitionStyle(transitions?: CropperTransitions)` → `"<timing> <duration|0>ms"` or `'none'` (`utils.ts:342-344`)

### 2.7 `/utils` (generic)

`getDirectionNames(h?, v?) → {camelCase, snakeCase}` (BEM class helper: `'west-north'` / `westNorth`),
`isBlob, isDataUrl, isLocal, isCrossOriginURL` (reads `window.location`. Bug: the https default port is
`433` at `utils/index.ts:55`), `isArray, isFunction, isUndefined, isObject, isBoolean, isNumber, isString, isNaN, isNumeric`,
`getOptions(options, defaultScheme, falseScheme = {})` (`:93-119`: `true` → defaults, falsy → falseScheme,
object → deep-merged with booleans coerced; React uses it for `moveImage`/`scaleImage` option props),
`parseNumber, distance, isRoughlyEqual(a,b,tol=1e-3), isGreater, isLower, isArrayBufferLike, getCloserAngle, sign,
promiseTimeout(ms)`, `deepClone` (plain objects/arrays only), `deepCompare(a,b,tol=1e-3)` (numeric tolerance),
`isWheelEvent, isTouchEvent, isMouseEvent, emptyCoordinates, isCardinalDirection, isOrdinalDirection`,
`debounce(cb, delay?: number | (() => number)) → fn & {clear()}` (`:287-315`).

### 2.8 Flow of an interaction (end to end)

**Stencil drag (move):**

1. The framework's DraggableArea emits a screen-px delta.
2. The framework calls `cropper.moveCoordinates({left, top})`. Defaults: `interaction:true, transitions:false,
   immediately:false, normalize:true`.
3. `instance:594`: the call is ignored while `data.transitions` is active, and when state is null.
4. `normalizeMoveDirections` multiplies by the coefficient. The `moveCoordinatesAlgorithm` prop or
   `state.moveCoordinates` clamps to visibleArea ∩ positionRestrictions.
5. `applyPostProcess({name:'moveCoordinates', interaction:true, immediately:false, transitions:false})`.
6. `setInteractions({moveCoordinates:true})`. On the first active flag this fires `onInteractionStart`.
7. `updateState(result, {transitions:false}, [onMove])` fires `onChange` (if changed), then `onMove`, then `onUpdate`.
8. On pointer up the framework calls `cropper.moveCoordinatesEnd()`. Defaults: `transitions:true, immediately:false`.
   - `updateState(postprocess 'moveCoordinatesEnd', {transitions:true}, [onMoveEnd])`.
   - `setInteractions({moveCoordinates:false})`. Since no interactions remain, it runs
     `updateState(postprocess {name:'interactionEnd', immediately:true, transitions:true}, {transitions:true}, [onInteractionEnd])`.
     **This is where auto-zoom postprocessors run and animate.**

**Resize:** same shape. `resizeCoordinates(anchor, directions, parameters, options)` → `onResize`.
`resizeCoordinatesEnd()` → `onResizeEnd` → `interactionEnd`. `parameters` (if an object) becomes
`ResizeOptions` (`{compensate, preserveAspectRatio, respectDirection, reference}`); the React stencil passes
`{reference, preserveAspectRatio, respectDirection, compensate}`.

**Image gestures (wheel, touch, drag on the background):** `transformImage(transform)`. Defaults:
`interaction:true, immediately:false, transitions:true, normalize:true`, so no animation (the condition is
`immediately && transitions`) and the interaction flags are set per transform kind. Then
`transformImageEnd()` (debounced by the framework on wheel) → `onTransformImageEnd` → `interactionEnd`.

**Programmatic** (`zoomImage`, `moveImage`, `rotateImage`, `flipImage`, `setCoordinates`, `setVisibleArea`):
`interaction:false, immediately:true, transitions:true`. They run the `*End` postprocess inline, animate,
and never toggle interaction flags.

**Image load / resize:** see §3.7 and the checklist.

---

## 3. `instance/` — `AbstractCropperInstance` in detail

### 3.1 Public types (`src/instance/AbstractCropperInstance.ts`)

```ts
interface TransitionOptions {
	transitions?: boolean;
} // :56-58
interface InteractionOptions {
	interaction?: boolean;
} // :61-63  "should be ended gracefully"
interface ImmediatelyOptions {
	immediately?: boolean;
} // :66-68  "apply postprocess now, transition if allowed"
interface PostprocessOptions {
	postprocess?: boolean;
} // :70-72
interface NormalizeOptions {
	normalize?: boolean;
} // :74-76  "inputs are in screen px; convert"
interface AbstractCropperInstanceData {
	// :92-96
	state: CropperState | null;
	transitions: boolean; // "transition currently active"
	interactions: CropperInteractions;
}
type CropperInteractions = {
	moveCoordinates: boolean;
	resizeCoordinates: boolean;
	transformImage: { rotate: boolean; move: boolean; scale: boolean; flip: boolean };
}; // types:247-256
type StateModifier = (state: CropperState | null, settings: CoreSettings) => CropperState | null; // :98 (not exported)
type AbstractCropperInstanceProps<Settings, Instance> =
	AbstractCropperInstanceParameters<Settings> &
		AbstractCropperInstanceCallbacks<Instance> & { settings: Settings }; // :102-108
type AbstractCropperInstanceCallback<Instance> = (instance: NonNullable<Instance>) => void; // :110
interface AbstractCropperInstanceCallbacks<Instance = unknown> {
	// :112-126
	getInstance?: () => Nullable<Instance>;
	onTransitionsStart?;
	onTransitionsEnd?;
	onChange?;
	onResizeEnd?;
	onMoveEnd?;
	onMove?;
	onResize?;
	onTransformImage?;
	onTransformImageEnd?;
	onInteractionStart?;
	onInteractionEnd?;
	onUpdate?: AbstractCropperInstanceCallback<Instance>;
}
interface AbstractCropperInstanceParameters<Settings extends CoreSettings & InitializeSettings> {
	// :128-139
	transitions?: CropperTransitionsSettings | boolean; // { timingFunction?: string; duration?: number }
	postProcess?: PostprocessFunction<Settings> | PostprocessFunction<Settings>[];
	setCoordinatesAlgorithm?;
	setVisibleAreaAlgorithm?;
	setBoundaryAlgorithm?;
	transformImageAlgorithm?;
	moveCoordinatesAlgorithm?;
	resizeCoordinatesAlgorithm?;
	createStateAlgorithm?;
	reconcileStateAlgorithm?;
}
interface CropperTransitions {
	timingFunction: string;
	duration: number;
	active: boolean;
} // types:241-245
```

### 3.2 Construction contract

```ts
abstract class AbstractCropperInstance<
	Settings extends AbstractCropperInstanceSettings,
	Instance = unknown
> {
	protected abstract setData(data: AbstractCropperInstanceData): void; // :163
	protected abstract getData(): AbstractCropperInstanceData; // :165
	protected abstract getProps(): AbstractCropperInstanceProps<Settings, Instance>; // :167
}
```

- **No constructor parameters.** The compiled ES5 constructor (`dist/instance/AbstractCropperInstance.js:29-30`)
  only assigns the arrow-function members and creates the `endTransitions` debounce. It **never calls** the
  abstract methods, so subclass fields initialised after `super()` are safe.
- **All public methods are own instance properties** (arrow class fields compiled into the constructor), not
  prototype methods. A subclass **cannot override them with prototype methods**, because the own property
  shadows them. Override with class fields if ever needed. Passing them around detached (`const {zoomImage} = cropper`)
  is safe since they are bound.
- The React implementation (`tmp/react-advanced-cropper/src/instance/CropperInstance.ts:14-45`) is the
  reference:
  ```ts
  constructor(props: () => AbstractCropperInstanceProps<S, I>, onChange: () => void) {
    super(); this.props = props; this.notify = onChange;
    this.data = { state: null, transitions: false, interactions: getEmptyInteractions() };
  }
  getProps() { return this.props(); }  setData(d) { this.data = d; this.notify(); }  getData() { return this.data; }
  ```
  `getProps` is a _persistent function_ that rebuilds props each call (`useCropperInstance.ts:29-53`), so the
  core always sees the latest settings and callbacks without re-instantiation.
- Initial data **must** be `{state:null, transitions:false, interactions:getEmptyInteractions()}`.
  `hasInteractions` dereferences `interactions.transformImage.*`.
- `getProps()` is called on every public call (sometimes several times), so it should be cheap. In Svelte a
  `$derived` props object (settings built with `createDefaultSettings`) read through a getter fits well.

### 3.3 Protected machinery

- `getTransitions()` (`:169-179`, public) returns `{...getOptions(props.transitions, {timingFunction:'ease-in-out',
  duration:350}), active: data.transitions}`. With `transitions: false|undefined` it returns **only `{active}`**
  (no duration). The debounce delay then becomes 0. The `.d.ts` types the return as `any`. The Svelte
  layer should type it as `CropperTransitions` and default `transitions` to `true` like React.
- `endTransitions` (`:201-210`, protected) is a `debounce` whose delay is read lazily as `getTransitions().duration`.
  When it fires: `setData({...getData(), transitions:false})`, then `onTransitionsEnd`, `onUpdate`.
  `debounce.clear()` only cancels the **last** timeout (`utils/index.ts:305-312`). Older pending timeouts
  still run `later`, which re-checks the timestamp. So **`setData` may be called after the component is
  destroyed** (up to `duration` ms). `setData` must therefore be tolerant after unmount (a plain `$state.raw`
  write is fine). Call `endTransitions.clear()` on destroy via a subclass method; it is protected.
- `applyPostProcess(action, state)` (`:212-231`): see §2.4.
- `updateState(modifier, {transitions=false} = {}, callbacks = [])` (`:233-274`) is the single commit point:
  1. `state = isFunction(modifier) ? modifier(prev.state, settings) : modifier`.
  2. `tolerance = 1e-3 * coefficient`. `somethingChanged = !deepCompare(prev.state, state, tol)`.
     `affectTransitionProperties` = any of coordinates/boundary/visibleArea/imageSize/transforms changed.
  3. If changed: if `transitions && affect`, call `endTransitions()` (re-arm). Then
     `setData({...prev, state: copyState(state), transitions: transitions && affect})` and run **`onChange`**.
     A non-animated change _cancels_ an active transition flag immediately.
  4. If `transitions` went false→true: **`onTransitionsStart`**.
  5. Run the `callbacks` (per-action, e.g. `onMove`), then **`onUpdate`**. These run _even when nothing changed_.
- `setInteractions(partial)` (`:276-314`) merges and stores the flags if changed. On a none→some edge it fires
  **`onInteractionStart`**. On a some→none edge it runs the `interactionEnd` postprocess (`immediately:true,
  transitions:true`) through `updateState(..., {transitions:true}, [onInteractionEnd])`.

### 3.4 Public method reference (defaults in brackets)

| Method (line)                 | Signature                                                                                                                   | Defaults                                                                          | Postprocess name(s)                                                        | Callbacks                                                                                         | Notes                                                                                                                                              |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `getTransitions` (169)        | `() => CropperTransitions`*                                                                                                 |                                                                                   |                                                                            |                                                                                                   | *typed `any`                                                                                                                                       |
| `getInteractions` (181)       | `() => CropperInteractions`                                                                                                 |                                                                                   |                                                                            |                                                                                                   | deep clone                                                                                                                                         |
| `hasInteractions` (186)       | `() => boolean`                                                                                                             |                                                                                   |                                                                            |                                                                                                   |                                                                                                                                                    |
| `startTransitions` (191)      | `() => void`                                                                                                                |                                                                                   |                                                                            | `onTransitionsStart`+`onUpdate` (only if not already active); later `onTransitionsEnd`+`onUpdate` | forces `transitions:true` for `duration` ms. Use it before a `setState` you want animated by CSS                                                   |
| `resetState` (316)            | `(boundary: Boundary, image: CropperImage) => void`                                                                         |                                                                                   | `createState` (immediately, no transitions)                                | `onChange`, `onUpdate`                                                                            | `updateState(createDefaultState(...))`                                                                                                             |
| `reset` (490)                 | same as `resetState`                                                                                                        |                                                                                   |                                                                            |                                                                                                   | alias                                                                                                                                              |
| `clear` (320)                 | `() => void`                                                                                                                |                                                                                   |                                                                            | `onChange`, `onUpdate`                                                                            | state → `null`                                                                                                                                     |
| `reconcileState` (324)        | `(options?: TransitionOptions) => void`                                                                                     | transitions `false`                                                               | `reconcileState` (immediately)                                             | `onChange`?, `onUpdate`                                                                           | **no-op if `isConsistentState`**. React runs it in a layout effect after every render when no interaction is active (`useCropperAutoReconcile.ts`) |
| `transformImage` (347)        | `(transform: ImageTransform, options?: Interaction & Immediately & Normalize & Transition) => void`                         | interaction `true`, immediately `false`, transitions `true`, normalize `true`     | `transformImage`; if `!interaction` also `transformImageEnd` (immediately) | `onTransformImage` (+`onTransformImageEnd` if !interaction)                                       | animates only when `immediately && transitions`. Sets per-kind interaction flags. `normalize` **mutates** `transform`                              |
| `transformImageEnd` (402)     | `(options?: Immediately & Transition) => void`                                                                              | immediately `true`, transitions `true`                                            | `transformImageEnd`                                                        | `onTransformImageEnd`; then clears flags → `interactionEnd`/`onInteractionEnd`                    |                                                                                                                                                    |
| `zoomImage` (423)             | `(scale: Scale \| number, options?) => void`                                                                                | interaction `false`, immediately `true`, transitions `true`, normalize `false`    | via `transformImage`                                                       |                                                                                                   | factor >1 zooms in. **`normalize:false` means `scale.center` is in image px**, not screen px. Not marked `public` in source but is public          |
| `moveImage` (437)             | `(left: number, top?: number, options?) => void`                                                                            | same as zoomImage                                                                 |                                                                            |                                                                                                   | **image px** by default (normalize false)                                                                                                          |
| `flipImage` (455)             | `(horizontal?: boolean, vertical?: boolean, options?) => void`                                                              | interaction `false`, immediately `true`, transitions `true`, normalize `true`     |                                                                            |                                                                                                   | `normalizeFlip` swaps axes when rotated ~90°. The `normalize` flag is not forwarded to transformImage (harmless)                                   |
| `rotateImage` (477)           | `(rotate: number \| Rotate, options?) => void`                                                                              | interaction `false`, immediately `true`, transitions `true`, normalize `false`    |                                                                            |                                                                                                   | degrees, cumulative                                                                                                                                |
| `setState` (494)              | `(modifier: CropperState \| StateModifier \| null, options?: Transition & Immediately & Interaction & Postprocess) => void` | transitions `true`, immediately `false`, interaction `false`, postprocess `false` | `setState` (only if `postprocess`)                                         | `onChange`?, `onTransitionsStart`?, `onUpdate`                                                    | object modifier is **shallow-merged** into the current state (`{...state, ...modifier}`). `null` clears                                            |
| `setCoordinates` (524)        | `(transforms: CoordinatesTransform \| CoordinatesTransform[], options?: Immediately & Transition) => void`                  | immediately `true`, transitions `true`                                            | `setCoordinates`                                                           |                                                                                                   | uses mode `SetCoordinatesMode.zoom` (visible area zooms out to fit)                                                                                |
| `setVisibleArea` (548)        | `(visibleArea: VisibleArea, options?) => void`                                                                              | immediately `true`, transitions `true`                                            | `setVisibleArea`                                                           |                                                                                                   |                                                                                                                                                    |
| `setBoundary` (565)           | `(boundary: Boundary, options?) => void`                                                                                    | immediately `true`, transitions `false`                                           | `setBoundary`                                                              |                                                                                                   | `transitions` is **not forwarded** to `updateState`, so it never animates. Falsy boundary → `updateState(null)`                                    |
| `moveCoordinates` (583)       | `(directions: Partial<MoveDirections>, options?) => void`                                                                   | interaction `true`, transitions `false`, immediately `false`, normalize `true`    | `moveCoordinates`; if !interaction `moveCoordinatesEnd`                    | `onMove` (+`onMoveEnd`)                                                                           | **ignored while a transition is active**                                                                                                           |
| `moveCoordinatesEnd` (627)    | `(options?: Immediately & Transition) => void`                                                                              | transitions `true`, immediately `false`                                           | `moveCoordinatesEnd`                                                       | `onMoveEnd` → `interactionEnd`                                                                    |                                                                                                                                                    |
| `resizeCoordinates` (643)     | `(anchor: ResizeAnchor, directions: Partial<MoveDirections>, parameters?: unknown, options?) => void`                       | interaction `true`, transitions `false`, immediately `false`, normalize `true`    | `resizeCoordinates`; if !interaction `resizeCoordinatesEnd`                | `onResize` (+`onResizeEnd`)                                                                       | ignored while transition active. Directions are normalised with `normalizeResizeDirections` (adds right/bottom: 0)                                 |
| `resizeCoordinatesEnd` (695)  | `(options?) => void`                                                                                                        | transitions `true`, immediately `false`                                           | `resizeCoordinatesEnd`                                                     | `onResizeEnd` → `interactionEnd`                                                                  |                                                                                                                                                    |
| `getStencilCoordinates` (711) | `() => Coordinates`                                                                                                         |                                                                                   |                                                                            |                                                                                                   | screen px. `emptyCoordinates()` when uninitialised                                                                                                 |
| `getCoordinates` (716)        | `(options?: {round?: boolean}) => Coordinates \| null`                                                                      | round `true`                                                                      |                                                                            |                                                                                                   | rounded via `getRoundedCoordinates`                                                                                                                |
| `getVisibleArea` (731)        | `() => VisibleArea \| null`                                                                                                 |                                                                                   |                                                                            |                                                                                                   | copy                                                                                                                                               |
| `getSettings` (740)           | `() => Settings`                                                                                                            |                                                                                   |                                                                            |                                                                                                   | shallow copy of `props.settings`                                                                                                                   |
| `getState` (745)              | `() => CropperState \| null`                                                                                                |                                                                                   |                                                                            |                                                                                                   | deep copy                                                                                                                                          |
| `getTransforms` (750)         | `() => Transforms`                                                                                                          |                                                                                   |                                                                            |                                                                                                   | `{rotate:0, flip:{false,false}}` when null                                                                                                         |
| `createDefaultState` (764)    | `(boundary, image: CropperImage) => CropperState`                                                                           |                                                                                   | `createState` (immediately, transitions false)                             |                                                                                                   | pure, does not commit. React's `getDefaultState()` uses it                                                                                         |
| `isConsistent` (783)          | `() => boolean`                                                                                                             |                                                                                   |                                                                            |                                                                                                   |                                                                                                                                                    |

Callback order within one `updateState`: `onChange` → `onTransitionsStart` → per-action callbacks → `onUpdate`.
`onInteractionStart` fires from `setInteractions` _before_ the first move's `updateState`.
`onInteractionEnd` fires _after_ the `*End` method's own callbacks.

Callbacks **not** emitted by the core but present in the React public API (React-layer responsibility):
`onReady`, `onError`, `onUpdate` re-fired on image loading changes, and `onLoad*` in `useCropperImage`
(`tmp/react-advanced-cropper/src/hooks/useAbstractCropper.ts:178-188`).

### 3.5 Transitions model

- "Transitions" in the core is just a boolean flag plus timing config. **The core never animates.**
  The framework reads `getTransitions()` and animates the DOM toward the already-final state:
  - The background image uses a CSS transition: `getBackgroundStyle(image, state, transitions)` sets
    `transition: "<duration>ms <timing>"` and `willChange:'transform'` when active (`src/image/index.ts:401-404`).
  - The stencil position/size uses the JS `Animation` class (React `ArtificialTransition` + `useTransition`,
    `tmp/react-advanced-cropper/src/hooks/useTransition.ts:4-29`) to interpolate from the remembered values to the new ones.
  - `getTransitionStyle(transitions)` is a helper for CSS `transition` strings.
- While `active`, the core rejects `moveCoordinates`/`resizeCoordinates`. React also disables the background
  wrapper (`CropperBackgroundWrapper.tsx:55`).
- The flag clears after `duration` ms through the debounce (re-armed by each new animated update).

### 3.6 Subclass checklist (what `getProps()` must return)

```ts
{
  settings: Settings,               // COMPLETE: {...extendedSettings, ...createDefaultSettings(extendedSettings)}
  transitions?: boolean | {timingFunction?, duration?},   // React default true
  postProcess?: fn | fn[],
  ...algorithm overrides?,
  getInstance: () => publicCropperRef,   // REQUIRED for any callback to fire
  onChange?, onUpdate?, onTransitionsStart?, onTransitionsEnd?, onMove?, onMoveEnd?, onResize?, onResizeEnd?,
  onTransformImage?, onTransformImageEnd?, onInteractionStart?, onInteractionEnd?,
}
```

### 3.7 How the framework drives the instance (from React)

- **reset** (image changed): measure the boundary with `stretchTo(image)` (StretchableBoundary uses a
  `stretchCropperBoundary` stretcher and a `fillBoundary` size algorithm), commit `currentImage`, then
  `cropper.reset(boundary, image)` or `clear()` (`useAbstractCropper.ts:78-92`).
- **refresh** (window resize): re-measure. If the boundary changed, `setBoundary(boundary)` then
  `reconcileState()`. If there is no state yet, `reset`. Without boundary or image, `clear()` (`:94-116`).
- **auto-reconcile**: after every render with no interactions, `reconcileState()`. It is paused around
  reset/refresh (`useCropperAutoReconcile.ts`). This is what makes changing settings (aspect ratio,
  min size…) take effect.
- **getCanvas(options?: DrawOptions)**: `drawCroppedArea(state, imgEl, canvas, spareCanvas, options)`.

---

## 4. `animation/` — `Animation` (`src/animation/index.ts`)

```ts
const timingFunctions = { linear, 'ease-in': t^1.675, 'ease-out': 1-(1-t)^1.675, 'ease-in-out': ½(sin((t-½)π)+1) }; // :1-14 (not exported)
interface AnimationOptions { timingFunction: string; duration: number; onStart?(): void; onProgress?(progress: number): void; onStop?(): void } // :16-22 (NOT exported)
class Animation {                                    // :24-92
  endTime?: number; startTime?: number; active: boolean; id?: number;
  onStart?; onProgress?; onStop?; timingFunction?: string;
  start(animation: AnimationOptions): void;  // replaces callbacks; onStart only if !active; cancels pending rAF; restarts clock
  animate(): void;                           // progress = min(1, timing(percent)); onProgress(progress); rAF until percent>=1 then stop()
  stop(): void;                              // active=false; cancelAnimationFrame; onStop()
}
```

- Uses `window.requestAnimationFrame`, `window.cancelAnimationFrame` and `performance.now()`. It must only
  run in the browser (it is inside methods, so constructing it during SSR is fine).
- Unknown timing function: falls back to `ease-out` with a dev warning guarded by
  **`process.env.NODE_ENV !== 'production'`** (`:59`). Only reached on a bad `timingFunction`, but `process`
  must be defined or replaced by the bundler (Vite replaces it). The warning text interpolates the undefined
  function instead of the name (upstream bug).
- Only CSS keyword names work for JS animation. A cubic-bezier string is fine for the CSS-driven background
  but falls back to ease-out for the stencil.
- Svelte mapping: keep a per-component `new Animation()`, expose `active` via `$state`. Driving
  `onProgress` into `$state` values reproduces React's `ArtificialTransition` exactly. Svelte's `Tween`
  would not match the timing curves, so stick with the core `Animation` for parity.

---

## 5. Image, canvas and boundary (DOM-touching helpers)

### 5.1 `image/` (`src/image/index.ts`)

```ts
interface CropperImage { src: string; revoke: boolean; transforms: Transforms; arrayBuffer: ArrayBuffer | null; width: number; height: number } // types:232-239
interface LoadImageSettings { crossOrigin?: string | boolean; checkOrientation?: boolean; parse?: boolean }   // :255-259 (NOT exported)
interface CreateImageSettings { crossOrigin?: string | boolean }                                              // :261-263 (NOT exported)
loadImage(src: string, settings?: LoadImageSettings): Promise<CropperImage>                                   // :321-339
createImage(src: string, settings?: CreateImageSettings): Promise<HTMLImageElement>                           // :290-319
getStyleTransforms(t: Partial<Transforms> & {scale?: number}): string  // " rotate(Xdeg) scaleX(..) scaleY(..)" :117-123
getImageStyle(image: CropperImage, state: CropperState, area: Coordinates, coefficient: number, transitions: CropperTransitions | null = null) // :341-406
getBackgroundStyle(image, state, transitions = null)   // getImageStyle with area=visibleArea, coef=getCoefficient      :408-418
getPreviewStyle(image, state, size: Size, transitions = null) // area=coordinates, coef fits coordinates into size        :420-439
```

`loadImage` pipeline:

1. `parseImage` (`:265-288`): if `checkOrientation || parse`, `getImageData(src)` (`:69-115`) fetches bytes:
   - `data:` → `atob` → ArrayBuffer
   - `blob:` → XHR(`blob`) + `FileReader`
   - other URLs → `XMLHttpRequest` (`withCredentials=false`, `responseType='arraybuffer'`). **Aborts on
     first progress if `content-type !== 'image/jpeg'`**. CORS must allow the fetch, or it warns and falls
     back to no orientation.
2. `resetAndGetOrientation` (`:134-193`) parses the JPEG APP1/EXIF Orientation tag and **rewrites it to 1 in
   the buffer**. `getTransforms(orientation)` maps 2..8 → flip/rotate (`:31-67`; e.g. 6 → rotate 90,
   3 → rotate −180, 8 → −90).
3. `getImage` (`:218-253`): if orientation > 1 the src is replaced with the de-oriented bytes. For blob or
   remote URLs it uses **`URL.createObjectURL(new Blob([buf]))` with `revoke: true`**. For data URLs it
   rebuilds a `data:image/jpeg;base64` URL.
4. `createImage(options.src, settings)` appends a hidden `<img>` (`visibility:hidden; position:fixed`) to
   `document.body`, waits for `load`, removes it, and resolves `{...options, width: naturalWidth, height: naturalHeight}`.
   Rejects with `null` on error.

CORS: `crossOrigin: true` → `'anonymous'`, a string is used verbatim (`:294-296`). `loadImage` passes
`crossOrigin` to `createImage` **unconditionally** (the `isCrossOriginURL` gating only goes into
`parseImage`, which ignores it). React sets `crossOrigin = isUndefined(crossOrigin) ? canvas : crossOrigin`
(`useCropperImage.ts:33-36`), so with the default `canvas=true` remote images load as anonymous-CORS
(needed to keep the canvas untainted).

**Revoking object URLs: the core never calls `URL.revokeObjectURL`, and neither does React** (a grep of
`tmp/react-advanced-cropper/src` finds nothing). `CropperImage.revoke` is a hint for the host. Svelte can
revoke the previous image's `src` when `revoke` is true and it is replaced or destroyed. This is a
harmless improvement; note it as a deliberate deviation if added.

Styles returned by `getImageStyle` are a **React-style camelCase object**: `{width, height, left, top,
transition, transform, willChange}` (`:388-405`). Svelte needs a tiny `styleObjectToString` (`willChange` →
`will-change`) or `style:` directives. The image is rendered at an "optimal" ≤512px box and scaled with
`transform` (translate3d + rotate + scaleX/Y). That is why the CSS sets `transform-origin:center` and
`max-width:none !important` on the background and preview images.

### 5.2 `canvas/` (`src/canvas/index.ts`)

```ts
interface UpdateOptions { imageSmoothingQuality?: 'low'|'medium'|'high'; imageSmoothingEnabled?: boolean; fillColor?: string } // :5-9 (NOT exported)
interface DrawOptions extends UpdateOptions { width?; height?; minWidth?; maxWidth?; minHeight?; maxHeight?; maxArea? } // :105-113
prepareSource(canvas: HTMLCanvasElement, image: HTMLImageElement | HTMLCanvasElement, transforms: Transforms): HTMLCanvasElement // :11-55
updateCanvas(canvas, source, coordinates: Coordinates, resultSize?: Size, options?: UpdateOptions): HTMLCanvasElement            // :57-103
drawCroppedArea(state: CropperState, image: HTMLImageElement | HTMLCanvasElement, resultCanvas: HTMLCanvasElement,
                spareCanvas: HTMLCanvasElement, options: DrawOptions): HTMLCanvasElement | null                                   // :114-168
```

- If rotated or flipped, `prepareSource` first draws the full transformed image into `spareCanvas`.
- Output size is `approximateSize` of the coordinates within `width/height` (exact) or `min/max` limits at the
  same ratio, then capped by `maxArea` (`:142-164`). Defaults: `imageSmoothingEnabled:true`,
  `imageSmoothingQuality:'high'`, `fillColor:'transparent'`.
- Handles negative left/top (stencil outside the image) by offsetting the draw (`:86-99`).
- The host must provide **two hidden canvases** and the **loaded `<img>` element**. React's `CropperCanvas`
  renders `<canvas class="advanced-cropper-canvas">` ×2 (CSS `display:none`), and `CropperSource` renders the
  `<img class="advanced-cropper-source">` with `crossOrigin` set when `canvas` is enabled.

### 5.3 `boundary/` (`src/boundary/index.ts`) and `defaults/defaultBoundary.ts`

```ts
type BoundaryStretchAlgorithm = (boundary: HTMLElement, stretcher: HTMLElement, size: Size) => void; // :49
stretchCropperBoundary(boundary, stretcher, size)   // :4-17  writes stretcher.style.width/height so it takes the image ratio, ≥ boundary client size
stretchPreviewBoundary(boundary, stretcher, size)   // :19-47 same with getBoundingClientRect, then clamps to fit inside the boundary
type BoundarySizeAlgorithm = (boundary: HTMLElement, size: Size) => Boundary;  // types:172
fitBoundary(boundary: HTMLElement, size: Size): Boundary   // defaultBoundary.ts:3-19 (clientWidth/Height, contain-fit)
fillBoundary(boundary: HTMLElement): Boundary              // defaultBoundary.ts:21-27 (getBoundingClientRect)
```

These read layout synchronously (`clientWidth`, `getBoundingClientRect`) right after writing `style`, which
forces layout. They must run after the elements are mounted. Svelte: call them from an attachment or
`$effect` / an imperative `stretchTo(size)` method on the StretchableBoundary component, after `await tick()`
if the image size just changed. React's `StretchableBoundary.stretchTo` returns a promise of the measured
`Boundary` (`useAbstractCropper.ts:82`).

---

## 6. Styles and themes

### 6.1 Shipped artefacts

`node_modules/advanced-cropper/styles/` and `/themes/` contain **only `.scss`** (21 files in `src/styles`,
5 in `src/themes`; dist also has flattened duplicates of every `styles/**` file at `styles/*.scss`).
**No `.css` ships in the core.** `styles/index.scss` uses `@import 'service/…'` (deprecated in Dart Sass
≥1.80; expect deprecation warnings) and defines **no variables**: structural CSS only. Colours come from
themes.

### 6.2 `src/styles/**` (class inventory, BEM `advanced-cropper-*`)

| File                                  | Block / elements / modifiers                                                                                                                                                         |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `AbstractCropper.scss`                | `.advanced-cropper` (overflow hidden, black bg, flex column, white text, `* {box-sizing:border-box}`), `__boundary`, `__wrapper`, `__background-wrapper`, `__stencil-wrapper`        |
| `service/StretchableBoundary.scss`    | `.advanced-cropper-boundary` (user-select none, `direction:ltr`, relative), `__content`, `__stretcher`                                                                               |
| `service/CropperWrapper.scss`         | `.advanced-cropper-wrapper__fade`                                                                                                                                                    |
| `service/CropperFade.scss`            | `.advanced-cropper-fade` (hidden, opacity 0, `transition .5s`), `--visible`                                                                                                          |
| `service/CropperBackgroundImage.scss` | `.advanced-cropper-background-image` (absolute, `transform-origin:center`, `max-width:none!important`)                                                                               |
| `service/CropperCanvas.scss`          | `.advanced-cropper-canvas` (`display:none`)                                                                                                                                          |
| `service/CropperSource.scss`          | `.advanced-cropper-source` (1×1, hidden)                                                                                                                                             |
| `service/StencilOverlay.scss`         | `.advanced-cropper-stencil-overlay` (`box-shadow: 0 0 0 1000px currentColor`)                                                                                                        |
| `service/StencilWrapper.scss`         | `.advanced-cropper-stencil-wrapper` (`will-change:transform`)                                                                                                                        |
| `service/ArtificialTransition.scss`   | `.advanced-cropper-artificial-transition` (`will-change:transform`)                                                                                                                  |
| `service/StencilGrid.scss`            | `.advanced-cropper-stencil-grid`, `--visible`, `__row`, `__cell`, `__cell--top/--left/--right/--bottom`                                                                              |
| `service/BoundingBox.scss`            | `.advanced-cropper-bounding-box`, `__handler-wrapper--{east,west,south,north,west-north,west-south,east-north,east-south}`, `__handler--{8 dirs}`, `__line--{north,south,west,east}` |
| `service/HandlerWrapper.scss`         | `.advanced-cropper-handler-wrapper` (30×30, translate −50%), `__draggable`, `--{8 dirs}` (cursors), `--disabled`                                                                     |
| `service/LineWrapper.scss`            | `.advanced-cropper-line-wrapper--{north,south,east,west}` (12px hit areas, cursors), `--disabled`, `__content`, `__content--{east,west,north,south}`                                 |
| `service/DraggableElement.scss`       | `.advanced-cropper-draggable-element {}` (empty)                                                                                                                                     |
| `stencils/RectangleStencil.scss`      | `.advanced-cropper-rectangle-stencil`, `__draggable-area`, `__overlay`, `__preview`, `__grid`, `--movable` (cursor move)                                                             |
| `stencils/CircleStencil.scss`         | `.advanced-cropper-circle-stencil` (same elements; `__overlay`/`__preview` `border-radius:50%`), `--movable`                                                                         |
| `lines/SimpleLine.scss`               | `.advanced-cropper-simple-line`, `--north/--south/--east/--west` (1px border side)                                                                                                   |
| `handlers/SimpleHandler.scss`         | `.advanced-cropper-simple-handler` (`display:block`)                                                                                                                                 |
| `helpers/CropperPreview.scss`         | `.advanced-cropper-preview`, `__content`, `__image`, `__image--visible`, `__boundary`                                                                                                |
| `helpers/CropperPreviewWrapper.scss`  | `.cropper-preview-wrapper__fade` (**not** `advanced-cropper-` prefixed; upstream inconsistency, keep verbatim)                                                                       |
| `mixins.scss`                         | `@mixin grid()` using an undefined `$grid-color`. **Not imported** by `index.scss` (dead)                                                                                            |
| `index.scss`                          | `@import`s all of the above (except mixins) in order: service → stencils → lines → handlers → helpers → AbstractCropper                                                              |

State modifiers referenced by themes but applied by framework components (must be emitted by the Svelte
components with identical names): `advanced-cropper-simple-handler--hover`, `--{direction}`;
`advanced-cropper-simple-line--hover`; `advanced-cropper-{circle,rectangle}-stencil--moving`/`--resizing`;
`advanced-cropper-simple-handler-wrapper` and `--{direction}` (emitted by React `SimpleHandler.tsx:43-46`;
styled only by `compact.scss`, with no base styles).

### 6.3 Themes (`src/themes/*.scss`), all variables `!default`

| Theme          | Variables (defaults)                                                                                                                                                                                                                                                                               | Targets                                                                                                                                                   |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `default.scss` | `$base-color: white`, `$handler-color: $base-color`, `$line-color: $base-color`, `$grid-color: $line-color`, `$handler-size: 10px`                                                                                                                                                                 | handler bg `currentColor`, line `rgba($line,.3)` solid + `--hover`, circle `__preview` border, **overlay `color: rgba(black,.5)`**, grid `rgba($grid,.4)` |
| `classic.scss` | `$base-color: white`, `$accent-color: currentColor`, `$handler-color: $accent-color`, `$line-color`, `$grid-color`, `$handler-size: 8px`, `$grid: true` (unused)                                                                                                                                   | lines, handlers (opacity .5 / `--hover` 1), circle stencil tweaks, `--moving/--resizing` handlers opaque, grid `.7`                                       |
| `compact.scss` | + `$big-handler-color`, `$small-handler-color`, `$big-handler-size: 16px`, `$small-handler-size: 4px`, `$big-handler-width: 2px`, `$handler-wrapper-size: $big-handler-size + 8px` (not `!default`)                                                                                                | `.advanced-cropper-simple-handler-wrapper` sizing/corner transforms, L-shaped corner handlers, circle tweaks, grid                                        |
| `corners.scss` | `$accent-color`, `$base-color`, `$line-color`, `$line-width: 2px`, `$handler-color`, `$big-handler-color`, `$big-handler-size: 16px`, `$big-handler-width: $line-width + 1px`, `$small-handler-size: 0px`, `$small-handler-color`, `$handler-padding: 4px`, `$handler-wrapper-size`, `$grid-color` | thicker lines, `.advanced-cropper-bounding-box__handler--{corner}` transforms, L-corners, grid `.5`                                                       |
| `bubble.scss`  | `$base-color`, `$accent-color`, `$handler-color`, `$line-color`, `$handler-size: 14px`, `$hover-handler-size: 25px`, `$grid-color`                                                                                                                                                                 | round handlers with springy size transition, lines, `--moving/--resizing`, grid                                                                           |

Note: only `default.scss` sets the overlay colour. React bundles `default` into `style.css`, and the other
themes are layered on top of it (they are overrides, not standalone).

### 6.4 How React ships CSS (to replicate the import paths)

- `tmp/react-advanced-cropper/src/index.ts:56-57` imports `advanced-cropper/styles/index.scss` and
  `advanced-cropper/themes/default.scss`. Rollup `rollup-plugin-scss` + `postcss` (autoprefixer) **extract** them
  into `dist/style.css` (`rollup.config.js:50-56`). The JS bundle itself has no CSS import, so consumers must
  import the CSS explicitly.
- `scripts/themes.js` compiles each of `compact, classic, bubble, corners, default` from
  `node_modules/advanced-cropper/themes/<t>.scss` with node-sass + autoprefixer into `dist/themes/<t>.css`,
  and **copies the `.scss`** into `dist/themes/<t>.scss`.
- `package.json`: `"sideEffects": ["**/*.css"]`, `"files": ["dist"]`, no `exports` field (so deep paths work).
- Consumer-facing paths (README / docs): `import 'react-advanced-cropper/dist/style.css'`,
  `import 'react-advanced-cropper/dist/themes/{corners,classic,compact,bubble}.css'`, and SCSS customisation
  `@import '~react-advanced-cropper/dist/themes/classic.scss'` after setting `$` variables.

**Svelte replication:**

- Compile `advanced-cropper/styles/index.scss` + `themes/default.scss` → `dist/style.css`, and each theme →
  `dist/themes/<t>.css`. Copy the theme `.scss` to `dist/themes/`. This needs `sass` (Dart Sass) and
  ideally autoprefixer in devDependencies (neither is installed now). Expect `@import` deprecation warnings;
  silence with `silenceDeprecations: ['import']` or compile via a small script.
- **`package.json#exports` currently only has `"."`**. Add `"./dist/style.css": "./dist/style.css"` and
  `"./dist/themes/*": "./dist/themes/*"`. Optional aliases like `"./style.css"` are fine, but keep the React
  paths for parity. `sideEffects: ["**/*.css"]` is already set. With `@sveltejs/package`, generated CSS must
  land in `dist/` after `svelte-package` runs, or be emitted into `src/lib` before it. `svelte-package`
  copies non-Svelte files verbatim.
- Do **not** put these styles in Svelte `<style>` blocks. They must be global, unscoped and overridable by
  themes, exactly like React.

---

## 7. DOM and browser API surface

| Area                                                          | APIs touched by the core                                                                               | When                                        |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------- |
| `utils.isCrossOriginURL`                                      | `window.location`                                                                                      | `loadImage`                                 |
| `image.getImageData`                                          | `XMLHttpRequest`, `FileReader`, `atob`                                                                 | `loadImage` with `checkOrientation`/`parse` |
| `image.getImage`                                              | `URL.createObjectURL`, `Blob`, `btoa`                                                                  | EXIF orientation > 1                        |
| `image.createImage`                                           | `document.createElement('img')`, `document.body.appendChild/removeChild`, img `load`/`error` listeners | every `loadImage`                           |
| `canvas.*`                                                    | `HTMLCanvasElement.getContext('2d')`, `drawImage`, `naturalWidth`                                      | `getCanvas`                                 |
| `boundary.*`, `defaults/defaultBoundary`                      | `element.style.width/height`, `clientWidth/Height`, `getBoundingClientRect`                            | boundary measurement                        |
| `service/imageTransforms`                                     | `container.getBoundingClientRect()`                                                                    | wheel/touch transforms                      |
| `utils.isWheelEvent/isTouchEvent/isMouseEvent`                | `in` checks on Event objects                                                                           | event routing                               |
| `animation.Animation`                                         | `requestAnimationFrame`, `cancelAnimationFrame`, `performance.now`, `process.env.NODE_ENV`             | JS transitions                              |
| `utils.debounce`, `promiseTimeout`, instance `endTransitions` | `setTimeout`/`clearTimeout`                                                                            | transitions end, unload delay               |

Left entirely to the framework layer: pointer/mouse/touch/wheel **event listeners** and their
`preventDefault`/passive handling (React `DraggableElement`, `TransformableImage`), window resize
listening (`useWindowResize`), rendering the `<img>` source and canvases, applying style objects, focus
and keyboard handling (none upstream), the image loading state machine (`useCropperImage`: `unloadTime`,
race guards), and auto-reconcile scheduling.

SSR: no module-level DOM access anywhere, so importing every subpath on the server is safe. Only call the
above inside `onMount`/`$effect`/attachments/event handlers.

---

## 8. Core tests (`tmp/advanced-cropper/tests`, jest + ts-jest, `testEnvironment: 'node'`)

| File                                             | Covers                                                                                                                             |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| `utils.test.ts`                                  | `getOptions` with true/false/partial object schemes                                                                                |
| `service/approximateSize.test.ts`                | table of `approximateSize` inputs (restrictions + aspect ratio) → expected sizes                                                   |
| `service/utils/aspectRatioIntersection.test.ts`  | intersection correctness; main ratio never broken                                                                                  |
| `service/utils/rotateSize.test.ts`               | `rotateSize` at various angles                                                                                                     |
| `defaults/defaultStencilConstraints.test.ts`     | aspect ratio taken from stencil only when settings lack one                                                                        |
| `extensions/arbitraryRotate/boundingBox.test.ts` | `fitToImage` on a rotated image. Imports `BoundingBoxType` from `boundingBox.ts`, which doesn't re-export it (likely stale/broken) |

That is 243 lines in total. Coverage of `AbstractCropperInstance`, the reducers and the DOM helpers is
**nil**, so our own tests are the only safety net for instance wiring (callback order, transitions,
interaction lifecycle). We won't port these.

---

## 9. Packaging gotchas (SvelteKit / Vite ESM)

Verified empirically with probes in `tmp/scratch-core` (since deleted) on Node 26.10, Vite 8.3.3,
TypeScript 6.0:

1. **No `exports`, no `"type": "module"`.** The root resolves via `main` (`./node/index.js`, CJS) in Node
   and via `module` (`./index.js`, ESM) in bundlers. ESM files are `.js` in a non-module package.
2. **Plain Node ESM:** `import('advanced-cropper')` works (CJS main, 148 named keys detected).
   `import('advanced-cropper/state')` (and every other subpath) **fails with `ERR_UNSUPPORTED_DIR_IMPORT`**,
   because Node ESM ignores nested `package.json` proxy dirs. `advanced-cropper/state/index.js` works on
   Node 26 only thanks to module-syntax detection (unflagged in Node 22.7; older Node would throw
   "Cannot use import statement outside a module", so verify the floor if it matters).
3. **Vite dev SSR (`ssrLoadModule`)**: root + `/state` + `/extensions/stencil-size` + `/showcase/mobile` all load
   fine, with or without `ssr.noExternal`.
4. **Vite SSR build output** keeps them external but **rewrites subpaths to `advanced-cropper/state/index.js`**
   (the ESM file) while the root stays bare (→ CJS). It runs on Node 26. Consequences:
   - **Dual-package hazard in SSR**: root-imported and subpath-imported modules are different copies
     (CJS vs ESM). This is harmless for pure functions and string enums. Avoid relying on class identity
     (`instanceof AbstractCropperInstance`) across entry points.
   - Mitigation: **import everything available from the root `'advanced-cropper'`**, and use subpaths
     only for `extensions/*` (and `showcase/mobile` if exposed), which the root lacks. Optionally document
     `ssr.noExternal: ['advanced-cropper']` for consumers on older Node. With it, Vite bundles the ESM copy
     (verified working).
5. **Types**: root `package.json` has `"types": []` (invalid). TS warns in trace ("Expected type of 'types'
   field … got 'object'") but falls back to `index.d.ts`. Subpaths resolve through nested
   `package.json#types`. **Both `moduleResolution: bundler` and `nodenext` typecheck cleanly** with
   `skipLibCheck: false`. `getTransitions` is typed `() => any` in the `.d.ts`; annotate on our side.
   `AnimationOptions`, `LoadImageSettings`, `CreateImageSettings`, `UpdateOptions` and `StateModifier` are not
   exported. Recreate them as `Parameters<typeof fn>[n]` or local types.
6. **`tslib`**: a real dependency (`^2.4.0`, pnpm resolves 2.8.1), imported by 22 ESM files (`__assign`,
   `__rest`, `__spreadArrays`). Declared by the core, so pnpm strict mode is fine. Nothing to add on our side.
7. **ES5 output**: the base class is an ES5 constructor. Extending it with a native `class … extends` and
   ES2022 fields (including Svelte `$state` fields) works. Members are own properties, as noted in §3.2.
8. **`sideEffects: false`** everywhere (root + nested). Tree-shaking is safe. The SCSS is not referenced by JS.
9. `process.env.NODE_ENV` in `animation/index.js:41`: Vite replaces it in client builds and Node has
   `process` in SSR. Fine for Vite consumers; non-Vite browser bundlers that don't define it would only crash
   on an invalid timing function.
10. Our re-export surface (`export * from 'advanced-cropper'` plus `/defaults`, `/algorithms`, `/image`,
    `/canvas`, `/service`, `/state`) duplicates names already in the root barrel. That is legal (identical
    bindings), but under the SSR dual-package split above the duplicates come from different module copies.
    Prefer re-exporting from the root only, plus anything the root lacks (`StencilSize` type).

---

## 10. What the Svelte layer must supply to the core (checklist)

**Instance subclass (`CropperInstance`):**

- [ ] `class CropperInstance<S, I> extends AbstractCropperInstance<S, I>` with
      `#data = $state.raw<AbstractCropperInstanceData>({ state: null, transitions: false, interactions: getEmptyInteractions() })`.
- [ ] `protected getData()` returns `this.#data` (synchronous, latest).
- [ ] `protected setData(d)` assigns `this.#data = d`. It must tolerate calls after destroy (late `endTransitions`).
- [ ] `protected getProps()` returns the current props: a getter over the component's props or `$derived`. Cheap,
      plain (snapshotted) settings, never deep `$state` proxies (the core mutates `areaSizeRestrictions`
      results and `transform` args).
- [ ] Expose a `destroy()` that calls `this.endTransitions.clear()` (protected, so it needs a subclass method).
- [ ] Do not try to override public methods with prototype methods (§3.2).

**Props / settings building (mirror `useCropperInstance`):**

- [ ] `settings = { imageRestriction: ImageRestriction.fitArea, transformImage: { adjustStencil: true }, ...userSettings }`,
      then `{ ...extended, ...createDefaultSettings(extended) }`.
- [ ] `transitions` defaults to `true`. Pass through `postProcess` and all 8 `*Algorithm` overrides.
- [ ] Merge stencil constraints (`defaultStencilConstraints(settings, stencilProps)` or `fixedStencilConstraints`)
      into settings as React's `AbstractCropper` does.
- [ ] **`getInstance: () => publicRef`** or no callback will ever fire. Wire all 12 core callbacks to component
      props (`onChange`, `onUpdate`, `onTransitionsStart/End`, `onMove/End`, `onResize/End`,
      `onTransformImage/End`, `onInteractionStart/End`).

**Image pipeline (mirror `useCropperImage`):**

- [ ] `loadImage(src, { crossOrigin: crossOrigin ?? canvas, checkOrientation })`, with an `unloadTime` delay
      (`promiseTimeout`) and stale-src guards. Emit `onReady`/`onError`/loading state yourself.
- [ ] Optionally revoke `CropperImage.src` when `revoke` is true (upstream never does; document it if added).
- [ ] Render the hidden `<img class="advanced-cropper-source">` (with `crossOrigin` when `canvas`) as the
      `drawCroppedArea` source.

**Layout (mirror `StretchableBoundary` + `useAbstractCropper`):**

- [ ] Boundary + stretcher elements. `stretchTo(image)` runs `stretchCropperBoundary` (or the `stretchAlgorithm`
      prop), then `fillBoundary` (or the `sizeAlgorithm` prop) → `Boundary`.
- [ ] `reset()`: pause auto-reconcile, measure, set the current image, `cropper.reset(boundary, image)` | `clear()`.
- [ ] `refresh()` on window resize: `setBoundary` + `reconcileState` when the size changed, `reset` if there is no state.
- [ ] Auto-reconcile: after each update with `autoReconcileState` and `!hasInteractions()`, call `reconcileState()`
      (an `$effect.pre`/`$effect` reading the props/settings snapshot).

**Interaction plumbing (framework-owned):**

- [ ] Pointer/touch/wheel listeners → `moveCoordinates`/`resizeCoordinates`/`transformImage` (screen-px deltas,
      `normalize` default) and the matching `*End` calls on release. Debounce wheel → `transformImageEnd`.
- [ ] Use `touchesToImageTransform` / `wheelEventToImageTransform` with the boundary container element.
- [ ] Honour `getTransitions().active`: disable dragging, animate the stencil with `Animation`
      (ArtificialTransition), and style the background image with `getBackgroundStyle` (convert the camelCase object to CSS).

**Output and public ref (mirror `cropperInterface`, `useAbstractCropper.ts:117-168`):**

- [ ] Expose `reset, refresh, setImage, reconcileState, moveCoordinates(End), resizeCoordinates(End), clear,
      moveImage, flipImage, zoomImage, rotateImage, transformImage(End), setCoordinates, setVisibleArea,
      startTransitions, setState, hasInteractions, getStencilCoordinates, getCoordinates, getVisibleArea,
      getTransforms, getTransitions, getInteractions, getSettings, getState, getDefaultState, getCanvas, getImage,
      isLoading, isLoaded`.
- [ ] `getCanvas(options?: DrawOptions)` → `drawCroppedArea(state, sourceImg, canvas, spareCanvas, options)` with two
      hidden `<canvas class="advanced-cropper-canvas">`.

**CSS:**

- [ ] Build `dist/style.css` (styles + default theme) and `dist/themes/*.{css,scss}`. Add `exports` entries for them.
- [ ] Emit identical BEM class names and modifiers (`--hover`, `--moving`, `--resizing`, `--{direction}`,
      `-simple-handler-wrapper`, and `cropper-preview-wrapper__fade` verbatim).

**Re-exports:**

- [ ] `export * from 'advanced-cropper'` (+ the React list of subpath re-exports, ideally deduped to the root) and
      `export type { StencilSize }`.

# 03 — Hooks, instance, service, types: react-advanced-cropper → Svelte 5

Scope: `tmp/react-advanced-cropper/src/{hooks/**, instance/**, service/**, types.ts, deprecated/**, index.ts}`
(react-advanced-cropper 0.20.2, `git describe` = `0.15.0-39-ga51e293`) and the parts of
`tmp/advanced-cropper/src/instance/AbstractCropperInstance.ts` (core 0.17.1, the same version as
`node_modules/advanced-cropper`) that these files drive. Where component code is the only consumer of a hook,
the component is cited too. Component internals are covered in `02-components.md`, and the core in `01-core.md`.

Conventions: `R:` = `tmp/react-advanced-cropper/src/`, `C:` = `tmp/advanced-cropper/src/`.
"Public" = reachable from `R:index.ts`.

---

## 0. TL;DR

1. The React layer is thin. `CropperInstance` (`R:instance/CropperInstance.ts`, 45 lines) only stores
   `data` in a plain field and calls a force-rerender callback on every `setData`. All cropper logic, callback
   ordering and transitions live in the core `AbstractCropperInstance`.
2. The real orchestration is `useAbstractCropper` (`R:hooks/useAbstractCropper.ts`, 201 lines). It runs the image
   loader, sets the boundary, resets state on image change, refreshes on window resize, reconciles state after every
   render, and builds the 33-method imperative `cropper` object, which is the `CropperRef`.
3. The Svelte port collapses `useForceRerender`, `usePersistentFunction`, `useStateWithCallback`, `useFirstMountState`,
   `useCropperAutoReconcile`'s pause/resume state, and `createCropper`/`forwardRef` into these pieces:
   - `$state.raw` data on the instance
   - getter-function props
   - `$effect` / `$effect.pre`
   - plain sequential code
   - component `export function`s
4. Public hooks keep their names. Each becomes a function in a `.svelte.ts` module and must be called during component
   init. Where React passes a value that changes over renders, Svelte takes a **getter** (upstream already does this for
   `useAbstractCropper` and `useCropperInstance`).
5. There is **no** window-resize debounce upstream (resize → `refresh()` runs on every event). The deprecated
   `autoZoom`/`stencilSize` path in `<Cropper>` is **dead code**. `AbstractCropper` is **not** exported from `index.ts`.

---

## 1. `CropperInstance` and the core `AbstractCropperInstance`

### 1.1 React `CropperInstance` (`R:instance/CropperInstance.ts:1-45`)

```ts
export interface CropperInstanceProps<Settings extends AbstractCropperInstanceSettings, Instance> {
	getProps: () => AbstractCropperInstanceProps<Settings, Instance>;
	setData?: (data: AbstractCropperInstanceData) => void;
} // :9-12 — declared but UNUSED anywhere (constructor takes positional args)

export class CropperInstance<
	Settings extends AbstractCropperInstanceSettings,
	Instance = unknown
> extends AbstractCropperInstance<Settings, Instance> {
	data: AbstractCropperInstanceData;
	notify: () => void;
	props: () => AbstractCropperInstanceProps<Settings, Instance>;
	constructor(props: () => AbstractCropperInstanceProps<Settings, Instance>, onChange: () => void) {
		super();
		this.props = props;
		this.notify = onChange;
		this.data = { state: null, transitions: false, interactions: getEmptyInteractions() };
	}
	protected getProps() {
		return this.props();
	}
	protected setData(data: AbstractCropperInstanceData) {
		this.data = data;
		this.notify();
	}
	protected getData(): AbstractCropperInstanceData {
		return this.data;
	}
}
```

- **React state held:** none. `data` is a plain mutable field. Re-render happens because `notify` is the
  `useForceRerender` setter (`R:hooks/useForceRerender.ts:3-9`, `setTick({})`). So **every** `setData` schedules
  a re-render. In React event handlers several `setData`s batch into one render. Outside handlers (promises,
  timers) React 17 renders synchronously per call, while React 18 batches automatically.
- Reads (`getData`) are always synchronous and current. The core reads its own writes immediately. The rendered
  output lags until React commits.
- Not exported publicly. `R:index.ts` never re-exports `instance/`, and the core exports no `CropperInstance` name.
  It is reachable as a type only via `CropperStateHook = ReturnType<typeof useCropperInstance>`.

### 1.2 Core contract (`C:instance/AbstractCropperInstance.ts`)

Abstract hooks a subclass must provide (`:163-167`): `setData(data)`, `getData()`, `getProps()`.

```ts
export interface AbstractCropperInstanceData {
	// :92-96
	state: CropperState | null;
	transitions: boolean;
	interactions: CropperInteractions;
}
export type AbstractCropperInstanceProps<Settings, Instance> = // :102-108
	AbstractCropperInstanceParameters<Settings> &
		AbstractCropperInstanceCallbacks<Instance> & { settings: Settings };
```

All public methods are **arrow-function class fields**, so they are pre-bound. That is why the React layer can pass
`cropper.moveImage` around detached (`R:hooks/useAbstractCropper.ts:121-145`), and Svelte can too.

**`updateState(modifier, {transitions}, callbacks)`** (`:233-274`) is the single funnel for state changes. It
fixes the callback order:

1. Compute `state` (call the modifier with `(previousState, settings)` if it is a function).
2. `somethingChanged = !deepCompare(prev.state, state, 1e-3 * coefficient)`.
3. If something changed:
   - If `transitions && affectTransitionProperties`, call `this.endTransitions()`. This (re)arms the debounce.
   - `setData({...data, state: copyState(state), transitions: transitions && affect})`.
   - Run **`onChange`**.
4. If `transitions` went from false to true, run **`onTransitionsStart`**.
5. Run `[...callbacks, onUpdate]`. `callbacks` is e.g. `onMove`, `onResize`, `onTransformImage`, `onMoveEnd`, …
   **`onUpdate` fires on every `updateState` call, even when nothing changed.**

`runCallback` (`:141-151`) invokes a callback only if `getInstance()` returns a truthy value. React exploits this:
before mount and after unmount `cropperRef.current` is `null`, so callbacks are suppressed (§3.6).

**Interactions** (`setInteractions`, `:276-314`): `onInteractionStart` fires when the interaction set flips from empty to
non-empty. That happens **before** the `updateState` of the same `moveCoordinates`/`resizeCoordinates`/`transformImage`
call (`:605-608` comes before `:617`), so on the first move the order is `onInteractionStart → onChange → onMove → onUpdate`.
When interactions end, an `interactionEnd` post-process runs through `updateState(..., {transitions: true}, [onInteractionEnd])`.
The sequence for `moveCoordinatesEnd` (`:627-641`):
`updateState(moveCoordinatesEnd pp) → [onChange?] onMoveEnd, onUpdate`, then `setInteractions(false)`
`→ updateState(interactionEnd pp) → [onChange?] [onTransitionsStart?] onInteractionEnd, onUpdate`.

**Transitions** (`:169-210`):

- `getTransitions()` = `{...getOptions(props.transitions, {timingFunction: 'ease-in-out', duration: 350}), active: data.transitions}`.
  It reads both props and data, so it is reactive to both in Svelte.
- `startTransitions()` sets `transitions: true` and fires `onTransitionsStart` + `onUpdate` only if the flag was not
  already set. It then calls the debounced `endTransitions`.
- `endTransitions = debounce(() => { setData({...transitions: false}); run onTransitionsEnd, onUpdate }, () => duration)`.
- **Core quirk:** `debounce` (`C:utils/index.ts:287-313`) never clears earlier timers. Every call starts its own
  `setTimeout` chain, and each chain fires the callback once the quiet period has elapsed. N calls inside one window can
  therefore fire `onTransitionsEnd` up to N times. This is core behaviour, so the port inherits it automatically. Do not "fix" it in the Svelte layer.
- `debounce.clear()` clears only the latest timer handle. Upstream never calls it on unmount.

Methods that refuse to act during transitions: `moveCoordinates` (`:594`, `!data.transitions`) and
`resizeCoordinates` (`:654`, `!transitionsOptions.active`).

### 1.3 How the React layer drives it

- `useCropperInstance` builds `getProps` (defaults + `createDefaultSettings`, §2.3) and creates
  `new CropperInstance(getProps, rerender)` once via `useRef` (`R:hooks/useCropperInstance.ts:55`). The constructor
  expression is still **evaluated on every render** and the result discarded. Each throwaway instance creates its
  own debounced `endTransitions`. This is harmless waste, and Svelte has no equivalent of it.
- `getProps` is a `usePersistentFunction` (`R:hooks/usePersistentFunction.ts:3-9`): a stable wrapper whose `ref` is
  overwritten with the latest render's closure. **Consequence:** between a parent prop change and the next render,
  the core still sees the previous render's props. In Svelte a getter reads `$props()` directly, so it is always current.

---

## 2. Hooks: inventory, mechanics, guarantees

| Hook                      | File                               | Public (`index.ts`) | Used by                                                            |
| ------------------------- | ---------------------------------- | ------------------- | ------------------------------------------------------------------ |
| `useAbstractCropper`      | `hooks/useAbstractCropper.ts`      | **yes** (`:25`)     | `AbstractCropper.tsx:130`, user custom croppers                    |
| `useCropperInstance`      | `hooks/useCropperInstance.ts`      | **yes** (`:26`)     | `useAbstractCropper`                                               |
| `useCropperImage`         | `hooks/useCropperImage.ts`         | **yes** (`:27`)     | `useAbstractCropper`                                               |
| `useMoveImageOptions`     | `hooks/useMoveImageOptions.ts`     | **yes** (`:28`)     | `CropperBackgroundWrapper.tsx:42`                                  |
| `useScaleImageOptions`    | `hooks/useScaleImageOptions.ts`    | **yes** (`:29`)     | `CropperBackgroundWrapper.tsx:41`                                  |
| `useRotateImageOptions`   | `hooks/useRotateImageOptions.ts`   | **yes** (`:30`)     | `CropperBackgroundWrapper.tsx:40`                                  |
| `useUpdateEffect`         | `hooks/useUpdateEffect.ts`         | **yes** (`:31`)     | `useAbstractCropper`, `useStateWithCallback`, `StencilGrid.tsx:18` |
| `useWindowResize`         | `hooks/useWindowResize.ts`         | **yes** (`:32`)     | `useAbstractCropper`, `CropperPreview.tsx:151`                     |
| `useAbstractCropperProps` | `hooks/useAbstractCropperProps.ts` | no                  | `Cropper.tsx:21`, `FixedCropper.tsx:27`                            |
| `useCropperAutoReconcile` | `hooks/useCropperAutoReconcile.ts` | no                  | `useAbstractCropper`                                               |
| `useStateWithCallback`    | `hooks/useStateWithCallback.ts`    | no                  | `useAbstractCropper`, `useCropperImage`                            |
| `useForceRerender`        | `hooks/useForceRerender.ts`        | no                  | `useCropperInstance`, `CropperPreview.tsx:98`                      |
| `usePersistentFunction`   | `hooks/usePersistentFunction.ts`   | no                  | `useCropperInstance`                                               |
| `useFirstMountState`      | `hooks/useFirstMountState.ts`      | no                  | `useUpdateEffect`                                                  |
| `useTransition`           | `hooks/useTransition.ts`           | no                  | `ArtificialTransition.tsx:23`                                      |
| `useDeprecationWarning`   | `hooks/useDeprecationWarning.ts`   | no                  | `Cropper.tsx:28`                                                   |

Exported **types** from hook files: `AbstractCropperHookProps` (useAbstractCropper), `CropperInstanceSettings`,
`CropperInstanceSettingsProp`, `CropperStateHook` (useCropperInstance), and `CropperImageHookSettings` (useCropperImage).
The `Defined*ImageOptions` interfaces are **not** exported (module-local).

### 2.1 `useAbstractCropper` (public)

See §3 for the full surface. Summary of mechanics:

```ts
export function useAbstractCropper<Extension extends SettingsExtension = {}>(
	props: () => AbstractCropperHookProps<ExtendedSettings<Extension>>
); // R:hooks/useAbstractCropper.ts:34-36
// returns { cropper: AbstractCropperRef, refs: { image, boundary, canvas }, image: CropperImage | null }
```

React mechanics used: `useRef` ×4 (`:49-52`), `useStateWithCallback` for `currentImage` (`:54`), `useCropperInstance`,
`useCropperImage`, `useCropperAutoReconcile`, `useWindowResize`, three `useUpdateEffect`s, and `useImperativeHandle`
with no deps (`:190`). The interface is recreated every render.

### 2.2 `useCropperInstance` (public)

```ts
export type CropperInstanceSettings = DefaultSettings & AbstractCropperInstanceSettings; // :14
export type CropperInstanceSettingsProp<Settings extends CropperInstanceSettings> = Partial<
	Pick<Settings, keyof CropperInstanceSettings>
> &
	Omit<Settings, keyof CropperInstanceSettings>; // :16-19
export function useCropperInstance<Settings extends CropperInstanceSettings, Instance = unknown>(
	props: () => AbstractCropperInstanceParameters<Settings> &
		AbstractCropperInstanceCallbacks<Instance> & {
			settings?: CropperInstanceSettingsProp<Settings>;
		}
): CropperInstance<Settings, Instance>; // :21-58
export type CropperStateHook = ReturnType<typeof useCropperInstance>; // :59
```

`getProps` (`:29-53`) builds a fresh object on **every call**:

```ts
const { settings, ...parameters } = props();
const extendedSettings = {
	imageRestriction: ImageRestriction.fitArea,
	transformImage: { adjustStencil: true },
	...settings
};
const extendedParameters = { transitions: true, ...parameters };
return {
	settings: {
		...extendedSettings,
		...createDefaultSettings<Settings>(extendedSettings)
	} as Settings,
	...extendedParameters
};
```

- Defaults: `imageRestriction = 'fitArea'`, `transformImage = {adjustStencil: true}`, `transitions = true`. A user
  `transformImage` **replaces** the default object rather than merging into it, so `transformImage: {}` drops `adjustStencil`.
- `createDefaultSettings` (`C:defaults/index.ts:104-187`) returns `{...params}` plus seven wrapper functions:
  `sizeRestrictions`, `areaPositionRestrictions`, `areaSizeRestrictions`, `positionRestrictions`,
  `defaultCoordinates`, `defaultVisibleArea`, `aspectRatio`. Each delegates to the user value or the core default.
  Settings therefore get **new function identities on every `getProps()` call**. Nothing may rely on settings
  identity, and that holds in Svelte too.
- Guarantee: the core always sees normalized settings, so every `CoreSettings` field is present.

### 2.3 `useCropperImage` (public)

```ts
export interface CropperImageHookSettings {
	// R:hooks/useCropperImage.ts:5-15
	src?: string | null;
	onLoadingStart?: () => void;
	onLoadingEnd?: () => void;
	onError?: () => void;
	onLoad?: (image?: CropperImage) => void;
	crossOrigin?: 'anonymous' | 'use-credentials' | boolean;
	checkOrientation?: boolean;
	canvas?: string | boolean;
	unloadTime?: number;
}
export function useCropperImage(options: CropperImageHookSettings): {
	isLoading(): boolean;
	isLoaded(): boolean;
	getImage(): CropperImage | null;
	setImage: Dispatch<SetStateAction<CropperImage | null>>;
};
```

State: `image` (`useState`), `loading` (`useState`), `loaded` (`useStateWithCallback`), and `currentSrc` (`useRef`).

The load effect (`:25-72`, deps `[src, image]`; the `image` dep is inert because of the `currentSrc` guard):

1. If `currentSrc.current !== src`, set `currentSrc = src || null` and `setLoaded(false)`.
2. If `src` is truthy:
   - `setLoading(true)` and call `onLoadingStart()`.
   - Build `promises = [loadImage(src, { crossOrigin: isUndefined(crossOrigin) ? canvas : crossOrigin, checkOrientation })]`.
   - If the **previous** render was `loaded` and `unloadTime` is set, also push `promiseTimeout(unloadTime)` (`:39-41`).
     This holds the new image back until the old one has had `unloadTime` ms to fade out. `CropperWrapper` fades on
     `!loaded`.
   - `.then` → if still current, `setImage(image)`.
   - `.catch` → if still current, `onError()`.
   - `.finally` → if still current, call `onLoadingEnd()`, then `setLoading(false)`.
3. If `src` is falsy: when `unloadTime` is set, call `setImage(null)` after `unloadTime` ms (if still current).
   Otherwise call `setImage(null)` immediately.

The loaded effect (`:74-80`, deps `[image]`): if `image`, call `setLoaded(true, () => onLoad(image))`. `onLoad` fires
in an effect after the commit in which `loaded` became true. This also fires when a consumer calls the returned `setImage`.

Behaviour guarantees and quirks:

- **Race handling** is "last src wins", compared by value (`currentSrc.current === src`). Promises are never cancelled.
  - **A → B → A quirk:** the first A load is accepted again, because `currentSrc === 'A'` once more. The image is then set
    twice, once per load, which causes two resets.
  - On unmount nothing is cancelled. React only warns.
- `crossOrigin` only takes effect for cross-origin URLs (`C:image/index.ts:322`, `isCrossOriginURL(src) && settings.crossOrigin`).
- On **error**, `image` keeps the previous image and `loaded` stays `false`. The old state is not cleared.
- **Bug:** if `src` becomes falsy while a load is pending, the pending load's `finally` is skipped (stale) and the falsy
  branch never calls `setLoading(false)`. `isLoading()` then stays `true` indefinitely.
- Order on success (React 18 batching): `onLoadingStart` → … → `setImage` → `onLoadingEnd` (same microtask chain,
  `finally`) → commit → `loaded = true` → commit → `onLoad(image)`. So `onLoadingEnd` fires before `onLoad`.
- Only `src` changes start a load. Changing `crossOrigin`, `checkOrientation`, `canvas` or `unloadTime` alone does nothing
  until the next `src` change.
- `useCropperImage` itself has no `unloadTime` default (undefined means no delay). `useAbstractCropper` passes `500`.

### 2.4 `useMoveImageOptions` / `useScaleImageOptions` / `useRotateImageOptions` (public)

```ts
export function useMoveImageOptions(moveImage: MoveImageOptions | boolean): DefinedMoveImageOptions; // {touch, mouse}
// useMemo(() => getOptions(moveImage, {touch: true, mouse: true}, {touch: false, mouse: false}), [moveImage])
export function useScaleImageOptions(
	scaleImage: ScaleImageOptions | boolean
): DefinedScaleImageOptions; // {touch, wheel: boolean | {ratio}}
// getOptions(scaleImage, {touch: true, wheel: {ratio: 0.1}}, {touch: false, wheel: false})
export function useRotateImageOptions(
	rotateImage: RotateImageOptions | boolean
): DefinedRotateImageOptions; // {touch}
// getOptions(rotateImage, {touch: true}, {touch: false})
```

These are pure normalizers around `C:utils/index.ts:93` `getOptions`:

- `true` gives the default scheme. Falsy gives the false scheme.
- An object gives a per-key merge: missing keys take the default, booleans are coerced, and nested objects recurse.
  The nested case is `wheel: true` → `{ratio: 0.1}`, `wheel: {ratio: 0.2}` → `{ratio: 0.2}`, `wheel: false` → `false`.

`useMemo` only provides referential stability, which `TransformableImage` props do not need.
`ScaleImageOptions.adjustStencil` is in the type (`R:types.ts:46`) but is **not** in the default scheme, so `getOptions`
drops it. It is a dead field.

### 2.5 `useUpdateEffect` (public)

```ts
export const useUpdateEffect: typeof useEffect = (effect, deps) => {
	// R:hooks/useUpdateEffect.ts:4-12
	const isFirstMount = useFirstMountState();
	useEffect(() => {
		if (!isFirstMount) return effect();
	}, deps);
};
```

It skips the effect on the mount commit and runs it when deps change afterwards, honouring cleanup. `useFirstMountState`
(`R:hooks/useFirstMountState.ts:3-13`) returns `true` exactly once per component lifetime. Note that StrictMode double-invoke would break it.

### 2.6 `useWindowResize` (public)

```ts
export const useWindowResize = (callback: (...args: unknown[]) => void) => { … }   // R:hooks/useWindowResize.ts:3-25
```

- `callbackRef` is updated in a `useEffect([callback])`. Because callers pass inline arrows, that effect runs every render.
- One `useEffect([])` adds `resize` **and** `orientationchange` listeners on `window` and removes them on unmount.
- **No debounce or throttle.** Every resize event calls the callback synchronously. Inside `useAbstractCropper` that
  means a `refreshCropper()` per event, each awaiting `stretchTo` (a resolved promise) and then possibly `setBoundary` + `reconcileState`.
- Window-only. Container resizes that are not caused by a window resize are not observed. Users call
  `cropperRef.refresh()` themselves (see `example/src/components/examples/RefreshExample.tsx:22-27`).

### 2.7 `useCropperAutoReconcile` (internal)

```ts
export function useCropperAutoReconcile(
	cropper: { hasInteractions(): boolean; reconcileState(): void },
	enabled = true
) {
	const [active, setActive] = useState(enabled); // :9  ← initial value only
	useLayoutEffect(() => {
		if (active && !cropper.hasInteractions()) cropper.reconcileState();
	}); // :11-15, NO deps
	return {
		pause() {
			setActive(false);
		},
		resume() {
			setActive(true);
		}
	};
}
```

- **The guarantee:** after **every** commit of the owning component (`AbstractCropper` or a custom cropper), state is
  reconciled against the current settings, unless the user is mid-interaction. Because it is a layout effect, this
  happens before the browser paints, so an inconsistent state is never painted. It may still be committed to the DOM once,
  followed by a synchronous re-render.
- This is **the** mechanism that makes settings props live: changing `aspectRatio`, `minWidth`, `stencilProps.aspectRatio`,
  `imageRestriction`, … causes a parent re-render, then a layout effect, then `reconcileState()` (no transitions, snaps).
- `reconcileState()` (`C:…:324-345`) is a no-op when `isConsistentState(state, settings)`. So running it after every render
  is cheap, and after interactions end it catches settings that changed mid-drag.
- `enabled` is read only at mount (`useState(enabled)`). Toggling the `autoReconcileState` prop later is **ignored**.
- `pause`/`resume` are React state. They take effect only at the next render, and inside `resetCropper` they are set
  back-to-back (§3.5). They are a weak guard that does not matter much in practice.

### 2.8 `useStateWithCallback` (internal)

```ts
export function useStateWithCallback<S>(
	initialState?: S | (() => S)
): [S, (value: SetStateAction<S>, callback?: Function) => void];
// R:hooks/useStateWithCallback.ts:8-27
```

A second state slot holds the callback, and a `useUpdateEffect([callback])` invokes `callback(state, previousState)`
after the commit that applied both. It is used for "run X after the new value is committed". Wrapping in
`setCallback(() => callback)` creates a new identity each call, so the effect fires on every set even with the same callback.

### 2.9 `useForceRerender`, `usePersistentFunction`, `useFirstMountState` (internal)

- `useForceRerender` (`:3-9`): `useState({})` plus `() => setTick({})`.
- `usePersistentFunction` (`:3-9`): `ref.current = props` on every render, returning `(...a) => ref.current(...a)`.
- `useFirstMountState`: see §2.5.

All three are React plumbing with no behavioural content.

### 2.10 `useTransition` (internal)

```ts
export function useTransition<T>(
	transitions: CropperTransitions | null = null
): [(callback: (progress: number) => void) => void, boolean]; // R:hooks/useTransition.ts:4-29
```

- Holds one core `Animation` (`useRef`) and an `active` boolean state.
- `run(cb)`:
  - If `transitions?.active`, call `animation.start({...transitions, onStart: setActive(true), onProgress: cb, onStop: setActive(false)})`.
  - Otherwise, if no animation is running, call `cb(1)` synchronously.
- Consumer: `ArtificialTransition` (`useLayoutEffect`, writes `style` directly per frame). See `02-components.md`.
- The animation is not stopped on unmount, so `requestAnimationFrame` keeps going until the duration ends.

### 2.11 `useDeprecationWarning` (internal)

```ts
export function useDeprecationWarning(): (message: string) => void; // R:hooks/useDeprecationWarning.ts:4-13
```

A per-component-instance `useRef<string[]>` de-duplicates messages, then calls `deprecationWarning` (§4.4). It is only
used by `Cropper`'s dead deprecation branch (§6).

### 2.12 `useAbstractCropperProps` (internal)

```ts
export function useAbstractCropperProps<Extension extends SettingsExtension>(
	props: AbstractCropperIntrinsicProps<ExtendedSettings<Extension>>, // (typed loosely; really the flat CustomCropperProps)
	settings: string[] = defaultSettings
): {
	settings: Extension & Partial<DefaultSettings & CoreSettings & ModifierSettings>;
	props: Props<Extension>;
};
// R:hooks/useAbstractCropperProps.ts:8-26
```

A pure split, not really a hook (it uses no React APIs):

- A key in the `settings` name list (default: the 19 names from `service/constants.ts`) goes into `result.settings`.
- Every other key goes into `result.props`.
- `FixedCropper` passes `[...defaultSettings, 'stencilSize']`.
- Extension keys that are not in the list end up in `props`, so they reach `parameters` rather than `settings`.
- `:4` imports types from `'../../../../Advanced Cropper/advanced-cropper/dist'`, a path on the author's machine. It
  compiles only because type-only imports are elided. Do not copy it.

---

## 3. `useAbstractCropper` in depth

### 3.1 The props surface

`AbstractCropperHookProps<Settings>` (`R:hooks/useAbstractCropper.ts:19-32`) =
`AbstractCropperInstanceParameters<Settings>` ∪ `AbstractCropperInstanceCallbacks<AbstractCropperRef<Settings>>` ∪ own fields.

| Group            | Prop                                                                                                                                                                                                                 | Type                                                                     | Default                                                                                         | Where applied                                                                                                                              |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| parameters       | `transitions`                                                                                                                                                                                                        | `CropperTransitionsSettings \| boolean` (`{timingFunction?, duration?}`) | `true` (`useCropperInstance:40-42`); resolves to `{timingFunction:'ease-in-out', duration:350}` | core `getTransitions`                                                                                                                      |
| parameters       | `postProcess`                                                                                                                                                                                                        | `PostprocessFunction<S> \| PostprocessFunction<S>[]`                     | none                                                                                            | core `applyPostProcess`                                                                                                                    |
| parameters       | `setCoordinatesAlgorithm`, `setVisibleAreaAlgorithm`, `setBoundaryAlgorithm`, `transformImageAlgorithm`, `moveCoordinatesAlgorithm`, `resizeCoordinatesAlgorithm`, `createStateAlgorithm`, `reconcileStateAlgorithm` | core algorithm types                                                     | core defaults                                                                                   | core methods                                                                                                                               |
| callbacks (core) | `onChange`, `onUpdate`, `onTransitionsStart`, `onTransitionsEnd`, `onMove`, `onMoveEnd`, `onResize`, `onResizeEnd`, `onTransformImage`, `onTransformImageEnd`, `onInteractionStart`, `onInteractionEnd`              | `(cropper: AbstractCropperRef<S>) => void`                               | none                                                                                            | core `runCallback(s)`                                                                                                                      |
| callbacks (core) | `getInstance`                                                                                                                                                                                                        | `() => Nullable<Instance>`                                               | **always overridden** by the hook (`:58-60`)                                                    | core                                                                                                                                       |
| own              | `src`                                                                                                                                                                                                                | `string \| null`                                                         | none                                                                                            | `useCropperImage`                                                                                                                          |
| own              | `checkOrientation`                                                                                                                                                                                                   | `boolean`                                                                | `true` (`:45`)                                                                                  | `loadImage` (EXIF via `fetch`/ArrayBuffer)                                                                                                 |
| own              | `canvas`                                                                                                                                                                                                             | `boolean`                                                                | `true` (`:42`)                                                                                  | crossOrigin fallback in the loader (dead, because `crossOrigin` defaults to `true`). `AbstractCropper` uses it to render `<CropperCanvas>` |
| own              | `crossOrigin`                                                                                                                                                                                                        | `'anonymous' \| 'use-credentials' \| boolean`                            | `true` (`:44`)                                                                                  | `loadImage`                                                                                                                                |
| own              | `onReady`                                                                                                                                                                                                            | `(cropper) => void`                                                      | none                                                                                            | §3.4                                                                                                                                       |
| own              | `onError`                                                                                                                                                                                                            | `(cropper) => void`                                                      | none                                                                                            | loader `onError`                                                                                                                           |
| own              | `onUpdate`                                                                                                                                                                                                           | `(cropper) => void`                                                      | none                                                                                            | core **and** loader status effect (`:184-188`)                                                                                             |
| own              | `unloadTime`                                                                                                                                                                                                         | `number` (ms)                                                            | `500` (`:43`)                                                                                   | loader                                                                                                                                     |
| own              | `autoReconcileState`                                                                                                                                                                                                 | `boolean`                                                                | `true` (`:46`), read once at mount                                                              | `useCropperAutoReconcile`                                                                                                                  |
| own              | `settings`                                                                                                                                                                                                           | `CropperInstanceSettingsProp<Settings>`                                  | `{}`. Defaults are filled in by `useCropperInstance` (§2.2)                                     | core settings                                                                                                                              |

Component-level props (`AbstractCropperProps`, `R:components/AbstractCropper.tsx:74-94`, defaults at `:105-126`) sit on
top of this. They are not seen by the hook except through `...parameters` leakage:

- `backgroundComponent` = `CropperBackgroundImage`, `backgroundProps` = `{}`, `backgroundClassName`
- `backgroundWrapperComponent` = `CropperBackgroundWrapper`, `backgroundWrapperProps` = `{}`
- `backgroundWrapperClassName`: **declared but never read**, so it leaks into `parameters`
- `wrapperComponent` = `CropperWrapper`, `wrapperProps` = `{}`
- `stencilComponent` = `RectangleStencil`, `stencilProps` = `{}`, `stencilConstraints` = `defaultStencilConstraints`
- `className`, `style`, `disabled`
- `boundaryComponent` = `StretchableBoundary`, `boundaryProps`, `boundaryClassName`
- `settings` (required at this level)

`AbstractCropper` re-defaults `canvas = true` and `crossOrigin = true`, and builds the hook props as
`{...parameters, crossOrigin, stencilProps, canvas, settings: {...settings, ...stencilConstraints(settings, {...stencilProps, ...stencilRef.current})}}` (`:130-142`).
`stencilRef.current` is the stencil's imperative handle (`RectangleStencil`: `{aspectRatio}`, `CircleStencil`:
`{aspectRatio: 1, boundingBox: 'circle'}`). It is `null` on the first render, so the stencil constraints only apply from
the second `getProps()` onwards. The auto-reconcile layout effect makes that invisible.

**Flat props → settings.** `Cropper`/`FixedCropper` take settings as flat props (`CustomCropperProps`, §5). The split is
done by `useAbstractCropperProps` using the 19-name list (§4.1). These 19 names are exactly
`keyof AbstractCropperSettings`:

- `DefaultSettings`: 7 names
- `CoreSettings`: 5 names
- `ModifierSettings`: 3 names
- `InitializeSettings`: 4 names

Note that `transformImage`, `moveCoordinates` and `resizeCoordinates` are **settings objects** (modifier settings) and,
separately, **method names** on `CropperRef`. As props they always mean the settings.

### 3.2 The `CropperRef` imperative API (complete)

Built at `R:hooks/useAbstractCropper.ts:117-168`. 33 members exist at runtime. The `AbstractCropperRef` **type**
(`R:components/AbstractCropper.tsx:42-72`) declares 29 of them. **Four runtime members are untyped:**
`setVisibleArea`, `startTransitions`, `hasInteractions`, `getInteractions`. Core methods that are **not** exposed:
`setBoundary`, `resetState`, `createDefaultState`, `isConsistent`.

Option bags (all exported from the core): `TransitionOptions {transitions?}`, `InteractionOptions {interaction?}`,
`ImmediatelyOptions {immediately?}`, `NormalizeOptions {normalize?}`, `PostprocessOptions {postprocess?}`. Defaults are
shown in brackets.

| #   | Member                         | Signature                                                                                                                                           | Semantics (source)                                                                                                                                                                                                                                                                                     |
| --- | ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | `reset`                        | `() => Promise<void>`                                                                                                                               | `resetCropper` (`:78-92`). Stretches the boundary to the loader image, sets `currentImage`, then (after commit) `cropper.reset(boundary, image)` or `clear()`. The promise **resolves before** the state reset happens (the reset runs in a post-commit effect). No-op if the boundary ref is missing. |
| 2   | `refresh`                      | `() => Promise<void>`                                                                                                                               | `refreshCropper` (`:94-116`). Re-measures the boundary. If the size changed: `setBoundary` + `reconcileState`. If there is no state yet: `reset`. If there is no image or boundary: `clear`. Does **not** touch `currentImage` or fire `onReady`.                                                      |
| 3   | `clear`                        | `() => void`                                                                                                                                        | `updateState(null)`                                                                                                                                                                                                                                                                                    |
| 4   | `setImage`                     | `(image: CropperImage) => void`                                                                                                                     | Sets `currentImage` only. **No state reset**, and the loader's image is unchanged. Still triggers `onReady` (the `currentImage` effect).                                                                                                                                                               |
| 5   | `reconcileState`               | `(options?: TransitionOptions) => void`                                                                                                             | `[transitions=false]`. Only acts if the state is inconsistent. pp `reconcileState`.                                                                                                                                                                                                                    |
| 6   | `moveCoordinates`              | `(directions: Partial<MoveDirections>, options?: Interaction&Immediately&Normalize&Transition) => void`                                             | `[interaction=true, transitions=false, immediately=false, normalize=true]`. Ignored while transitions are active. Fires `onMove` (+`onMoveEnd` if `!interaction`).                                                                                                                                     |
| 7   | `moveCoordinatesEnd`           | `(options?: Immediately&Transition) => void`                                                                                                        | `[transitions=true, immediately=false]`. Fires `onMoveEnd`, then interaction end.                                                                                                                                                                                                                      |
| 8   | `resizeCoordinates`            | `(anchor: ResizeAnchor, directions: Partial<MoveDirections>, parameters?: unknown, options?: Interaction&Immediately&Normalize&Transition) => void` | `[interaction=true, transitions=false, immediately=false, normalize=true]`. Ignored while transitions are active.                                                                                                                                                                                      |
| 9   | `resizeCoordinatesEnd`         | `(options?: Immediately&Transition) => void`                                                                                                        | `[transitions=true, immediately=false]`                                                                                                                                                                                                                                                                |
| 10  | `moveImage`                    | `(left: number, top?: number, options?: Interaction&Immediately&Normalize&Transition) => void`                                                      | `[interaction=false, immediately=true, transitions=true, normalize=false]`                                                                                                                                                                                                                             |
| 11  | `flipImage`                    | `(horizontal?: boolean, vertical?: boolean, options?) => void`                                                                                      | `[interaction=false, immediately=true, transitions=true, normalize=true]` (`normalizeFlip` accounts for rotation)                                                                                                                                                                                      |
| 12  | `zoomImage`                    | `(scale: Scale \| number, options?) => void`                                                                                                        | `[interaction=false, immediately=true, transitions=true, normalize=false]`                                                                                                                                                                                                                             |
| 13  | `rotateImage`                  | `(rotate: number \| Rotate, options?) => void`                                                                                                      | same defaults as `zoomImage`                                                                                                                                                                                                                                                                           |
| 14  | `transformImage`               | `(transform: ImageTransform, options?) => void`                                                                                                     | `[transitions=true, interaction=true, immediately=false, normalize=true]`                                                                                                                                                                                                                              |
| 15  | `transformImageEnd`            | `(options?: Immediately&Transition) => void`                                                                                                        | `[immediately=true, transitions=true]`                                                                                                                                                                                                                                                                 |
| 16  | `setCoordinates`               | `(transforms: CoordinatesTransform \| CoordinatesTransform[], options?: Immediately&Transition) => void`                                            | `[transitions=true, immediately=true]`                                                                                                                                                                                                                                                                 |
| 17  | `setVisibleArea` _(untyped)_   | `(visibleArea: VisibleArea, options?: Immediately&Transition) => void`                                                                              | `[transitions=true, immediately=true]`                                                                                                                                                                                                                                                                 |
| 18  | `startTransitions` _(untyped)_ | `() => void`                                                                                                                                        | §1.2                                                                                                                                                                                                                                                                                                   |
| 19  | `setState`                     | `(modifier: CropperState \| ((state, settings) => CropperState \| null) \| null, options?: Transition&Immediately&Interaction&Postprocess) => void` | `[transitions=true, immediately=false, interaction=false, postprocess=false]`. An **object** modifier is shallow-merged: `{...state, ...modifier}`.                                                                                                                                                    |
| 20  | `hasInteractions` _(untyped)_  | `() => boolean`                                                                                                                                     |                                                                                                                                                                                                                                                                                                        |
| 21  | `getStencilCoordinates`        | `() => { width; height; left; top }`                                                                                                                | stencil box in boundary pixels (`C:service/helpers.ts:42-55`). Never `null`: zeros (`emptyCoordinates()`) when uninitialized                                                                                                                                                                           |
| 22  | `getCoordinates`               | `(options?: { round?: boolean }) => Coordinates \| null`                                                                                            | `[round=true]` via `getRoundedCoordinates`                                                                                                                                                                                                                                                             |
| 23  | `getVisibleArea`               | `() => VisibleArea \| null`                                                                                                                         | shallow copy                                                                                                                                                                                                                                                                                           |
| 24  | `getTransforms`                | `() => Transforms`                                                                                                                                  | deep clone, or `{rotate: 0, flip: {false, false}}`                                                                                                                                                                                                                                                     |
| 25  | `getTransitions`               | `() => CropperTransitions`                                                                                                                          | `{timingFunction, duration, active}`                                                                                                                                                                                                                                                                   |
| 26  | `getInteractions` _(untyped)_  | `() => CropperInteractions`                                                                                                                         | deep clone                                                                                                                                                                                                                                                                                             |
| 27  | `getSettings`                  | `() => Settings`                                                                                                                                    | shallow copy of the normalized settings                                                                                                                                                                                                                                                                |
| 28  | `getState`                     | `() => CropperState \| null`                                                                                                                        | `copyState` = **deep clone on every call**                                                                                                                                                                                                                                                             |
| 29  | `getDefaultState`              | `() => CropperState \| null`                                                                                                                        | `createDefaultState(state.boundary, loaderImage)` (`:146-154`), uses the **loader** image, not `currentImage`                                                                                                                                                                                          |
| 30  | `getCanvas`                    | `(options?: DrawOptions) => HTMLCanvasElement \| null`                                                                                              | `canvasRef.draw(state, imageRef, options)` (`:155-162`). Needs `refs.image` (the background `<img>` or a `CropperSource`) **and** `<CropperCanvas>` (`canvas` prop) **and** state.                                                                                                                     |
| 31  | `getImage`                     | `() => CropperImage \| null`                                                                                                                        | `{...currentImage}` from the **render closure**, which is stale between `setCurrentImage` and the next render                                                                                                                                                                                          |
| 32  | `isLoading`                    | `() => boolean`                                                                                                                                     | loader `loading` (render-closure value)                                                                                                                                                                                                                                                                |
| 33  | `isLoaded`                     | `() => boolean`                                                                                                                                     | loader `loaded` (render-closure value)                                                                                                                                                                                                                                                                 |

`DrawOptions` = `{width?, height?, minWidth?, maxWidth?, minHeight?, maxHeight?, maxArea?, imageSmoothingQuality?, imageSmoothingEnabled?, fillColor?}` (`C:canvas/index.ts:5-9,105-113`).

The hook also returns `refs` (`:194-198`):

- `image: RefObject<HTMLElement>`, the drawable source for `getCanvas`
- `boundary: RefObject<StretchableBoundaryMethods>`, `{stretchTo(size): Promise<Size|null>; reset(): void}`
- `canvas: RefObject<CropperCanvasMethods>`, `{draw(state, image, options?)}`

It also returns `image` (`currentImage`, the one the UI should render).

### 3.3 Effects and their ordering (as written)

Hooks run in this declaration order (`R:hooks/useAbstractCropper.ts`):

1. `useStateWithCallback(currentImage)` (`:54`). Its internal `useUpdateEffect([callback])` is effect **E1**.
2. `useCropperInstance` (`:56-61`).
3. `useCropperImage` (`:63-74`). This registers effects **E2** (load, `[src,image]`) and **E3** (loaded, `[image]`).
4. `useCropperAutoReconcile` (`:76`). This registers layout effect **L1**, which runs after every commit.
5. `useWindowResize` (`:170-172`). This registers effects **E4** (ref sync) and **E5** (listeners).
6. `useUpdateEffect([loaderImage])`, effect **E6**: `resetCropper()`.
7. `useUpdateEffect([currentImage])`, effect **E7**: `onReady(cropperRef.current)` if `currentImage` is truthy.
8. `useUpdateEffect([isLoaded(), isLoading()])`, effect **E8**: `onUpdate(cropperRef.current)`.
9. `useImperativeHandle(cropperRef)`, layout phase. `cropperRef.current` is set **before** any passive effect runs.

React runs layout effects (L1, the imperative handles) before passive effects, and passive effects in declaration order.

### 3.4 Timeline: new `src` until ready (intended semantics, React 18 batching)

1. **Commit A** (src changed): E2 sets `loaded=false` and `loading=true` (re-render), then starts the promise.
2. **Commit B**: L1 reconcile (no-op), then E8 fires **`onUpdate`** (loading flipped).
3. The promise resolves, at the earliest after `unloadTime` if an image was previously loaded. `setImage(img)`, then in
   `finally` **`onLoadingEnd`** (not wired by `useAbstractCropper`) and `setLoading(false)`.
4. **Commit C**: E3 calls `setLoaded(true, onLoad)`. E6 calls `resetCropper()`:
   - `pause()`
   - `await boundary.stretchTo(img)`. The stretcher DOM is resized here and the boundary size is measured.
   - `setCurrentImage(img, cb)` and `resume()`
   - E8 fires **`onUpdate`** (loading/loaded flipped).
5. **Commit D** (`currentImage` = img, callback set): E1 runs `cb`, which calls **`cropper.reset(boundary, img)`**. That
   runs `updateState`, which fires **`onChange`** and **`onUpdate`** synchronously (`getInstance` is non-null). Then
   E7 fires **`onReady`**. Since E1 is declared before E7, **`onReady` sees the initialized state**:
   `getState()` and `getCoordinates()` are non-null.
6. **Commit E**: the new state renders (background, stencil). L1 reconcile is a no-op.

Caveats:

- With React 17 (the repo's dev dependency), updates after `await` are **not** batched. `setCurrentImage` renders
  synchronously, and the pending passive effects flush before the next sync render. **E7 (`onReady`) can therefore run
  before E1 (`reset`)**, so in `onReady`, `getState()` may still be the old or `null` state. The intended contract
  (React 18) is "onReady after reset". The Svelte port should implement that contract explicitly.
- On the first image ever, the background `<img>` (`refs.image`) is not mounted when `onReady` runs, because
  `AbstractCropper.tsx:181` renders it only when `cropper.getState()` is set. So **`getCanvas()` returns `null` inside the
  first `onReady`** unless the user mounted a `CropperSource`. Later images reuse the mounted `<img>`.
- The `reset()` promise resolves at step 4, before step 5.

### 3.5 The other flows

- **Window resize** (E5) calls `refreshCropper()`:
  - `pause`
  - `await stretchTo(loaderImage)`
  - If the size changed: `setBoundary(boundary)` (`transitions=false`), which uses the core `setBoundary` algorithm
    (`C:state/setBoundary.ts`) to rescale the visible area to the new boundary. Then `reconcileState()`, because "after the boundary reset the cropper can meet some
    restrictions that were broken before" (`:104-106`).
  - `resume`
- **Settings change**: the parent re-renders, `AbstractCropper` re-renders, and L1 runs `reconcileState()` (no transitions).
- **Image cleared** (`src` falsy): after `unloadTime` the loader image becomes null. E6 → `resetCropper` → `stretchTo(null)`
  (clears the stretcher styles, resolves `null`) → `setCurrentImage(null, () => cropper.clear())`.
  `onReady` does not fire (`currentImage` is falsy).
- **Error**: the loader `catch` calls `onError(cropperRef.current)`. State and `currentImage` are unchanged, and `loaded=false`.
- **Unmount**: `useImperativeHandle` nulls `cropperRef.current`, so core callbacks from late timers (`endTransitions`) are
  dropped by `runCallback`. Timers and image promises are **not** cancelled.

### 3.6 `getInstance` semantics

`getInstance: () => cropperRef.current` (`:58-60`) is `null`:

- during the first render
- after unmount
- in the window between a `useImperativeHandle` cleanup and its re-set during each commit (no practical impact)

Every callback receives **the same object the user's `ref` sees**, because `AbstractCropper.tsx:154` forwards
`cropper` from the hook. That object's identity changes on every render in React.

---

## 4. `service/*`

### 4.1 `service/constants.ts` (internal)

`export const defaultSettings = ['transformImage','moveCoordinates','resizeCoordinates','defaultCoordinates','defaultVisibleArea','areaPositionRestrictions','areaSizeRestrictions','sizeRestrictions','positionRestrictions','aspectRatio','minWidth','minHeight','maxWidth','maxHeight','defaultSize','defaultPosition','defaultTransforms','imageRestriction','priority']`
(`:1-21`). It is the name list for the flat props → settings split. **Not** in `index.ts`.

Svelte: `src/lib/service/constants.ts`, the same array (`as const` gives a typed union). Keep it internal.

### 4.2 `service/cropper.ts` (internal)

```ts
export function createCropper<T, P = {}>(
	render: (props: P, ref: React.Ref<T>) => React.ReactElement | null
): (props: PropsWithoutRef<P> & React.RefAttributes<T>) => React.ReactElement | null; // = forwardRef(render)
```

A typing shim so that generic `forwardRef` components keep their generics. It is used only by `AbstractCropper.tsx:198`.
**Not public.** Svelte: **drop**. Generic components use `<script lang="ts" generics="Extension extends SettingsExtension = {}">`,
and the "ref" is the component's exports (`bind:this`).

### 4.3 `service/events.ts` (internal)

`export function preventDefault(e: MouseEvent) { e.preventDefault(); }`. Used as `onMouseDown` in
`CropperBackgroundImage.tsx:40` and `CropperPreviewBackground.tsx:45` to stop native image drag. **Not public.**
Svelte: an inline `onmousedown={(e) => e.preventDefault()}`, or keep a 1-line helper. `mousedown` is delegated but not
passive in Svelte, so `preventDefault` works. See `02-components.md` §3.5.

### 4.4 `service/utils.ts` (internal)

`export function deprecationWarning(text) { if (process.env.NODE_ENV === 'development') console.warn(\`Deprecation warning: ${text}\`) }`.
It fires only when `NODE_ENV`is **exactly**`'development'`. **Not public.**

Svelte: use `DEV` from `esm-env`. Svelte itself uses it, but under pnpm it is only transitive, so it must be added to
`dependencies` (do it when porting). Alternatively use `import.meta.env.DEV`. That is Vite-only and unsafe for a
published library consumed by non-Vite bundlers, so `esm-env` is preferred.

### 4.5 `service/react.ts` (**public**)

```ts
export function mergeRefs<T = any>(refs: (MutableRefObject<T> | LegacyRef<T>)[]): RefCallback<T>;
// calls function refs with the value, assigns `.current` on object refs, skips null (string refs silently mis-assigned)
```

Public and used by docs examples (`TwitterCropper.tsx:48`, `TelegramCropper.tsx:52`, `FixedCropper.tsx:43`,
`AdjustableImage.tsx:51`) to point both a forwarded ref and a local ref at a cropper.

Svelte proposal (keep the name for parity, with semantics that suit Svelte):

```ts
export type Ref<T> = ((value: T | null) => void) | { current: T | null } | null | undefined;
export function mergeRefs<T>(refs: Ref<T>[]): (value: T | null) => () => void {
	return (value) => {
		for (const ref of refs) assign(ref, value);
		return () => {
			for (const ref of refs) assign(ref, null);
		};
	};
}
```

The returned function works in two places:

- As the **setter of a function binding**: `<Cropper bind:this={() => cropper, mergeRefs([ref, (v) => (cropper = v)])} />`.
  Function bindings exist in Svelte ≥ 5.9, and the return value is ignored there.
- As an **attachment** on DOM elements: `{@attach mergeRefs([a, b])}`. The returned cleanup nulls the refs on detach.

Document it as a convenience. Idiomatic Svelte users just bind twice.

---

## 5. `types.ts` (all public via `export * from './types'`)

| Type                                | Upstream (quoted)                                                                                                                                                                                                      | Svelte mapping                                                                                                                                                                                                                                                                                          |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ArbitraryProps`                    | `Record<string, any>` (`:8`)                                                                                                                                                                                           | Same.                                                                                                                                                                                                                                                                                                   |
| `StencilComponent`                  | `any` (`:10`)                                                                                                                                                                                                          | Upstream is `any`. Recommend `Component<any, any>` (`import type { Component } from 'svelte'`). Every Svelte component is assignable to it, so it stays effectively non-breaking.                                                                                                                       |
| `CropperWrapperComponent`           | `FC<{ cropper: any; className?: string; style?: CSSProperties; children?: ReactNode; disabled?: boolean }>` (`:12-18`)                                                                                                 | `Component<{ cropper: any; className?: string; style?: string; children?: Snippet; disabled?: boolean; loading?: boolean; loaded?: boolean }>`. Add the **deprecated** `loading`/`loaded` that `AbstractCropper.tsx:156-168` actually passes (§6.3). `style` is a string (see `02-components.md` §3.3). |
| `CropperBoundaryComponent`          | `any` (`:20`)                                                                                                                                                                                                          | `Component<any, any>`. The instance must export `stretchTo` and `reset` (`StretchableBoundaryMethods`).                                                                                                                                                                                                 |
| `CropperBackgroundComponent`        | `any` (`:22`)                                                                                                                                                                                                          | `Component<any, any>`. Contract: accepts a bindable `ref` for the drawable element (`02-components.md` §3.4).                                                                                                                                                                                           |
| `CropperBackgroundWrapperComponent` | `FC<{ cropper: any; children?: ReactNode; className?: string; style?: CSSProperties; disabled?: boolean }>` (`:24-30`)                                                                                                 | `Component<{ cropper: any; children?: Snippet; className?: string; style?: string; disabled?: boolean }>`                                                                                                                                                                                               |
| `StencilOptions`                    | `Record<string, unknown>` (`:32`)                                                                                                                                                                                      | Same                                                                                                                                                                                                                                                                                                    |
| `StencilConstraints<Settings>`      | `(settings: Settings, stencilOptions: StencilOptions) => Partial<Settings>` (`:34-37`)                                                                                                                                 | Same                                                                                                                                                                                                                                                                                                    |
| `ScaleImageOptions`                 | `{ touch?: boolean; wheel?: boolean \| { ratio?: number }; adjustStencil?: boolean }` (`:39-47`)                                                                                                                       | Same (`adjustStencil` is dead, §2.4)                                                                                                                                                                                                                                                                    |
| `RotateImageOptions`                | `{ touch?: boolean }` (`:49-51`)                                                                                                                                                                                       | Same                                                                                                                                                                                                                                                                                                    |
| `MoveImageOptions`                  | `{ touch?: boolean; mouse?: boolean }` (`:53-56`)                                                                                                                                                                      | Same                                                                                                                                                                                                                                                                                                    |
| `CustomCropperProps<Extension>`     | `AbstractCropperIntrinsicProps<ExtendedSettings<Extension>> & Partial<Pick<ExtendedSettings<Extension>, keyof AbstractCropperSettings>> & Omit<ExtendedSettings<Extension>, keyof AbstractCropperSettings>` (`:58-62`) | Same algebra over the Svelte `AbstractCropperIntrinsicProps` (Snippet/Component/string style instead of the React types)                                                                                                                                                                                |
| `CustomCropperRef<Extension>`       | `AbstractCropperRef<ExtendedSettings<Extension>>` (`:64-66`)                                                                                                                                                           | Same. In Svelte, the type of the **component exports** (`bind:this`) of `Cropper` and `FixedCropper`. Add a type test asserting `typeof Cropper extends Component<any, infer E> ? E : never` satisfies `CropperRef`.                                                                                    |
| `ExtendedSettings<Extension>`       | `Extension & AbstractCropperSettings` (`:68`)                                                                                                                                                                          | Same                                                                                                                                                                                                                                                                                                    |
| `SettingsExtension`                 | `object` (`:70`)                                                                                                                                                                                                       | Same                                                                                                                                                                                                                                                                                                    |

Types that are public **via other modules** and relevant here:

- `CropperProps`, `CropperRef` (`Cropper.tsx`)
- `FixedCropperSettings`, `FixedCropperProps`, `FixedCropperRef` (`FixedCropper.tsx`)
- `AbstractCropperHookProps`
- `CropperInstanceSettings`, `CropperInstanceSettingsProp`, `CropperStateHook`
- `CropperImageHookSettings`
- `CropperCanvasMethods`, `StretchableBoundaryMethods`
- `CropperPreviewRef`, `CropperWrapperProps`, `CropperBackgroundImageProps`, `CropperBackgroundWrapperProps`, `CropperPreviewBackgroundProps`, `CropperPreviewWrapperProps`, `StencilGridProps`, `TransformableImageEvent`
- `StencilSize` (from the core extension)

**Not public (notable):** `AbstractCropper` and all of its types (`AbstractCropperRef`, `AbstractCropperProps`,
`AbstractCropperSettings`, `AbstractCropperIntrinsicProps`, `AbstractCropperSettingsProp`). `R:index.ts` does not
export `components/AbstractCropper`. They are reachable only structurally, through `CropperRef` and friends.
Recommendation: export them in Svelte anyway. They are additive and needed to type `useAbstractCropper` users' code,
because `AbstractCropperRef` is the hook's return type. Record this as a deliberate superset.

React type → Svelte type cheatsheet: `ReactNode` → `Snippet`; `FC<P>`/`ComponentType<P>` → `Component<P>`;
`CSSProperties` → `string`; `RefObject<T>` → `{ current: T | null }` or a `$state` field;
`Ref<T>`/forwarded ref → component exports via `bind:this`, or a `$bindable` `ref` prop for DOM elements.

---

## 6. `deprecated/` and deprecation behaviour

### 6.1 `deprecated/hybridAutoZoom.ts` (internal)

- `hybridStencilAutoZoomAlgorithm(state, settings)` (`:19-75`) is pure. It:
  - scales the visible area so the stencil fills about 80% of the boundary along the dominant axis
  - fits the area to its size restrictions
  - centers it on the coordinates
  - moves it inside the area position restrictions
  - moves the coordinates into the intersection of the visible area and the position restrictions
- `hybridStencilAutoZoom(state, settings, action)` (`:77-86`) is the postprocess wrapper. It applies the algorithm only
  when `action.immediately`.

### 6.2 The `<Cropper>` deprecation path is dead

`Cropper.tsx:26` destructures `stencilSize` and `autoZoom` from `cropperProps.settings`, but neither name is in
`defaultSettings` (§4.1), so both are **always `undefined`**:

- The `autoZoom` branch (`:30-41`, which sets `postProcess = hybridStencilAutoZoom` and warns) never runs.
- The `stencilSize` branch (`:43-55`, which renders `<FixedCropper>` instead and warns) never runs.
- Both props instead fall into `intrinsicProps`, then `AbstractCropper`'s `...parameters`, then the core props. They are
  **silently ignored**.
- Neither is in the `CropperProps` type, so TypeScript users cannot pass them.

Observable upstream behaviour is therefore "ignored". Recommendation (consistent with `02-components.md` §2.5):

- Do **not** port `hybridStencilAutoZoom` or the branch.
- Optionally emit a single dev warning if a JS user passes either prop. That is harmless and a useful hint.
- If someone later wants the _intended_ behaviour, `hybridAutoZoom.ts` is a 70-line pure function that can be copied verbatim.

### 6.3 Other deprecated behaviour that IS live

- **Wrapper `loading`/`loaded` props** (`AbstractCropper.tsx:156-168`). Every `wrapperComponent` receives
  `loading = cropper.isLoading()` and `loaded = cropper.isLoaded()` in addition to `cropper`. Custom wrappers written
  for older versions rely on them, so the **port must pass them**. `CropperPreview` does the same for its wrapper.
- `useDeprecationWarning` / `deprecationWarning`: infrastructure only (§2.11, §4.4).

---

## 7. `index.ts`: full public export list

**Components** (`:1-23`, one module each). Exported names per module:

| Group              | Module → exports                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| croppers           | `Cropper` (+`CropperProps`, `CropperRef`), `FixedCropper` (+`FixedCropperSettings`, `FixedCropperProps`, `FixedCropperRef`)                                                                                                                                                                                                                                                                                                                                                                                                                       |
| stencils           | `RectangleStencil`, `CircleStencil`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| service components | `BoundingBox`, `CropperCanvas` (+`CropperCanvasMethods`), `CropperSource`, `StretchableBoundary` (+`StretchableBoundaryMethods`), `CropperWrapper` (+`CropperWrapperProps`), `StencilOverlay`, `StencilWrapper`, `StencilGrid` (+`StencilGridProps`), `DraggableArea` (**alias**: `export { DraggableElement as DraggableArea }`), `DraggableElement`, `TransformableImage` (+`TransformableImageEvent`), `CropperFade`, `CropperBackgroundImage` (+`CropperBackgroundImageProps`), `CropperBackgroundWrapper` (+`CropperBackgroundWrapperProps`) |
| helpers            | `CropperPreview` (+`CropperPreviewRef`), `CropperPreviewBackground` (+`CropperPreviewBackgroundProps`), `CropperPreviewWrapper` (+`CropperPreviewWrapperProps`)                                                                                                                                                                                                                                                                                                                                                                                   |
| lines / handlers   | `SimpleLine`, `SimpleHandler`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |

**Types** (`:24`): everything in §5.

**Hooks** (`:25-32`):

- `useAbstractCropper` (+`AbstractCropperHookProps`)
- `useCropperInstance` (+`CropperInstanceSettings`, `CropperInstanceSettingsProp`, `CropperStateHook`)
- `useCropperImage` (+`CropperImageHookSettings`)
- `useMoveImageOptions`, `useScaleImageOptions`, `useRotateImageOptions`
- `useUpdateEffect`
- `useWindowResize`

**Service** (`:33`): `mergeRefs`.

**Core re-exports** (`:34-54`):

- `export *` from `advanced-cropper`, `/defaults`, `/algorithms`, `/image`, `/canvas`, `/service`, `/state`
- explicit re-exports `isLower, isGreater, isRoughlyEqual, isNumber, isUndefined, isArray, isNumeric, isWheelEvent, isMouseEvent, isTouchEvent`.
  These names are ambiguous across the `export *` sources, so TypeScript drops them unless they are re-exported explicitly.
- `export type { StencilSize } from 'advanced-cropper/extensions/stencil-size'`

`src/lib/index.ts` already mirrors these core re-exports.

**Side-effect CSS** (`:56-57`): `advanced-cropper/styles/index.scss` and `themes/default.scss`. See `01-core.md` §6.4.

Not exported (internal): `AbstractCropper`, `createCropper`, `preventDefault`, `deprecationWarning`, `defaultSettings`,
`hybridStencilAutoZoom`, `CropperInstance`, `ArtificialTransition`, `HandlerWrapper`, `LineWrapper`, and the internal hooks.

---

## 8. Svelte 5 equivalents, hook by hook

Rule for all public "use*" functions: they live in `src/lib/hooks/*.svelte.ts`, keep their exported names, and those
that create effects **must be called synchronously during component initialisation**, as React hooks must. A
`$effect` outside a component throws `effect_orphan`. Where React received a per-render value that Svelte needs to read
lazily, Svelte takes a getter.

| Upstream                                                                          | Svelte name / shape                                                                                                                             | How the guarantee is reproduced                                                                                                                                                                 | React-only parts dropped                                                                                                          |
| --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `useAbstractCropper(props: () => P)`                                              | **same name & signature**. Returns `{ cropper, refs, get image() }`                                                                             | §9.4                                                                                                                                                                                            | `useImperativeHandle`, `useStateWithCallback`, `useUpdateEffect`, autoReconcile `pause/resume` state, per-render interface object |
| `useCropperInstance(props: () => P)`                                              | **same name & signature**. Returns the Svelte `CropperInstance`                                                                                 | `$state.raw` data (§9.1)                                                                                                                                                                        | `useForceRerender`, `usePersistentFunction`, `useRef(new …)` per render                                                           |
| `useCropperImage(options)`                                                        | **same name**. Accepts `CropperImageHookSettings \| (() => CropperImageHookSettings)` and returns `{ isLoading, isLoaded, getImage, setImage }` | §9.3                                                                                                                                                                                            | `useStateWithCallback`, `currentSrc` ref replaced by `getAbortSignal()`                                                           |
| `useMoveImageOptions(v)` / `useScaleImageOptions(v)` / `useRotateImageOptions(v)` | **same names & signatures**, as plain pure functions (in `.ts`)                                                                                 | Callers wrap them: `const opts = $derived(useScaleImageOptions(scaleImage))`. `$derived` provides the memoization.                                                                              | `useMemo`                                                                                                                         |
| `useUpdateEffect(effect, deps)`                                                   | **same name**: `useUpdateEffect(effect: () => void \| (() => void), deps: () => readonly unknown[])`                                            | Snapshot `deps()` untracked at creation. A `$effect` reads `deps()` and runs `effect` (untracked) only when some element differs (`Object.is`) from the previous snapshot. Cleanup is honoured. | `useFirstMountState`                                                                                                              |
| `useWindowResize(cb)`                                                             | **same name & signature**                                                                                                                       | `$effect` + `on(window, 'resize' / 'orientationchange', …)` from `svelte/events`. No ref needed: the closure reads live state. SSR-safe because effects do not run on the server.               | `callbackRef` + sync effect                                                                                                       |
| `useAbstractCropperProps` (internal)                                              | `splitCropperProps(props, keys = defaultSettings)`, a pure function used inside `$derived`                                                      | see `02-components.md` §2.5                                                                                                                                                                     | the "hook" framing                                                                                                                |
| `useCropperAutoReconcile` (internal)                                              | inline `$effect.pre` in `useAbstractCropper`                                                                                                    | §9.2                                                                                                                                                                                            | `useState(active)` + `useLayoutEffect` with no deps                                                                               |
| `useStateWithCallback` (internal)                                                 | **dropped**                                                                                                                                     | Sequential code: set, then act. Use `await tick()` where "after DOM" matters.                                                                                                                   | everything                                                                                                                        |
| `useForceRerender` (internal)                                                     | **dropped**                                                                                                                                     | Signals. `CropperPreview` becomes reactive without it.                                                                                                                                          | everything                                                                                                                        |
| `usePersistentFunction` (internal)                                                | **dropped**                                                                                                                                     | Getters read `$props()` directly                                                                                                                                                                | everything                                                                                                                        |
| `useFirstMountState` (internal)                                                   | **dropped**                                                                                                                                     | prev-value snapshot (see `useUpdateEffect`)                                                                                                                                                     | everything                                                                                                                        |
| `useTransition` (internal)                                                        | `class TransitionRunner { active = $state(false); run(cb) }` in `service/transition.svelte.ts`, owning a core `Animation`                       | Same branches as upstream. `onStart`/`onStop` set `active`. Add a `stop()` on destroy, which upstream lacks.                                                                                    | `useRef`/`useState`                                                                                                               |
| `useDeprecationWarning` (internal)                                                | `createDeprecationWarning()`: a closure over a `Set<string>`, called once in the component script (scripts run once)                            | —                                                                                                                                                                                               | `useRef`                                                                                                                          |
| `createCropper` (internal)                                                        | **dropped**                                                                                                                                     | `generics=` attribute and component exports                                                                                                                                                     | —                                                                                                                                 |
| `mergeRefs` (public)                                                              | **same name**, Svelte flavour (§4.5)                                                                                                            | —                                                                                                                                                                                               | `RefCallback` typing                                                                                                              |

**Why the public hooks keep their names.** Parity is a hard requirement (CLAUDE.md). Users porting a custom cropper
(e.g. upstream's `SomethingCropper.tsx`, which composes `useAbstractCropper`, `CropperWrapper`, `StretchableBoundary`, …)
should be able to keep the same imports and the same call shape. `useUpdateEffect` and `useWindowResize` are generic
utilities, but they are part of the exported surface and cost under 20 lines each.

**Documented signature deviations:**

- `useCropperImage` accepts a getter. Passing a plain object still works, but is non-reactive, which is fine for a static `src`.
- `useUpdateEffect` takes `deps` as a getter.
- `useAbstractCropper().image` is a getter property. Destructuring `const { image } = …` **snapshots** it. Use
  `abstract.image` or `cropper.getImage()` in markup. `cropper` and `refs` are stable, so destructuring them is fine.

---

## 9. Reactivity design proposal

### 9.1 `CropperInstance` (Svelte): `src/lib/instance/CropperInstance.svelte.ts`

```ts
import {
	AbstractCropperInstance,
	getEmptyInteractions,
	type AbstractCropperInstanceData,
	type AbstractCropperInstanceProps,
	type AbstractCropperInstanceSettings
} from 'advanced-cropper';

export class CropperInstance<
	Settings extends AbstractCropperInstanceSettings,
	Instance = unknown
> extends AbstractCropperInstance<Settings, Instance> {
	#data = $state.raw<AbstractCropperInstanceData>({
		state: null,
		transitions: false,
		interactions: getEmptyInteractions()
	});
	#props: () => AbstractCropperInstanceProps<Settings, Instance>;

	constructor(props: () => AbstractCropperInstanceProps<Settings, Instance>) {
		super();
		this.#props = props;
	}

	/** Reactive, non-copied view for internal components (avoid getState()'s deep clone). */
	get data(): AbstractCropperInstanceData {
		return this.#data;
	}

	protected getProps() {
		return this.#props();
	}
	protected getData() {
		return this.#data;
	}
	protected setData(data: AbstractCropperInstanceData) {
		this.#data = data;
	}

	destroy() {
		this.endTransitions.clear();
	}
}
```

Why `$state.raw`:

- The core treats data immutably. Every `setData` passes a **new** object built by spread, and `state` is always
  `copyState(...)`, a deep clone.
- A deep `$state` proxy would add proxy overhead to every core read. It would also make `deepCompare`/`deepClone`
  operate on proxies, and it would leak proxies to users through `getState()`/`getSettings()`.
- `$state.raw` gives exactly one signal, updated on assignment, which is what `useForceRerender` emulated.

Consequences:

- **Every core getter is automatically reactive**, because `getState`, `getCoordinates`, `getTransitions`,
  `getInteractions`, `hasInteractions`, `getVisibleArea`, `getTransforms`, `getStencilCoordinates` and `isConsistent`
  all read `#data`. A child component that receives `cropper` and writes `{cropper.getState()?.coordinates.width}`,
  or `$derived(cropper.getTransitions())`, updates with no prop drilling of state. This is the fine-grained equivalent
  of React re-rendering the whole tree on `notify`, and it keeps the public "`cropper` object with methods" contract intact.
- Getters that also read props (`getTransitions`, `getSettings`, `getCoordinates` with rounding, `isConsistent`) track
  those props, through the getter `#props` that reads `$props()`.
- Writes are synchronous. The core's read-after-write sequences inside a single method work unchanged. DOM updates
  batch to the next microtask flush, so one Svelte flush per user event, like React's batched handler render.
- **Never** call a mutating core method inside `$derived` or a template expression. Svelte throws
  `state_unsafe_mutation`. Internal code only mutates from event handlers, effects and async continuations.
- Construction is SSR-safe: there is no DOM or timer access in the constructor (`debounce` only creates closures).
- `destroy()` is called from a teardown `$effect` in `useCropperInstance`. Upstream never clears the timer.
  `clear()` cancels only the latest debounce chain (§1.2), so `getInstance` also returns `null` after destroy (§9.4).
  That way late chains cannot reach user callbacks, matching React's nulled ref.
- `protected endTransitions` is accessible to the subclass. Svelte compiles `#data = $state.raw(...)` in a subclass
  without problems, and the base-class arrow fields are initialised before `#data`. Nothing reads data during construction.
- Getter memoisation (optional): `getProps` can stay unmemoised, which is exact parity, because React also recomputes it
  per call. If profiling shows `createDefaultSettings` churn during drags, wrap the normalized props in a `$derived.by`
  inside `useCropperInstance`. Correctness must not depend on that cache.

`useCropperInstance`:

```ts
export function useCropperInstance<Settings extends CropperInstanceSettings, Instance = unknown>(
	props: () => AbstractCropperInstanceParameters<Settings> &
		AbstractCropperInstanceCallbacks<Instance> & {
			settings?: CropperInstanceSettingsProp<Settings>;
		}
) {
	const instance = new CropperInstance<Settings, Instance>(() => normalizeInstanceProps(props()));
	$effect(() => () => instance.destroy());
	return instance;
}
// normalizeInstanceProps = upstream getProps body verbatim (defaults + createDefaultSettings), §2.2
```

### 9.2 Settings propagation: auto-reconcile

```ts
$effect.pre(() => {
	if (!(props().autoReconcileState ?? true)) return; // reactive (upstream: read once — benign improvement)
	const data = cropper.data; // track state + interactions
	if (!data.state || hasInteractions(data.interactions)) return;
	if (cropper.isConsistent()) return; // TRACKED: reads settings, and any $state read inside user setting functions
	untrack(() => cropper.reconcileState());
});
```

Design notes:

- **`$effect.pre`, not `$effect`.** React used `useLayoutEffect`: commit, reconcile, synchronous re-render, all before
  paint. `$effect.pre` runs before the DOM update of the same flush. Its write to `#data` is seen by the template effects
  that run afterwards in that flush. The result is one DOM write and no inconsistent intermediate DOM. That is strictly
  better than upstream and has no observable downside.
- **Tracking `isConsistent()` is the key trick.** React reconciles after _every_ render, so a setting function whose
  output depends on outside state is re-evaluated whenever the parent re-renders. An example is FixedCropper's
  `stencilSize={({boundary}) => ({width: size})}`, where `size` is parent state. In Svelte the function's identity often
  does not change, because inline arrows in markup are not re-created by unrelated state, so a pure "settings changed"
  dependency would miss it. `isConsistent()` calls `isConsistentState(state, settings)`, which invokes the user's setting
  functions inside the effect's tracking scope, so any `$state` they read becomes a dependency. `reconcileState()` itself
  runs in `untrack`, so its writes and its callbacks do not become dependencies.
- **Residual difference.** Setting functions that read _non-reactive_ external values (module variables, `Date.now()`)
  are re-checked by React on any parent re-render and by Svelte only when tracked dependencies change. Document that
  `reconcileState()` is available imperatively.
- The effect re-runs whenever `#data` changes, for example on every drag frame. While interacting it returns early. After
  interaction ends it catches settings that changed mid-drag, as upstream does. The cost is one
  `hasInteractions` / `isConsistentState` check per data change, the same as React's per-render check.
- `pause`/`resume` are **dropped**. Both upstream flows (`resetCropper`, `refreshCropper`) perform all their state writes
  synchronously after their single `await`, and Svelte effects never interleave with synchronous code. Reconciling the
  _old_ state during the `await` window is harmless, and React's guard did not cover it reliably either (§2.7). If a
  guard is wanted, use a plain non-reactive `let reconcilePaused` checked in the effect. It does not need to be state.
- Stencil constraints: `AbstractCropper.svelte` binds the stencil instance with `bind:this={stencilRef}`. `stencilRef` is
  `$state`, so the settings getter (`stencilConstraints(settings, {...stencilProps, ...stencilRef})`) is reactive to the
  stencil mounting. Exported `aspectRatio` should be a **function** export (`defaultStencilConstraints` calls it if
  `isFunction`, `C:defaults/defaultStencilConstraints.ts:17`) so that it reflects live stencil props.
  Ordering lesson (`05-old-repo.md` #1): apply `stencilConstraints` first, then `createDefaultSettings`, which is the
  upstream order.

### 9.3 `useCropperImage` (Svelte)

```ts
export function useCropperImage(
	options: CropperImageHookSettings | (() => CropperImageHookSettings)
) {
	const get = typeof options === 'function' ? options : () => options;
	let image = $state.raw<CropperImage | null>(null);
	let loading = $state(false);
	let loaded = $state(false);
	const src = $derived(get().src || null); // ← effect depends ONLY on src's value

	$effect(() => {
		const current = src;
		const signal = getAbortSignal(); // synchronously in the effect body (needs active_reaction; never after an await)
		untrack(() => {
			const {
				crossOrigin,
				canvas,
				checkOrientation,
				unloadTime,
				onLoadingStart,
				onLoadingEnd,
				onError
			} = get();
			const wasLoaded = loaded;
			loaded = false;
			if (current) {
				loading = true;
				onLoadingStart?.();
				const promises: Promise<unknown>[] = [
					loadImage(current, {
						crossOrigin: isUndefined(crossOrigin) ? canvas : crossOrigin,
						checkOrientation
					})
				];
				if (wasLoaded && unloadTime) promises.push(promiseTimeout(unloadTime));
				Promise.all(promises)
					.then(([img]) => {
						if (!signal.aborted) setImage(img as CropperImage);
					})
					.catch(() => {
						if (!signal.aborted) get().onError?.();
					})
					.finally(() => {
						if (!signal.aborted) {
							get().onLoadingEnd?.();
							loading = false;
						}
					});
			} else {
				loading = false; // upstream bug fix (§2.3): pending load's finally is skipped
				if (unloadTime)
					promiseTimeout(unloadTime).then(() => {
						if (!signal.aborted) image = null;
					});
				else image = null;
			}
		});
	});

	function setImage(next: CropperImage | null) {
		image = next;
		if (next) {
			loaded = true;
			tick().then(() => {
				if (image === next) get().onLoad?.(next);
			}); // "after commit", like setLoaded(true, cb)
		}
	}

	return { isLoading: () => loading, isLoaded: () => loaded, getImage: () => image, setImage };
}
```

Guarantees and their Svelte mechanics:

- **Only `src` triggers a load.** The getter builds an object literal that reads every option, so tracking `get().src`
  directly would make the effect depend on `crossOrigin`, the callbacks, and so on. Routing it through
  `const src = $derived(...)` means the effect depends on the derived only, and the derived's `===` equality suppresses
  re-runs unless the src _value_ changes. This replaces the upstream `currentSrc !== src` guard.
- **Race handling.** `getAbortSignal()` (exported by `svelte` in the installed 5.57.2, `types/index.d.ts:398`) is aborted when the effect re-runs (new src) or
  is destroyed. That gives "latest effect run wins" by _run_, not by value, which fixes the A → B → A double-set quirk and
  silences callbacks after unmount.
- **`unloadTime`.** `wasLoaded` is read before `loaded = false`, mirroring React's closure value.
- **Order.** `onLoadingStart` → … → `setImage` (`loaded=true`) → `onLoadingEnd` (`finally`, same promise chain) →
  flush → `onLoad`. This is the same relative order as upstream. The only difference is that `loaded` flips in the same
  tick as `image`, not one commit later, which nobody can observe.
- **The user-facing `setImage(img)`** also marks the hook loaded and fires `onLoad`, as upstream's `[image]` effect does.
- **SSR.** `loadImage`, `fetch` and `Image` run only inside `$effect`, which never runs on the server. The initial
  render is `image=null, loading=false, loaded=false` on both sides, so hydration matches.
- The `$effect` is deferred to mount (`user_effect` defers top-level component effects:
  `node_modules/svelte/src/internal/client/reactivity/effects.js:214-227`), matching React's `useEffect` mount timing.

### 9.4 `useAbstractCropper` (Svelte): `src/lib/hooks/useAbstractCropper.svelte.ts`

```ts
export function useAbstractCropper<Extension extends SettingsExtension = {}>(
	props: () => AbstractCropperHookProps<ExtendedSettings<Extension>>
) {
	type Ref = AbstractCropperRef<ExtendedSettings<Extension>>;
	const refs = new AbstractCropperRefs(); // $state fields: image (HTMLElement|null), boundary, canvas
	let currentImage = $state.raw<CropperImage | null>(null);
	let mounted = false; // plain flag, not state
	let resetToken = 0;

	const instance = useCropperInstance<ExtendedSettings<Extension>, Ref>(() => ({
		...props(),
		getInstance: () => (mounted ? cropper : null) // §3.6 parity: null before mount / after destroy
	}));

	const loader = useCropperImage(() => {
		const {
			src,
			crossOrigin = true,
			checkOrientation = true,
			unloadTime = 500,
			canvas = true
		} = props();
		return {
			src,
			crossOrigin,
			checkOrientation,
			unloadTime,
			canvas,
			onError: () => fire(props().onError)
		};
	});

	function fire(callback?: (cropper: Ref) => void) {
		if (mounted) untrack(() => callback?.(cropper));
	}

	async function resetCropper() {
		const boundary = refs.boundary;
		if (!boundary) return;
		const token = ++resetToken;
		const image = loader.getImage();
		const size = await boundary.stretchTo(image);
		if (token !== resetToken) return; // superseded (new guard; upstream had none)
		currentImage = image;
		if (size && image) instance.reset(size, image);
		else instance.clear();
		// onReady fires from the currentImage watcher below, after the DOM flush
	}

	async function refreshCropper() {
		const boundary = refs.boundary;
		if (!boundary) return;
		const image = loader.getImage();
		const size = await boundary.stretchTo(image);
		if (size && image) {
			const state = instance.getState();
			if (state) {
				if (size.width !== state.boundary.width || size.height !== state.boundary.height) {
					instance.setBoundary(size);
					instance.reconcileState();
				}
			} else instance.reset(size, image);
		} else instance.clear();
	}

	const cropper: Ref = {
		reset: resetCropper, // NOTE: resolves after the state reset (upstream resolves before; §3.4)
		refresh: refreshCropper,
		setImage: (image) => {
			currentImage = image;
		},
		reconcileState: instance.reconcileState,
		// …all 33 members, same list as R:hooks/useAbstractCropper.ts:117-168…
		getImage: () => (currentImage ? { ...currentImage } : null), // live, not a render snapshot
		isLoading: loader.isLoading,
		isLoaded: loader.isLoaded
	};

	$effect(() => {
		// first deferred effect → runs first on mount
		mounted = true;
		return () => {
			mounted = false;
		};
	});
	useWindowResize(() => refreshCropper());
	useUpdateEffect(
		() => {
			untrack(resetCropper);
		},
		() => [loader.getImage()]
	);
	useUpdateEffect(
		() => {
			if (currentImage) fire(props().onReady);
		},
		() => [currentImage]
	);
	useUpdateEffect(
		() => {
			fire(props().onUpdate);
		},
		() => [loader.isLoaded(), loader.isLoading()]
	);
	$effect.pre(/* auto-reconcile, §9.2 */);

	return {
		cropper,
		refs,
		get image() {
			return currentImage;
		}
	};
}
```

Key decisions:

- **`onReady` contract.** `onReady` fires _after_ `instance.reset()`, because the reset and `currentImage` are written
  synchronously together. It fires from a post-flush `$effect`, so the DOM already shows the new image **and** state.
  - This implements the React 18 intent explicitly and removes the React 17 inversion (§3.4).
  - Because the flush mounts the background `<img>` (`bind:ref` → `refs.image`) before `onReady`, `getCanvas()` works
    inside the _first_ `onReady`. That is a strict improvement over upstream, where it returns `null`.
  - Upstream-equivalent order: `onChange` → `onUpdate` (sync inside `reset`) → flush → `onReady`.
- **`useUpdateEffect` semantics: compare with the init snapshot, not "skip the first run".** Svelte runs all deferred
  effects in a single mount flush, in creation order. The loader effect sets `loading = true` _during_ that flush, before
  the `onUpdate` watcher's first run. A naive "skip first run" would therefore swallow the `loading` transition that React
  reports, because React sees it as a separate commit. Snapshotting `deps()` untracked when the watcher is created
  (`false, false`) and comparing on each run reproduces React exactly.
- **Wrap every user callback in `untrack`** (`fire`). Callbacks invoked from inside our effects (`onReady`, `onUpdate`,
  `onError`, and core callbacks reached through `reconcileState` / `reset`) would otherwise register the user's reactive
  reads as dependencies of _our_ effects and cause spurious re-runs. Core callbacks are reached from `untrack`ed calls, so
  the same rule holds for them.
- **`getInstance` → `mounted ? cropper : null`.** `cropper` is a single stable object. Unlike React, its identity never
  changes. Before mount and after destroy, the core's `runCallback` drops callbacks, as React's null ref did.
- **`refs`.** `bind:this={refs.boundary}` on `StretchableBoundary`, `bind:this={refs.canvas}` on `CropperCanvas`, and
  `bind:ref={refs.image}` on the background component or `CropperSource` (`02-components.md` §3.4). `bind_this` runs in
  template effects, and top-level `$effect`s are deferred until after the template has mounted
  (`effects.js:214-227`; `dom/elements/bindings/this.js:26-56`). So `refs.boundary` is set by the time any of the mount
  effects above run, matching React, where refs are attached before passive effects.
- **Window resize: no debounce**, matching upstream. Each `resize`/`orientationchange` event calls `refreshCropper`.
  `refreshCropper` is idempotent when the boundary size has not changed. If profiling demands it, an rAF throttle is a
  safe, invisible addition. Keep it out of `useWindowResize` itself, because its public contract is "call on every event".
- **`autoReconcileState`** is read reactively (upstream reads it once). This is benign, and should be documented.
- **SSR**: everything that touches `window`, `document`, `Image`, `fetch` or canvas is in `$effect`s, event handlers, or
  user-invoked methods. On the server, `useAbstractCropper` creates the instance and returns. Markup renders the
  `state === null` branch on both server and client.

### 9.5 Callback timing reference (Svelte port)

| Callback                                                                                                                                                                                    | Fired by                                                    | Relative to the DOM                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onChange`, `onUpdate` (state), `onMove`, `onResize`, `onMoveEnd`, `onResizeEnd`, `onTransformImage`, `onTransformImageEnd`, `onInteractionStart`, `onInteractionEnd`, `onTransitionsStart` | core, **synchronously inside the method call** (§1.2 order) | **before** the flush. The DOM still shows the previous state, and `getState()` already returns the new one. This is identical to React, whose render is also deferred. |
| `onTransitionsEnd` (+`onUpdate`)                                                                                                                                                            | core debounced timer, `duration` ms after the last arming   | async. May fire more than once (debounce quirk)                                                                                                                        |
| `onUpdate` (loading status)                                                                                                                                                                 | `useUpdateEffect` on `[isLoaded, isLoading]`                | after the flush                                                                                                                                                        |
| `onReady`                                                                                                                                                                                   | `useUpdateEffect` on `currentImage`                         | after the flush, after reset                                                                                                                                           |
| `onError`                                                                                                                                                                                   | loader promise `catch`                                      | async, current src only                                                                                                                                                |

The core's `onUpdate` and the hook's `onUpdate` are the same prop. Both stay.

Ordering edge: core callbacks may fire during our `$effect.pre` (auto-reconcile → `onChange`, `onUpdate`). That is the
same as React's layout effect, where callbacks also fire mid-commit. Users must not assume that the DOM reflects the new
state inside `onChange`. That was never true upstream either.

### 9.6 Other components that rely on these hooks

- `CropperPreview` uses `useWindowResize(refresh)` and a `useLayoutEffect(refresh, [coordinates.height, coordinates.width])`
  (`CropperPreview.tsx:151-153`). In Svelte, use `useWindowResize` plus `$effect.pre` / `$effect` on
  `cropper.getState()?.coordinates` width and height. Because instance reads are reactive, a preview given `cropper={ref}`
  now updates **automatically**, whereas upstream needed `onUpdate → previewRef.update()`. Keep `update()`/`refresh()`
  exports for parity. Details are in `02-components.md`.
- `StencilGrid` (`StencilGrid.tsx:18-23`) latches `rows`/`columns` only while visible, so the grid does not change while
  fading out. Use `$effect.pre(() => { if (visible) { currentRows = rows; currentColumns = columns; } })`. Its first run
  equals the initial values, so skipping the first run does not matter.
- `CropperBackgroundWrapper` calls the three options normalizers. In Svelte use
  `const scale = $derived(useScaleImageOptions(scaleImage))`, and so on.

---

## 10. Upstream bugs and quirks: what to keep and what to fix

| #   | Quirk                                                                                                         | Source                                                         | Port decision                                                                                                      |
| --- | ------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| 1   | `onTransitionsEnd` can fire multiple times (debounce never clears)                                            | `C:utils/index.ts:287-313`                                     | Keep (core behaviour)                                                                                              |
| 2   | `onReady` may precede the state reset under React 17 batching                                                 | §3.4                                                           | Fix: always after the reset (React 18 intent)                                                                      |
| 3   | `getCanvas()` is `null` inside the first `onReady`                                                            | §3.4                                                           | Improved for free (flush before `onReady`)                                                                         |
| 4   | `reset()` promise resolves before the reset                                                                   | `useAbstractCropper.ts:78-92`                                  | Resolve after the reset. A superset, so it is non-breaking.                                                        |
| 5   | `isLoading()` stuck `true` when `src` → null mid-load                                                         | `useCropperImage.ts:60-70`                                     | Fix (`loading = false`)                                                                                            |
| 6   | A → B → A double image set                                                                                    | `useCropperImage.ts:45-57`                                     | Fixed by `getAbortSignal`                                                                                          |
| 7   | `autoReconcileState` read once                                                                                | `useCropperAutoReconcile.ts:9`                                 | Reactive (benign)                                                                                                  |
| 8   | `<Cropper autoZoom / stencilSize>` dead                                                                       | `Cropper.tsx:26-55`                                            | Ignore. Optional dev warning.                                                                                      |
| 9   | 4 runtime ref methods untyped                                                                                 | `AbstractCropper.tsx:42-72` vs `useAbstractCropper.ts:117-168` | Type all 33                                                                                                        |
| 10  | `backgroundWrapperClassName` declared, never applied                                                          | `AbstractCropper.tsx:81`                                       | Decide in the component port (`02-components.md`). Likely apply it to the background wrapper, or mirror the no-op. |
| 11  | `ScaleImageOptions.adjustStencil` dropped by `getOptions`                                                     | `useScaleImageOptions.ts:18-29`                                | Mirror (keep the type field)                                                                                       |
| 12  | `getImage()` / `isLoading()` / `isLoaded()` return render snapshots                                           | `useAbstractCropper.ts:163-167`                                | Live values (signals)                                                                                              |
| 13  | Timers and animations not stopped on unmount                                                                  | `useTransition`, `endTransitions`                              | Stop/clear on destroy. Null `getInstance`.                                                                         |
| 14  | `CropperInstanceProps` interface unused                                                                       | `CropperInstance.ts:9-12`                                      | Drop (not public)                                                                                                  |
| 15  | Extension settings other than the 19 names (and `stencilSize`) are not forwarded to `settings` by `<Cropper>` | §2.12                                                          | Mirror (parity). Document.                                                                                         |
| 16  | No window-resize debounce. Container resizes are not observed.                                                | §2.6                                                           | Mirror. Optional rAF throttle internally.                                                                          |

---

## 11. Tests that pin the guarantees (to write alongside the port)

Browser project (`*.svelte.test.ts`, `vitest-browser-svelte`):

1. Callback order on the first image: `onUpdate`(loading) → `onChange` → `onUpdate`(state) → `onReady`. Inside
   `onReady`, `getState()` is non-null and `getCanvas()` is non-null.
2. Changing `src` A → B quickly: only B is applied, with no double `onChange` from a late A. Also cover A → B → A.
3. `src` → `null` during a pending load: `isLoading()` becomes `false`, and the image clears after `unloadTime`.
4. Previously loaded, then a new src: the new state is not applied before `unloadTime` elapses (fake timers or a slow image).
5. Settings change with no interaction: an `aspectRatio` prop change reconciles the state in the same flush (the DOM never
   shows the inconsistent ratio).
6. Settings change mid-drag: no reconcile until `moveCoordinatesEnd`, then it reconciles.
7. FixedCropper `stencilSize` function reading parent `$state`: changing that state reconciles (§9.2 trick).
8. Window resize: a boundary change produces `setBoundary` + reconcile, and an unchanged size is a no-op (`onChange` not fired).
9. Unmount during a transition: no `onTransitionsEnd`/`onUpdate` after destroy, and no errors.
10. `bind:this` exports satisfy `CropperRef` (type test), and all 33 members exist at runtime.
11. `useUpdateEffect` reports a change that happens during the mount flush (the loading-start case).
12. SSR: `render()` from `svelte/server` of `<Cropper src=…>` does not throw and emits the null-state markup (server project).

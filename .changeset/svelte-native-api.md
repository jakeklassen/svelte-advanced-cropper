---
'svelte-advanced-cropper': minor
---

Rebuild the framework layer around a Svelte-native API: compose stencils as children, replace visual layers with typed snippets, register custom stencils through context and read cropper state with `$derived`. Generic instance types preserve extension settings across bindings, callbacks and snippets. The rewrite retains the advanced-cropper geometry core, gestures, fixed-stencil strategies, reactive previews, canvas export, styles and themes, with rewritten demos and documentation.

### Breaking changes

- `stencilComponent` / `stencilProps` → child `RectangleStencil`, `CircleStencil` or custom stencil with direct props. Custom stencils register options with `getCropperContext().registerStencil`.
- Layer/control `*Component` and `*Props` bags → typed `wrapper`, `boundary`, `backgroundWrapper`, `background`, `handler` and `line` snippets. Custom boundaries use `registerBoundary`; export backgrounds attach their drawn element with `attachSource`.
- Per-part `*ClassName(s)` props → one `class` prop, stable part selectors and state modifiers. Styles remain strings.
- `CropperRef` / `CustomCropperRef<E>` → `CropperInstance<E>`; fixed and preview bindings use `FixedCropperInstance<E>` and `CropperPreviewInstance`. The old runtime instance constructor and public `AbstractCropper`, `CropperCanvas` and `ArtificialTransition` exports → internal implementation; compose `Cropper` with algorithms and snippets.
- Public `use*` exports → component composition, reactive reads and application-owned synchronization. Option helpers become `normalizeMoveImageOptions`, `normalizeScaleImageOptions` and `normalizeRotateImageOptions`.
- Svelte `^5.29.0` → `^5.40` for typed context and attachments.
- Deprecated wrapper `loading`/`loaded` and `getInstance` props → instance getters and `bind:this`; ignored `scaleImage.adjustStencil` → `transformImage.adjustStencil`. Built-in settings stay flat; `settings` accepts extension keys only. `CropperSource bind:ref` → `bind:element`; `DraggableElement` → `DraggableArea`; handler/line `onDrag`/`onDragEnd` → `onMove`/`onMoveEnd`.

See [Upgrade from 0.1.x](https://jakeklassen.github.io/svelte-advanced-cropper/docs/migration/from-0-1) and [Coming from react-advanced-cropper](https://jakeklassen.github.io/svelte-advanced-cropper/docs/migration/from-react) for migration examples and complete mappings.

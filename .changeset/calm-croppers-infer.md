---
'svelte-advanced-cropper': minor
---

Infer settings extensions when spreading CropperProps and FixedCropperProps, so composed croppers no longer need an explicit empty type argument. Export SimpleHandlerProps and SimpleLineProps, and use BoundaryHandle as the sole boundary instance type; replace StretchableBoundaryMethods imports with BoundaryHandle.

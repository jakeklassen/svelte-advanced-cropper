---
'svelte-advanced-cropper': patch
---

Measure the cropper's boundary at its layout size, so a cropper inside a dialog that scales in, or inside any scaled container, is sized correctly. Upstream measures the on-screen size, which includes CSS transforms. The new default size algorithm is exported as `fillLayoutBoundary`.

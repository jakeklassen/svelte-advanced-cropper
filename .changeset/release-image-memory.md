---
'svelte-advanced-cropper': patch
---

Release memory that croppers held onto after loading or exporting a rotated photo:

- With `checkOrientation` (the default), a photo with an EXIF orientation is shown from a copy the cropper makes of the file. That copy was never released, so every such photo, which includes most portrait photos from phones, stayed in memory until the page closed. It is now released once the photo is replaced, `src` is cleared, or the cropper is destroyed. Your own `src` URL is never revoked.
- `getCanvas()` on a rotated or flipped image drew the whole photo into a hidden canvas first and kept it there (about 96 MB for a 24 MP photo). That canvas is now emptied after each export.

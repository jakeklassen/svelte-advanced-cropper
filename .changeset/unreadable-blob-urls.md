---
'svelte-advanced-cropper': patch
---

Report `onError` for a `blob:` URL that can no longer be read (revoked, or evicted from memory). With `checkOrientation` on, which is the default, such a load used to hang forever: neither `onReady` nor `onError` fired, because the core reads blob URLs with a request that has no error handler.

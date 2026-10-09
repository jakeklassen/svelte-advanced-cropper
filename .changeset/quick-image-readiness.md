---
'svelte-advanced-cropper': patch
---

Fire `onReady` as soon as the image is loaded, without waiting for asynchronous decoding, while keeping canvas export available inside the callback.

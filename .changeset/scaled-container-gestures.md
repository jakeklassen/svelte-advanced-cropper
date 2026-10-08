---
'svelte-advanced-cropper': patch
---

Make gestures follow the pointer inside a container scaled with a CSS transform. Dragging the stencil or its handles, panning, pinching and wheel zooming used screen pixels as they were, so inside a container scaled to 50% the stencil moved half as far as the pointer and the wheel zoomed around the wrong point.

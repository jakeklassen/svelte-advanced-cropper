<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { ClassValue } from 'svelte/elements'
  import { Animation, type CropperTransitions, deepCompare, isNumber } from 'advanced-cropper'

  interface Props {
    class?: ClassValue
    children?: Snippet
    /** Cropper transitions descriptor (duration, easing, active flag). When `active`, the values are interpolated frame-by-frame; otherwise applied instantly. */
    transitions?: CropperTransitions
    /** Target width in pixels. */
    width?: number
    /** Target height in pixels. */
    height?: number
    /** Target x offset in pixels (applied via `translate3d`). */
    left?: number
    /** Target y offset in pixels (applied via `translate3d`). */
    top?: number
  }

  let { class: className, children, transitions, width, height, left, top }: Props = $props()

  let root: HTMLDivElement | undefined = $state()

  // Imperative scratchpad — NOT $state. Holds the in-flight interpolated
  // values that the per-frame DOM mutation reads. Reactivity here would
  // re-render every animation tick at 60fps for no reason.
  const interp: { left?: number; top?: number; width?: number; height?: number } = {}

  // Long-lived per-component Animation instance — owns the rAF loop, easing,
  // and onStart/onProgress/onStop callbacks. The React port uses useRef for
  // exactly the same reason: keep one instance across renders.
  const animation = new Animation()
  let transitionsActive = $state(false)
  // `remembered` is only read inside the $effect that writes it (to detect
  // value changes). Plain `let` + null sentinel — the first effect run
  // captures the initial target and exits without animating, mirroring the
  // React useState(values) + useLayoutEffect compare-and-skip-first pattern.
  let remembered: { left?: number; top?: number; width?: number; height?: number } | null = null

  function runTransition(callback: (progress: number) => void) {
    if (transitions && transitions.active) {
      animation.start({
        ...transitions,
        onStart() {
          transitionsActive = true
        },
        onProgress(progress) {
          callback(progress)
        },
        onStop() {
          transitionsActive = false
        },
      })
    } else if (!animation.active) {
      callback(1)
    }
  }

  $effect(() => {
    // Track each value individually so the effect re-runs on any change.
    const target = { left, top, width, height }

    // First run: capture initial values, populate interp, no transition.
    // (Matches React's useState(values) + useLayoutEffect skip-on-equal.)
    if (remembered === null) {
      remembered = target
      Object.assign(interp, target)
      return
    }

    if (deepCompare(remembered, target)) return

    const startValues = transitionsActive ? { ...interp } : { ...remembered }
    remembered = target

    runTransition((progress) => {
      const properties = ['left', 'top', 'height', 'width'] as const
      for (const property of properties) {
        const desired = target[property]
        const start = startValues[property]
        interp[property] =
          isNumber(start) && isNumber(desired) ? start + (desired - start) * progress : desired
      }
      if (root) {
        root.style.width = `${interp.width}px`
        root.style.height = `${interp.height}px`
        root.style.transform = `translate3d(${interp.left}px, ${interp.top}px, 0px)`
      }
    })
  })

  // Inline style during transition uses the interpolated values; otherwise
  // the latest target values. The transition runner overrides the DOM
  // directly, so this binding only matters between gestures.
  const rootStyle = $derived(
    transitionsActive
      ? `left:0;top:0;width:${interp.width}px;height:${interp.height}px;transform:translate3d(${interp.left}px,${interp.top}px,0px)`
      : `left:0;top:0;width:${width}px;height:${height}px;transform:translate3d(${left}px,${top}px,0px)`,
  )
</script>

<div
  bind:this={root}
  class={['advanced-cropper-artificial-transition', className]}
  style={rootStyle}
>
  {@render children?.()}
</div>

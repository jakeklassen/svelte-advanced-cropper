<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { ClassValue } from 'svelte/elements'

  interface Props {
    /** When truthy the children fade in over 0.5s; falsy hides them via `opacity: 0; visibility: hidden`. */
    visible?: unknown
    class?: ClassValue
    style?: string
    children?: Snippet
  }

  let { visible, class: className, style, children }: Props = $props()
</script>

<div
  {style}
  class={[
    className,
    'advanced-cropper-fade',
    Boolean(visible) && 'advanced-cropper-fade--visible',
  ]}
>
  {@render children?.()}
</div>

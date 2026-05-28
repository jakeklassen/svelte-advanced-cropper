<script lang="ts">
  import type { HTMLImgAttributes } from 'svelte/elements'

  interface Props extends Omit<HTMLImgAttributes, 'src' | 'crossorigin'> {
    /** Image URL. When null/undefined, nothing renders. */
    src?: string | null
    /** Cross-origin mode. `true` (default) → `'anonymous'`; pass a string for `'use-credentials'`. */
    crossOrigin?: 'anonymous' | 'use-credentials' | boolean
  }

  let { src, crossOrigin = true, ...rest }: Props = $props()

  // Match the React port's `key={src}` remount: a `{#key src}` block forces
  // Svelte to tear down and recreate the <img> when src changes, so any
  // browser image-decoding state attached to the element gets refreshed.
  const co = $derived(crossOrigin === true ? 'anonymous' : crossOrigin || undefined)
</script>

{#if src}
  {#key src}
    <img
      {src}
      class="advanced-cropper-source"
      crossorigin={co}
      {...rest}
      alt={rest.alt ?? ''}
    />
  {/key}
{/if}

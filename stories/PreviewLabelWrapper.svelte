<!-- Demo wrapper used as a CropperPreview `wrapperComponent` override. The
     `accent` and `label` values arrive via `wrapperProps`, demonstrating the
     pass-through prop surface visibly in Storybook. -->
<script lang="ts">
  import type { Snippet } from 'svelte'

  let {
    children,
    label = '',
    accent = '#ff3e00',
    style = '',
  }: {
    children?: Snippet
    label?: string
    accent?: string
    style?: string
    cropper?: unknown
    class?: unknown
  } = $props()
</script>

<div style={`border:2px solid ${accent};border-radius:6px;padding:4px;box-sizing:border-box;${style}`}>
  {@render children?.()}
  {#if label}
    <div style={`font-size:11px;color:${accent};text-align:center;margin-top:3px`}>{label}</div>
  {/if}
</div>

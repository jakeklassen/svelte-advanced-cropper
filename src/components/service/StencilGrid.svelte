<script lang="ts">
  import type { ClassValue } from "svelte/elements";

  interface Props {
    /** Whether the grid is currently shown. Toggles opacity via the `--visible` modifier; while false, prop changes to `columns`/`rows` are cached to avoid mid-fade-out layout shift. */
    visible?: boolean;
    /** Number of vertical divisions. Defaults to 3 (rule of thirds). `RectangleStencil` sets this to 9 while rotating. */
    columns?: number;
    /** Number of horizontal divisions. Defaults to 3. */
    rows?: number;
    class?: ClassValue;
    style?: string;
  }

  let {
    columns = 3,
    rows = 3,
    visible = false,
    class: className,
    style,
  }: Props = $props();

  // Only snap cached rows/columns to new values when visible. This avoids
  // a layout change in a hidden grid that's about to fade in (e.g. cells
  // dropping from 9 back to 3 mid-fade-out after a rotation ends).
  let snapshot = $state<{ columns: number; rows: number } | null>(null);

  $effect(() => {
    if (visible || !snapshot) {
      snapshot = { columns, rows };
    }
  });

  const currentColumns = $derived(snapshot?.columns ?? columns);
  const currentRows = $derived(snapshot?.rows ?? rows);
</script>

<div
  {style}
  class={[
    "advanced-cropper-stencil-grid",
    visible && "advanced-cropper-stencil-grid--visible",
    className,
  ]}
>
  {#each Array(currentRows) as _, i}
    <div class="advanced-cropper-stencil-grid__row">
      {#each Array(currentColumns) as _, j}
        <div
          class={[
            "advanced-cropper-stencil-grid__cell",
            i === 0 && "advanced-cropper-stencil-grid__cell--top",
            i === currentRows - 1 &&
              "advanced-cropper-stencil-grid__cell--bottom",
            j === 0 && "advanced-cropper-stencil-grid__cell--left",
            j === currentColumns - 1 &&
              "advanced-cropper-stencil-grid__cell--right",
          ]}
        ></div>
      {/each}
    </div>
  {/each}
</div>

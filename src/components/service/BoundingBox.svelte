<script module lang="ts">
  import {
    type HorizontalCardinalDirection,
    type OrdinalDirection,
    type VerticalCardinalDirection,
    getDirectionNames,
  } from 'advanced-cropper'

  // The 8 ordinal points around the stencil are a pure compile-time set —
  // the React port wraps the same computation in `useMemo(() => ..., [])`
  // (compute-once memoization). In Svelte the natural equivalent is just to
  // compute once at module init.
  const HORIZONTAL_DIRECTIONS = ['east', 'west', null] as const
  const VERTICAL_DIRECTIONS = ['south', 'north', null] as const

  interface PointNode {
    name: OrdinalDirection
    className: string
    verticalPosition: VerticalCardinalDirection | null
    horizontalPosition: HorizontalCardinalDirection | null
  }

  const POINTS: PointNode[] = (() => {
    const result: PointNode[] = []
    for (const h of HORIZONTAL_DIRECTIONS) {
      for (const v of VERTICAL_DIRECTIONS) {
        if (h === v) continue
        const { snakeCase, camelCase } = getDirectionNames(h, v)
        if (snakeCase && camelCase) {
          result.push({
            name: camelCase as OrdinalDirection,
            className: snakeCase,
            verticalPosition: v,
            horizontalPosition: h,
          })
        }
      }
    }
    return result
  })()
</script>

<script lang="ts">
  import type { Component, Snippet } from 'svelte'
  import type { ClassValue } from 'svelte/elements'
  import {
    type CardinalDirection,
    type Coordinates,
    type MoveDirections,
    type ResizeAnchor,
    type ResizeOptions,
    isCardinalDirection,
    isObject,
  } from 'advanced-cropper'
  import type { HandlerProps, LineProps } from './BoundingBox.types.js'
  import SimpleHandler from '../handlers/SimpleHandler.svelte'
  import SimpleLine from '../lines/SimpleLine.svelte'

  interface HandlerClassNames extends Partial<Record<OrdinalDirection, ClassValue>> {
    default?: ClassValue
    disabled?: ClassValue
    hover?: ClassValue
  }
  interface LineClassNames extends Partial<Record<CardinalDirection, ClassValue>> {
    default?: ClassValue
    disabled?: ClassValue
    hover?: ClassValue
  }

  interface Props {
    style?: string
    class?: ClassValue
    children?: Snippet
    onResize?: (anchor: ResizeAnchor, directions: MoveDirections, options: ResizeOptions) => void
    onResizeEnd?: () => void

    /** Default-component path (React-API parity). Override with your own handler component. */
    handlerComponent?: Component<HandlerProps>
    /** Snippet override path (preferred). Receives the same props the default component would. Takes precedence over `handlerComponent`. */
    handler?: Snippet<[HandlerProps]>
    /** Which ordinal-direction handles to render. `true` enables all; pass an object to enable per direction. */
    handlers?: boolean | Partial<Record<OrdinalDirection, boolean>>
    handlerClassNames?: HandlerClassNames
    handlerWrapperClassNames?: HandlerClassNames

    /** Default-component path (React-API parity). Override with your own line component. */
    lineComponent?: Component<LineProps>
    /** Snippet override path (preferred). Takes precedence over `lineComponent`. */
    line?: Snippet<[LineProps]>
    /** Which cardinal-direction lines to render. `true` enables all; pass an object to enable per direction. */
    lines?: boolean | Partial<Record<CardinalDirection, boolean>>
    lineClassNames?: LineClassNames
    lineWrapperClassNames?: LineClassNames

    disabled?: boolean
    /** The stencil's current coordinates — used as the resize anchor reference. */
    reference?: Coordinates | null
  }

  let {
    style,
    class: className,
    children,
    onResize,
    onResizeEnd,
    handlerComponent: HandlerComponent = SimpleHandler as Component<HandlerProps>,
    handler: handlerSnippet,
    handlers = {
      eastNorth: true,
      north: true,
      westNorth: true,
      west: true,
      westSouth: true,
      south: true,
      eastSouth: true,
      east: true,
    },
    handlerClassNames = {},
    handlerWrapperClassNames = {},
    lineComponent: LineComponent = SimpleLine as Component<LineProps>,
    line: lineSnippet,
    lines = { west: true, north: true, east: true, south: true },
    lineClassNames = {},
    lineWrapperClassNames = {},
    disabled = false,
    reference = null,
  }: Props = $props()

  // The reference captured at the start of a drag. Resize math anchors here
  // so the gesture is consistent through the whole drag (not re-anchored per
  // pixel). null → use the live `reference` prop.
  let lastReference = $state<Coordinates | null>(null)

  const lineNodes = $derived(
    POINTS.filter(
      (p) =>
        isCardinalDirection(p.name) &&
        (isObject(lines) ? (lines as Partial<Record<CardinalDirection, boolean>>)[p.name as CardinalDirection] : lines),
    ).map((p) => ({
      name: p.name as CardinalDirection,
      defaultClassName: [
        lineClassNames.default,
        lineClassNames[p.name as CardinalDirection],
        disabled && lineClassNames.disabled,
      ] satisfies ClassValue,
      wrapperClassName: [
        'advanced-cropper-bounding-box__line',
        `advanced-cropper-bounding-box__line--${p.name}`,
        lineWrapperClassNames.default,
        lineWrapperClassNames[p.name as CardinalDirection],
        disabled && lineWrapperClassNames.disabled,
      ] satisfies ClassValue,
      hoverClassName: lineClassNames.hover,
      verticalPosition: p.verticalPosition,
      horizontalPosition: p.horizontalPosition,
    })),
  )

  const handlerNodes = $derived(
    POINTS.filter((p) => (isObject(handlers) ? handlers[p.name] : handlers)).map((p) => ({
      name: p.name,
      defaultClassName: [handlerClassNames.default, handlerClassNames[p.name]] satisfies ClassValue,
      containerClassName: [
        'advanced-cropper-bounding-box__handler-wrapper',
        `advanced-cropper-bounding-box__handler-wrapper--${p.className}`,
      ] satisfies ClassValue,
      wrapperClassName: [
        'advanced-cropper-bounding-box__handler',
        `advanced-cropper-bounding-box__handler--${p.className}`,
        handlerWrapperClassNames.default,
        handlerWrapperClassNames[p.name],
      ] satisfies ClassValue,
      hoverClassName: handlerClassNames.hover,
      verticalPosition: p.verticalPosition,
      horizontalPosition: p.horizontalPosition,
    })),
  )

  function handleMove(
    horizontalPosition: typeof POINTS[number]['horizontalPosition'],
    verticalPosition: typeof POINTS[number]['verticalPosition'],
    { left, top }: MoveDirections,
    nativeEvent: MouseEvent | TouchEvent,
  ) {
    if (disabled) return
    let respectDirection: 'width' | 'height' | undefined
    if (!verticalPosition && horizontalPosition) respectDirection = 'width'
    else if (verticalPosition && !horizontalPosition) respectDirection = 'height'

    if (onResize) {
      const anchor = getDirectionNames(horizontalPosition, verticalPosition).camelCase
      if (anchor) {
        onResize(anchor as ResizeAnchor, { left, top }, {
          reference: lastReference || reference,
          preserveAspectRatio: nativeEvent && (nativeEvent as MouseEvent).shiftKey,
          respectDirection,
          compensate: true,
        } as ResizeOptions)
      }
    }
    if (!lastReference) {
      lastReference = reference
    }
  }

  function handleMoveEnd() {
    onResizeEnd?.()
    lastReference = null
  }
</script>

<div class={['advanced-cropper-bounding-box', className]} {style}>
  {@render children?.()}

  <div>
    {#each lineNodes as ln (ln.name)}
      {@const props = {
        defaultClassName: ln.defaultClassName,
        hoverClassName: ln.hoverClassName,
        wrapperClassName: ln.wrapperClassName,
        position: ln.name,
        disabled,
        onMove: (d: MoveDirections, e: MouseEvent | TouchEvent) =>
          handleMove(ln.horizontalPosition, ln.verticalPosition, d, e),
        onMoveEnd: handleMoveEnd,
      } satisfies LineProps}
      {#if lineSnippet}
        {@render lineSnippet(props)}
      {:else}
        <LineComponent {...props} />
      {/if}
    {/each}
  </div>

  <div>
    {#each handlerNodes as hn (hn.name)}
      {@const props = {
        defaultClassName: hn.defaultClassName,
        hoverClassName: hn.hoverClassName,
        wrapperClassName: hn.wrapperClassName,
        horizontalPosition: hn.horizontalPosition,
        verticalPosition: hn.verticalPosition,
        disabled,
        onMove: (d: MoveDirections, e: MouseEvent | TouchEvent) =>
          handleMove(hn.horizontalPosition, hn.verticalPosition, d, e),
        onMoveEnd: handleMoveEnd,
      } satisfies HandlerProps}
      <div class={hn.containerClassName}>
        {#if handlerSnippet}
          {@render handlerSnippet(props)}
        {:else}
          <HandlerComponent {...props} />
        {/if}
      </div>
    {/each}
  </div>
</div>

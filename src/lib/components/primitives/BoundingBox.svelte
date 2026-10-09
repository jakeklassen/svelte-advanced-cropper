<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import { getDirectionNames, isCardinalDirection, isObject } from 'advanced-cropper';
	import type { ClassValue } from 'svelte/elements';
	import type {
		CardinalDirection,
		Coordinates,
		HorizontalCardinalDirection,
		MoveDirections,
		OrdinalDirection,
		ResizeAnchor,
		ResizeOptions,
		VerticalCardinalDirection
	} from 'advanced-cropper';

	import type { HandlerSnippetProps, LineSnippetProps } from '../../types';

	export interface BoundingBoxProps {
		style?: string;
		class?: ClassValue;
		handler?: Snippet<[HandlerSnippetProps]>;
		handlers?: boolean | Partial<Record<OrdinalDirection, boolean>>;
		lines?: boolean | Partial<Record<CardinalDirection, boolean>>;
		line?: Snippet<[LineSnippetProps]>;
		disabled?: boolean;
		onResize?: (anchor: ResizeAnchor, directions: MoveDirections, options: ResizeOptions) => void;
		onResizeEnd?: () => void;
		children?: Snippet;
		reference?: Coordinates | null;
	}

	interface PointNode {
		name: OrdinalDirection;
		/** The snake-case BEM modifier, e.g. `east-north`. */
		modifier: string;
		verticalPosition: VerticalCardinalDirection | null;
		horizontalPosition: HorizontalCardinalDirection | null;
	}

	const HORIZONTAL_DIRECTIONS = ['east', 'west', null] as const;
	const VERTICAL_DIRECTIONS = ['south', 'north', null] as const;

	// The eight handler positions: every pair of directions except (null, null).
	const points: PointNode[] = [];
	for (const horizontal of HORIZONTAL_DIRECTIONS) {
		for (const vertical of VERTICAL_DIRECTIONS) {
			const { snakeCase, camelCase } = getDirectionNames(horizontal, vertical);
			if (snakeCase && camelCase) {
				points.push({
					name: camelCase,
					modifier: snakeCase,
					verticalPosition: vertical,
					horizontalPosition: horizontal
				});
			}
		}
	}

	// The four lines sit at the cardinal points.
	const linePoints = points.filter((point): point is PointNode & { name: CardinalDirection } =>
		isCardinalDirection(point.name)
	);
</script>

<script lang="ts">
	import SimpleHandler from '../handlers/SimpleHandler.svelte';
	import SimpleLine from '../lines/SimpleLine.svelte';

	let {
		style,
		class: cssClass,
		children,
		onResize,
		onResizeEnd,
		handler,
		handlers = {
			eastNorth: true,
			north: true,
			westNorth: true,
			west: true,
			westSouth: true,
			south: true,
			eastSouth: true,
			east: true
		},
		lines = {
			west: true,
			north: true,
			east: true,
			south: true
		},
		line,
		disabled = false,
		reference = null
	}: BoundingBoxProps = $props();

	// The reference coordinates at the start of a resize gesture.
	let lastReference: Coordinates | null = null;

	const lineNodes = $derived(
		linePoints.filter((point) => (isObject(lines) ? Boolean(lines[point.name]) : lines))
	);
	const handlerNodes = $derived(
		points.filter((point) => (isObject(handlers) ? Boolean(handlers[point.name]) : handlers))
	);

	// Builds the onMove handler of the handler or line at the given position.
	const createResizeHandler =
		(
			horizontalPosition: HorizontalCardinalDirection | null,
			verticalPosition: VerticalCardinalDirection | null
		) =>
		(directions: MoveDirections, nativeEvent: MouseEvent | TouchEvent) => {
			if (disabled) {
				return;
			}

			// Read the coordinates before resizing: Svelte props
			// are live, so after onResize this would already be the new coordinates.
			const currentReference = reference;
			const anchor = getDirectionNames(horizontalPosition, verticalPosition).camelCase;
			if (onResize && anchor) {
				onResize(
					anchor,
					{ left: directions.left, top: directions.top },
					{
						reference: lastReference ?? currentReference,
						preserveAspectRatio: nativeEvent.shiftKey,
						respectDirection: resizeDirection(horizontalPosition, verticalPosition),
						compensate: true
					}
				);
			}

			lastReference ??= currentReference;
		};

	// A side handler or line resizes along one axis only.
	function resizeDirection(
		horizontalPosition: HorizontalCardinalDirection | null,
		verticalPosition: VerticalCardinalDirection | null
	) {
		if (horizontalPosition && !verticalPosition) {
			return 'width';
		}

		if (verticalPosition && !horizontalPosition) {
			return 'height';
		}

		return undefined;
	}

	const onResizeGestureEnd = () => {
		onResizeEnd?.();
		lastReference = null;
	};
</script>

<div
	class={[
		'advanced-cropper-bounding-box',
		disabled && 'advanced-cropper-bounding-box--disabled',
		cssClass
	]}
	{style}
>
	{@render children?.()}
	<div class="advanced-cropper-bounding-box__lines">
		{#each lineNodes as point (point.name)}
			{@const p = {
				position: point.name,
				disabled,
				class: [
					'advanced-cropper-bounding-box__line',
					`advanced-cropper-bounding-box__line--${point.name}`
				],
				onMove: createResizeHandler(point.horizontalPosition, point.verticalPosition),
				onMoveEnd: onResizeGestureEnd
			}}
			{#if line}{@render line(p)}{:else}<SimpleLine {...p} />{/if}
		{/each}
	</div>
	<div class="advanced-cropper-bounding-box__handlers">
		{#each handlerNodes as point (point.name)}
			{@const p = {
				position: point.name,
				horizontalPosition: point.horizontalPosition,
				verticalPosition: point.verticalPosition,
				disabled,
				class: [
					'advanced-cropper-bounding-box__handler',
					`advanced-cropper-bounding-box__handler--${point.modifier}`
				],
				onMove: createResizeHandler(point.horizontalPosition, point.verticalPosition),
				onMoveEnd: onResizeGestureEnd
			}}
			<div
				class={[
					'advanced-cropper-bounding-box__handler-wrapper',
					`advanced-cropper-bounding-box__handler-wrapper--${point.modifier}`
				]}
			>
				{#if handler}{@render handler(p)}{:else}<SimpleHandler {...p} />{/if}
			</div>
		{/each}
	</div>
</div>

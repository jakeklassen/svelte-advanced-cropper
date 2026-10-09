<script lang="ts" module>
	import type { Component, Snippet } from 'svelte';
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

	/** Props a custom `handlerComponent` receives. */
	export interface HandlerComponentProps {
		defaultClassName?: ClassValue;
		hoverClassName?: ClassValue;
		wrapperClassName?: ClassValue;
		wrapperStyle?: string;
		horizontalPosition?: HorizontalCardinalDirection | null;
		verticalPosition?: VerticalCardinalDirection | null;
		disabled?: boolean;
		onMove?: (shift: MoveDirections, event: TouchEvent | MouseEvent) => void;
		onMoveEnd?: () => void;
	}

	/** Props a custom `lineComponent` receives. */
	export interface LineComponentProps {
		defaultClassName?: ClassValue;
		hoverClassName?: ClassValue;
		wrapperClassName?: ClassValue;
		position?: CardinalDirection;
		disabled?: boolean;
		onMove?: (directions: MoveDirections, event: TouchEvent | MouseEvent) => void;
		onMoveEnd?: () => void;
	}

	export type HandlerComponent = Component<HandlerComponentProps>;
	export type LineComponent = Component<LineComponentProps>;

	export interface HandlerClassNames extends Partial<Record<OrdinalDirection, ClassValue>> {
		default?: ClassValue;
		disabled?: ClassValue;
		hover?: ClassValue;
	}

	export interface LineClassNames extends Partial<Record<CardinalDirection, ClassValue>> {
		default?: ClassValue;
		disabled?: ClassValue;
		hover?: ClassValue;
	}

	export interface BoundingBoxProps {
		style?: string;
		class?: ClassValue;
		handlerComponent?: HandlerComponent;
		handlers?: boolean | Partial<Record<OrdinalDirection, boolean>>;
		handlerClassNames?: HandlerClassNames;
		handlerWrapperClassNames?: HandlerClassNames;
		lines?: boolean | Partial<Record<CardinalDirection, boolean>>;
		lineComponent?: LineComponent;
		lineClassNames?: LineClassNames;
		lineWrapperClassNames?: LineClassNames;
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
		handlerComponent: Handler = SimpleHandler,
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
		handlerClassNames = {},
		handlerWrapperClassNames = {},
		lines = {
			west: true,
			north: true,
			east: true,
			south: true
		},
		lineComponent: Line = SimpleLine,
		lineClassNames = {},
		lineWrapperClassNames = {},
		disabled = false,
		reference = null
	}: BoundingBoxProps = $props();

	// The reference coordinates at the start of a resize gesture.
	let lastReference: Coordinates | null = null;

	const lineNodes = $derived(
		linePoints
			.filter((point) => (isObject(lines) ? lines[point.name] : lines))
			.map((point) => ({
				name: point.name,
				cssClass: [
					lineClassNames.default,
					lineClassNames[point.name],
					disabled && lineClassNames.disabled
				],
				wrapperClassName: [
					'advanced-cropper-bounding-box__line',
					`advanced-cropper-bounding-box__line--${point.name}`,
					lineWrapperClassNames.default,
					lineWrapperClassNames[point.name],
					disabled && lineWrapperClassNames.disabled
				],
				hoverClassName: lineClassNames.hover,
				verticalPosition: point.verticalPosition,
				horizontalPosition: point.horizontalPosition
			}))
	);

	// Like upstream, handlers never get `handlerClassNames.disabled` (lines do).
	const handlerNodes = $derived(
		points
			.filter((point) => (isObject(handlers) ? handlers[point.name] : handlers))
			.map((point) => ({
				name: point.name,
				cssClass: [handlerClassNames.default, handlerClassNames[point.name]],
				containerClassName: [
					'advanced-cropper-bounding-box__handler-wrapper',
					`advanced-cropper-bounding-box__handler-wrapper--${point.modifier}`
				],
				wrapperClassName: [
					'advanced-cropper-bounding-box__handler',
					`advanced-cropper-bounding-box__handler--${point.modifier}`,
					handlerWrapperClassNames.default,
					handlerWrapperClassNames[point.name]
				],
				hoverClassName: handlerClassNames.hover,
				verticalPosition: point.verticalPosition,
				horizontalPosition: point.horizontalPosition
			}))
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

<div class={['advanced-cropper-bounding-box', cssClass]} {style}>
	{@render children?.()}
	<div>
		{#each lineNodes as line (line.name)}
			<Line
				defaultClassName={line.cssClass}
				hoverClassName={line.hoverClassName}
				wrapperClassName={line.wrapperClassName}
				position={line.name}
				{disabled}
				onMove={createResizeHandler(line.horizontalPosition, line.verticalPosition)}
				onMoveEnd={onResizeGestureEnd}
			/>
		{/each}
	</div>
	<div>
		{#each handlerNodes as handler (handler.name)}
			<div class={handler.containerClassName}>
				<Handler
					defaultClassName={handler.cssClass}
					hoverClassName={handler.hoverClassName}
					wrapperClassName={handler.wrapperClassName}
					horizontalPosition={handler.horizontalPosition}
					verticalPosition={handler.verticalPosition}
					{disabled}
					onMove={createResizeHandler(handler.horizontalPosition, handler.verticalPosition)}
					onMoveEnd={onResizeGestureEnd}
				/>
			</div>
		{/each}
	</div>
</div>

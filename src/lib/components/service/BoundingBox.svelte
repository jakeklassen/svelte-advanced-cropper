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

	export type HandlerComponent = Component<any>;
	export type LineComponent = Component<any>;

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
		className: string;
		verticalPosition: VerticalCardinalDirection | null;
		horizontalPosition: HorizontalCardinalDirection | null;
	}

	const HORIZONTAL_DIRECTIONS = ['east', 'west', null] as const;
	const VERTICAL_DIRECTIONS = ['south', 'north', null] as const;

	const points: PointNode[] = [];
	for (const hDirection of HORIZONTAL_DIRECTIONS) {
		for (const vDirection of VERTICAL_DIRECTIONS) {
			if (hDirection !== vDirection) {
				const { snakeCase, camelCase } = getDirectionNames(hDirection, vDirection);
				if (snakeCase && camelCase) {
					points.push({
						name: camelCase,
						className: snakeCase,
						verticalPosition: vDirection,
						horizontalPosition: hDirection
					});
				}
			}
		}
	}
</script>

<script lang="ts">
	import SimpleHandler from '../handlers/SimpleHandler.svelte';
	import SimpleLine from '../lines/SimpleLine.svelte';

	let {
		style,
		class: className,
		children,
		onResize,
		onResizeEnd,
		handlerComponent = SimpleHandler,
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
		lineComponent = SimpleLine,
		lineClassNames = {},
		lineWrapperClassNames = {},
		disabled = false,
		reference = null
	}: BoundingBoxProps = $props();

	// The reference coordinates at the start of a resize gesture.
	let lastReference: Coordinates | null = null;

	const lineNodes = $derived(
		points
			.filter(
				(point) => isCardinalDirection(point.name) && (isObject(lines) ? lines[point.name] : lines)
			)
			.map((point) => {
				const name = point.name as CardinalDirection;

				return {
					name,
					className: [
						lineClassNames.default,
						lineClassNames[name],
						disabled && lineClassNames.disabled
					],
					wrapperClassName: [
						'advanced-cropper-bounding-box__line',
						`advanced-cropper-bounding-box__line--${name}`,
						lineWrapperClassNames.default,
						lineWrapperClassNames[name],
						disabled && lineWrapperClassNames.disabled
					],
					hoverClassName: lineClassNames.hover,
					verticalPosition: point.verticalPosition,
					horizontalPosition: point.horizontalPosition
				};
			})
	);

	const handlerNodes = $derived(
		points
			.filter((point) => (isObject(handlers) ? handlers[point.name] : handlers))
			.map((point) => ({
				name: point.name,
				className: [handlerClassNames.default, handlerClassNames[point.name]],
				containerClassName: [
					'advanced-cropper-bounding-box__handler-wrapper',
					`advanced-cropper-bounding-box__handler-wrapper--${point.className}`
				],
				wrapperClassName: [
					'advanced-cropper-bounding-box__handler',
					`advanced-cropper-bounding-box__handler--${point.className}`,
					handlerWrapperClassNames.default,
					handlerWrapperClassNames[point.name]
				],
				hoverClassName: handlerClassNames.hover,
				verticalPosition: point.verticalPosition,
				horizontalPosition: point.horizontalPosition
			}))
	);

	const onHandlerMove =
		(
			horizontalPosition: HorizontalCardinalDirection | null,
			verticalPosition: VerticalCardinalDirection | null
		) =>
		({ left, top }: MoveDirections, nativeEvent: MouseEvent | TouchEvent) => {
			const directions = { left, top };

			let respectDirection: 'width' | 'height' | undefined;
			if (!verticalPosition && horizontalPosition) {
				respectDirection = 'width';
			} else if (verticalPosition && !horizontalPosition) {
				respectDirection = 'height';
			}

			if (!disabled) {
				// Read the reference before resizing: unlike a React render's props, Svelte props
				// are live, so after onResize this would already be the new coordinates.
				const currentReference = reference;
				if (onResize) {
					const anchor = getDirectionNames(horizontalPosition, verticalPosition).camelCase;
					if (anchor) {
						onResize(anchor, directions, {
							reference: lastReference || currentReference,
							preserveAspectRatio: nativeEvent && nativeEvent.shiftKey,
							respectDirection,
							compensate: true
						});
					}
				}

				if (!lastReference) {
					lastReference = currentReference;
				}
			}
		};

	const onHandlerMoveEnd = () => {
		onResizeEnd?.();
		lastReference = null;
	};

	const LineComponent = $derived(lineComponent);
	const HandlerComponent = $derived(handlerComponent);
</script>

<div class={['advanced-cropper-bounding-box', className]} {style}>
	{@render children?.()}
	<div>
		{#each lineNodes as line (line.name)}
			<LineComponent
				defaultClassName={line.className}
				hoverClassName={line.hoverClassName}
				wrapperClassName={line.wrapperClassName}
				position={line.name}
				{disabled}
				onMove={onHandlerMove(line.horizontalPosition, line.verticalPosition)}
				onMoveEnd={onHandlerMoveEnd}
			/>
		{/each}
	</div>
	<div>
		{#each handlerNodes as handler (handler.name)}
			<div class={handler.containerClassName}>
				<HandlerComponent
					defaultClassName={handler.className}
					hoverClassName={handler.hoverClassName}
					wrapperClassName={handler.wrapperClassName}
					horizontalPosition={handler.horizontalPosition}
					verticalPosition={handler.verticalPosition}
					{disabled}
					onMove={onHandlerMove(handler.horizontalPosition, handler.verticalPosition)}
					onMoveEnd={onHandlerMoveEnd}
				/>
			</div>
		{/each}
	</div>
</div>

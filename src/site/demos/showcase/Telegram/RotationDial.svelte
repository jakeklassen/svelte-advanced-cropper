<script lang="ts">
	import type { ClassValue } from 'svelte/elements';
	import { DraggableArea, type MoveDirections } from 'svelte-advanced-cropper';

	interface Props {
		from: number;
		to: number;
		value: number;
		step?: number;
		/** Width of a bar, in pixels. */
		thickness?: number;
		/** Distance between bars at the centre of the dial, in pixels. */
		density?: number;
		/** Receives the rotation to apply, relative to `value`. */
		onChange?: (shift: number) => void;
		/** Called when a drag ends. */
		onChangeEnd?: () => void;
		class?: ClassValue;
	}

	let {
		from,
		to,
		value,
		step = 2.5,
		thickness = 2,
		density = 10,
		onChange,
		onChangeEnd,
		class: cssClass
	}: Props = $props();

	let width = $state(0);
	let dragging = $state(false);

	function range(start: number, end: number) {
		const result: number[] = [];
		for (let current = start; current < end; current += step) {
			result.push(current);
		}

		return result;
	}

	// The dial is drawn as bars on a half-circle seen edge-on: bars squeeze together and
	// fade out towards the edges.
	const bars = $derived.by(() => {
		const visibleBars = width / density;
		const halfBars = Math.floor(visibleBars / 2);
		// The half-circle's radius, in bars.
		const radiusInBars = Math.ceil(visibleBars / 2);
		// Near the ends of the range, extra bars past `from` and `to` keep the dial full.
		const extraBarsLeft = Math.max(0, halfBars - Math.round((value - from) / step));
		const extraBarsRight = Math.max(0, halfBars - Math.round((to - value) / step));

		const values = [
			...range(from - extraBarsLeft * step, from),
			...range(from, to + step),
			...range(to + step, to + step + extraBarsRight * step)
		];

		const radius = radiusInBars * step;

		return values.map((barValue) => {
			const sign = Math.sign(barValue - value);
			const visible = visibleBars > 0 && Math.abs(barValue - value) / step <= radiusInBars;

			let translate = width / 2 + (sign * width) / 2;
			let opacity = 0;
			if (visible) {
				const multiplier =
					Math.sqrt(radius ** 2 - (value + sign * radius - barValue) ** 2) / radius;
				translate = width / 2 + sign * (width / 2) * multiplier ** 2.5;
				opacity = (Math.sqrt(radius ** 2 - (value - barValue) ** 2) / radius) ** 4;
			}

			return {
				value: barValue,
				// The bars between zero and the current value.
				highlighted: Math.min(0, value) <= barValue && barValue <= Math.max(0, value),
				zero: barValue === 0,
				opacity,
				translate: translate - thickness / 2
			};
		});
	});

	function onMove(directions: MoveDirections) {
		if (!width) {
			return;
		}

		const shift = -(directions.left / density) * step;
		if (value + shift > to) {
			onChange?.(to - value);
		} else if (value + shift < from) {
			onChange?.(from - value);
		} else {
			onChange?.(shift);
		}
	}

	function onMoveStart() {
		dragging = true;
	}

	function onMoveEnd() {
		dragging = false;
		onChangeEnd?.();
	}
</script>

<div class={['telegram-rotation-dial', cssClass]}>
	<DraggableArea {onMoveStart} {onMove} {onMoveEnd} useAnchor={false}>
		<div class={['bars', dragging && 'bars--dragging']} bind:clientWidth={width}>
			{#each bars as bar (bar.value)}
				<div
					class={['bar', bar.zero && 'bar--zero', bar.highlighted && 'bar--highlighted']}
					style:width="{bar.opacity ? thickness : 0}px"
					style:opacity={bar.opacity}
					style:transform="translate({bar.translate}px, -50%)"
				></div>
			{/each}
			<div class={['value']}>
				<div class="value-number">{value.toFixed(1)}°</div>
			</div>
		</div>
	</DraggableArea>
</div>

<style>
	.bars {
		cursor: grab;
		width: 100%;
		display: flex;
		min-width: 0;
		position: relative;
		height: 15px;
	}
	.bars--dragging {
		cursor: grabbing;
	}
	.bar {
		position: absolute;
		left: 0;
		top: 50%;
		height: 15px;
		flex-shrink: 0;
		background: white;
	}
	.bar--highlighted {
		background-color: currentColor;
	}
	.bar--zero {
		height: 20px;
	}
	.value {
		position: absolute;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
		width: 3px;
		height: 25px;
		border-radius: 2px;
		background-color: currentColor;
		color: currentColor;
	}
	.value-number {
		position: absolute;
		top: -20px;
		left: 50%;
		transform: translateX(-50%);
		font-size: 12px;
		color: inherit;
	}
	/* Keep the grabbing cursor while the pointer strays off the dial mid-drag. */
	:global(body):has(.bars--dragging) {
		cursor: grabbing !important;
	}
</style>

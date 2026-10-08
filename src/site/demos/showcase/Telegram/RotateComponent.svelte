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
		onBlur?: () => void;
		class?: ClassValue;
		barsClassName?: ClassValue;
		barClassName?: ClassValue;
		highlightedBarClassName?: ClassValue;
		valueBarClassName?: ClassValue;
		zeroBarClassName?: ClassValue;
	}

	let {
		from,
		to,
		value,
		step = 2.5,
		thickness = 2,
		density = 10,
		onChange,
		onBlur,
		class: className,
		barsClassName,
		barClassName,
		highlightedBarClassName,
		valueBarClassName,
		zeroBarClassName
	}: Props = $props();

	let width = $state(0);
	let dragging = $state(false);

	function range(start: number, end: number) {
		const result: number[] = [];
		for (let current = start; current < end; current += step) result.push(current);
		return result;
	}

	// The dial is drawn as bars on a half-circle seen edge-on: bars squeeze together and
	// fade out towards the edges.
	const bars = $derived.by(() => {
		const count = width / density;
		const leftPadding = Math.max(0, Math.floor(count / 2) - Math.round((value - from) / step));
		const rightPadding = Math.max(0, Math.floor(count / 2) - Math.round((to - value) / step));

		const values = [
			...range(from - leftPadding * step, from),
			...range(from, to + step),
			...range(to + step, to + step + rightPadding * step)
		];

		const radius = Math.abs(Math.ceil(count / 2) * step);

		return values.map((barValue) => {
			const sign = Math.sign(barValue - value);
			const visible = count > 0 && Math.abs(barValue - value) / step <= Math.ceil(count / 2);

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
				highlighted:
					(value < 0 && barValue >= value && barValue <= 0) ||
					(value > 0 && barValue <= value && barValue >= 0),
				zero: barValue === 0,
				opacity,
				translate: translate - thickness / 2
			};
		});
	});

	function onMove(directions: MoveDirections) {
		if (!width) return;
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
		document.body.classList.add('telegram-rotate-dragging');
		dragging = true;
	}

	function onMoveEnd() {
		document.body.classList.remove('telegram-rotate-dragging');
		dragging = false;
		onBlur?.();
	}

	// If the dial is destroyed mid-drag, don't leave the grabbing cursor on the page.
	$effect(() => () => document.body.classList.remove('telegram-rotate-dragging'));
</script>

<div class={['telegram-rotate-component', className]}>
	<DraggableArea {onMoveStart} {onMove} {onMoveEnd} useAnchor={false}>
		<div class={['bars', dragging && 'bars--dragging', barsClassName]} bind:clientWidth={width}>
			{#each bars as bar (bar.value)}
				<div
					class={[
						'bar',
						bar.zero && 'bar--zero',
						bar.highlighted && 'bar--highlighted',
						barClassName,
						bar.highlighted && highlightedBarClassName,
						bar.zero && zeroBarClassName
					]}
					style:width="{bar.opacity ? thickness : 0}px"
					style:opacity={bar.opacity}
					style:transform="translate({bar.translate}px, -50%)"
				></div>
			{/each}
			<div class={['value', valueBarClassName]}>
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
	:global(body.telegram-rotate-dragging) {
		cursor: grabbing !important;
	}
</style>

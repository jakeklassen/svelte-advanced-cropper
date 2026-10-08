<script lang="ts">
	import type { ClassValue } from 'svelte/elements';
	import { on } from 'svelte/events';

	interface Props {
		class?: ClassValue;
		label?: string;
		/** In [-1, 1]. */
		value?: number;
		onChange?: (value: number) => void;
	}

	let { class: className, label, value = 0, onChange }: Props = $props();

	let focus = $state(false);
	let width = $state(0);

	const clamp = (next: number) => Math.max(-1, Math.min(1, next));

	// The handle hides inside the centre dot while the value is close to zero.
	const handleInsideDot = $derived(width ? Math.abs(value) <= 16 / width : true);
	const formattedValue = $derived(`${value > 0 ? '+' : ''}${Math.round(100 * value)}`);

	function stop() {
		focus = false;
	}

	// Mouse and touch dragging: start on the slider, follow the pointer anywhere on the page.
	function draggable(line: HTMLDivElement) {
		const drag = (e: MouseEvent | TouchEvent) => {
			if (!focus) {
				return;
			}

			const position = 'touches' in e ? e.touches[0].clientX : e.clientX;
			const rect = line.getBoundingClientRect();
			onChange?.(clamp((2 * (position - rect.left - rect.width / 2)) / rect.width));
			if (e.cancelable) {
				e.preventDefault();
			}
		};

		const start = (e: MouseEvent | TouchEvent) => {
			focus = true;
			drag(e);
		};

		const options = { passive: false };
		const cleanups = [
			on(line, 'mousedown', start, options),
			on(line, 'touchstart', start, options),
			on(window, 'mousemove', drag, options),
			on(window, 'touchmove', drag, options),
			on(window, 'mouseup', stop),
			on(window, 'touchend', stop)
		];

		return () => cleanups.forEach((cleanup) => cleanup());
	}

	function onkeydown(e: KeyboardEvent) {
		const steps: Record<string, number> = {
			ArrowLeft: value - 0.05,
			ArrowDown: value - 0.05,
			ArrowRight: value + 0.05,
			ArrowUp: value + 0.05,
			Home: -1,
			End: 1
		};
		if (e.key in steps) {
			e.preventDefault();
			onChange?.(clamp(steps[e.key]));
		}
	}
</script>

<div
	class={['image-editor-slider', className]}
	role="slider"
	tabindex="0"
	aria-label={label}
	aria-valuemin={-100}
	aria-valuemax={100}
	aria-valuenow={Math.round(value * 100)}
	bind:clientWidth={width}
	{onkeydown}
	{@attach draggable}
>
	<div class="image-editor-slider__line">
		<div
			class="image-editor-slider__fill"
			style:width="{Math.abs(value) * 50}%"
			style:left="{50 * (1 - Math.abs(Math.min(0, value)))}%"
		></div>
		<div class="image-editor-slider__dot"></div>
		<div
			class={[
				'image-editor-slider__value',
				handleInsideDot && 'image-editor-slider__value--hidden'
			]}
			style:left="{Math.abs(value * 50 + 50)}%"
		>
			{formattedValue}
		</div>
		<div
			class={[
				'image-editor-slider__handler',
				focus && 'image-editor-slider__handler--focus',
				handleInsideDot && 'image-editor-slider__handler--hidden'
			]}
			style:left="{value * 50 + 50}%"
		></div>
	</div>
</div>

<style>
	.image-editor-slider {
		width: 100%;
		max-width: 380px;
		height: 20px;
		padding: 0 16px;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		border-radius: 10px;
		background: rgba(27, 26, 33, 0.4);
		cursor: pointer;
		outline: none;
	}
	.image-editor-slider:focus-visible {
		box-shadow: 0 0 0 2px rgba(97, 218, 251, 0.5);
	}
	.image-editor-slider__line {
		position: relative;
		display: flex;
		align-items: center;
		width: 100%;
		height: 2px;
		background: rgba(255, 255, 255, 0.5);
	}
	.image-editor-slider__fill {
		position: absolute;
		height: 2px;
		background: white;
	}
	.image-editor-slider__dot {
		position: absolute;
		left: 50%;
		top: 50%;
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: white;
		transform: translate(-50%, -50%);
	}
	.image-editor-slider__value {
		position: absolute;
		top: -20px;
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		font-size: 10px;
		font-weight: 500;
		transform: translate(-50%);
		transition-duration: 0.5s;
		transition-property: font-size, opacity;
	}
	.image-editor-slider__value--hidden {
		opacity: 0;
	}
	.image-editor-slider__handler {
		position: absolute;
		width: 2px;
		height: 8px;
		background-color: white;
		transition-duration: 0.2s;
		transition-property: height;
	}
	.image-editor-slider__handler:hover,
	.image-editor-slider__handler--focus {
		height: 10px;
	}
	.image-editor-slider__handler--hidden {
		height: 4px;
	}
</style>

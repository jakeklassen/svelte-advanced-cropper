<script lang="ts">
	import { on } from 'svelte/events';

	interface Props {
		value?: number;
		onChange?: (value: number) => void;
	}

	let { value = 0, onChange }: Props = $props();

	let focus = $state(false);

	function clamp(next: number) {
		return Math.min(1, Math.max(0, next));
	}

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
			const { left, width } = line.getBoundingClientRect();
			onChange?.(clamp((position - left) / width));
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
			Home: 0,
			End: 1
		};
		if (e.key in steps) {
			e.preventDefault();
			onChange?.(clamp(steps[e.key]));
		}
	}
</script>

<div
	class="absolute-zoom-slider"
	role="slider"
	tabindex="0"
	aria-label="Zoom"
	aria-valuemin={0}
	aria-valuemax={100}
	aria-valuenow={Math.round(value * 100)}
	{onkeydown}
	{@attach draggable}
>
	<div class="absolute-zoom-slider__line">
		<div class="absolute-zoom-slider__fill" style:flex-grow={value}></div>
		<div
			class={['absolute-zoom-slider__circle', focus && 'absolute-zoom-slider__circle--focus']}
			style:left="{value * 100}%"
		>
			<div
				class={[
					'absolute-zoom-slider__inner-circle',
					focus && 'absolute-zoom-slider__inner-circle--focus'
				]}
			></div>
		</div>
	</div>
</div>

<style>
	.absolute-zoom-slider {
		flex: 1 1 auto;
		min-width: 0;
		height: 20px;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		border-radius: 5px;
		cursor: pointer;
		outline: none;
	}
	.absolute-zoom-slider__line {
		position: relative;
		display: flex;
		align-items: center;
		width: 100%;
		height: 2px;
		border-radius: 5px;
		background: rgba(255, 255, 255, 0.4);
	}
	.absolute-zoom-slider__fill {
		align-self: stretch;
		flex-shrink: 0;
		background: #61dafb;
	}
	.absolute-zoom-slider__circle {
		position: absolute;
		width: 30px;
		height: 30px;
		margin-left: -15px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: transparent;
		transition-duration: 0.2s;
		transition-property: background-color, box-shadow;
	}
	.absolute-zoom-slider__circle:hover,
	.absolute-zoom-slider:focus-visible .absolute-zoom-slider__circle {
		background-color: rgba(97, 218, 251, 0.1);
	}
	.absolute-zoom-slider__circle--focus {
		background-color: rgba(97, 218, 251, 0.2);
	}
	.absolute-zoom-slider__inner-circle {
		width: 15px;
		height: 15px;
		border-radius: 50%;
		background-color: #61dafb;
		transform: scale(1);
		transition-duration: 0.1s;
		transition-property: transform;
		box-shadow:
			rgba(97, 218, 251, 0.2) 0 0 7px,
			rgba(97, 218, 251, 0.15) 0 1px 3px 1px;
	}
	.absolute-zoom-slider__inner-circle--focus {
		transform: scale(1.2);
	}
</style>

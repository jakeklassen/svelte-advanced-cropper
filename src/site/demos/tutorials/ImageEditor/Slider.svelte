<script lang="ts" module>
	const KEY_STEP = 0.05;

	// The value each key moves the slider to, given the current one.
	const targets: Partial<Record<string, (value: number) => number>> = {
		ArrowLeft: (value) => value - KEY_STEP,
		ArrowDown: (value) => value - KEY_STEP,
		ArrowRight: (value) => value + KEY_STEP,
		ArrowUp: (value) => value + KEY_STEP,
		Home: () => -1,
		End: () => 1
	};

	function clamp(value: number) {
		return Math.min(1, Math.max(-1, value));
	}
</script>

<script lang="ts">
	import type { ClassValue } from 'svelte/elements';

	interface Props {
		class?: ClassValue;
		label?: string;
		/** From -1 to 1. */
		value?: number;
	}

	let { class: className, label, value = $bindable(0) }: Props = $props();

	let track: HTMLDivElement | undefined = $state();
	let width = $state(0);
	let dragging = $state(false);

	// Positions along the line, in percent. The fill runs from the centre to the handle.
	const position = $derived(50 + value * 50);
	const fillLeft = $derived(Math.min(50, position));
	const fillWidth = $derived(Math.abs(value) * 50);
	// The handle sits `|value| × width / 2` pixels from the centre. Within 8px of it, the
	// handle and the value label hide behind the centre dot.
	const handleInsideDot = $derived((Math.abs(value) * width) / 2 <= 8);
	const formattedValue = $derived(`${value > 0 ? '+' : ''}${Math.round(100 * value)}`);

	function setValueFromPointer(clientX: number) {
		if (track) {
			const rect = track.getBoundingClientRect();
			value = clamp((2 * (clientX - rect.left)) / rect.width - 1);
		}
	}

	// Pointer capture keeps the pointer events coming here while the drag leaves the slider.
	function onpointerdown(event: PointerEvent) {
		if (event.button !== 0) {
			return;
		}

		dragging = true;
		track?.setPointerCapture(event.pointerId);
		setValueFromPointer(event.clientX);
	}

	function onpointermove(event: PointerEvent) {
		if (dragging) {
			event.preventDefault();
			setValueFromPointer(event.clientX);
		}
	}

	function onkeydown(event: KeyboardEvent) {
		const target = targets[event.key];
		if (target) {
			event.preventDefault();
			value = clamp(target(value));
		}
	}
</script>

<div
	bind:this={track}
	bind:clientWidth={width}
	class={['image-editor-slider', className]}
	role="slider"
	tabindex="0"
	aria-label={label}
	aria-valuemin={-100}
	aria-valuemax={100}
	aria-valuenow={Math.round(value * 100)}
	{onpointerdown}
	{onpointermove}
	onpointerup={() => (dragging = false)}
	onpointercancel={() => (dragging = false)}
	{onkeydown}
>
	<div class="image-editor-slider__line">
		<div
			class="image-editor-slider__fill"
			style:left="{fillLeft}%"
			style:width="{fillWidth}%"
		></div>
		<div class="image-editor-slider__dot"></div>
		<div
			class={[
				'image-editor-slider__value',
				handleInsideDot && 'image-editor-slider__value--hidden'
			]}
			style:left="{position}%"
		>
			{formattedValue}
		</div>
		<div
			class={[
				'image-editor-slider__handler',
				dragging && 'image-editor-slider__handler--dragging',
				handleInsideDot && 'image-editor-slider__handler--hidden'
			]}
			style:left="{position}%"
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
		/* No scrolling or text selection while dragging. */
		touch-action: none;
		user-select: none;
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
	.image-editor-slider__handler--dragging {
		height: 10px;
	}
	.image-editor-slider__handler--hidden {
		height: 4px;
	}
</style>

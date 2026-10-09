<script lang="ts" module>
	const KEY_STEP = 0.05;

	// The value each key moves the slider to, given the current one.
	const targets: Partial<Record<string, (value: number) => number>> = {
		ArrowLeft: (value) => value - KEY_STEP,
		ArrowDown: (value) => value - KEY_STEP,
		ArrowRight: (value) => value + KEY_STEP,
		ArrowUp: (value) => value + KEY_STEP,
		Home: () => 0,
		End: () => 1
	};

	function clamp(value: number) {
		return Math.min(1, Math.max(0, value));
	}
</script>

<script lang="ts">
	interface Props {
		/** From 0 to 1. */
		value?: number;
		onChange?: (value: number) => void;
	}

	let { value = 0, onChange }: Props = $props();

	let dragging = $state(false);

	function setValueFromPointer(event: PointerEvent & { currentTarget: HTMLDivElement }) {
		const track = event.currentTarget;
		const { left, width } = track.getBoundingClientRect();
		onChange?.(clamp((event.clientX - left) / width));
	}

	// Pointer capture keeps the pointer events coming here while the drag leaves the slider.
	function onpointerdown(event: PointerEvent & { currentTarget: HTMLDivElement }) {
		if (event.button !== 0) {
			return;
		}

		dragging = true;
		event.currentTarget.setPointerCapture(event.pointerId);
		setValueFromPointer(event);
	}

	function onpointermove(event: PointerEvent & { currentTarget: HTMLDivElement }) {
		if (dragging) {
			event.preventDefault();
			setValueFromPointer(event);
		}
	}

	function onkeydown(event: KeyboardEvent) {
		const target = targets[event.key];
		if (target) {
			event.preventDefault();
			onChange?.(clamp(target(value)));
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
	{onpointerdown}
	{onpointermove}
	onpointerup={() => (dragging = false)}
	onpointercancel={() => (dragging = false)}
	{onkeydown}
>
	<div class="absolute-zoom-slider__line">
		<div class="absolute-zoom-slider__fill" style:flex-grow={value}></div>
		<div
			class={['absolute-zoom-slider__circle', dragging && 'absolute-zoom-slider__circle--dragging']}
			style:left="{value * 100}%"
		>
			<div
				class={[
					'absolute-zoom-slider__inner-circle',
					dragging && 'absolute-zoom-slider__inner-circle--dragging'
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
		/* No scrolling or text selection while dragging. */
		touch-action: none;
		user-select: none;
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
	.absolute-zoom-slider__circle--dragging {
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
	.absolute-zoom-slider__inner-circle--dragging {
		transform: scale(1.2);
	}
</style>

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
	import type { ClassValue } from 'svelte/elements';

	interface Props {
		/** From 0 to 1. */
		value?: number;
		onChange?: (value: number) => void;
		class?: ClassValue;
		label?: string;
	}

	let { value = 0, onChange, class: cssClass, label = 'Zoom' }: Props = $props();

	let track: HTMLDivElement | undefined = $state();
	let dragging = $state(false);

	function setValueFromPointer(clientX: number) {
		if (track) {
			const { left, width } = track.getBoundingClientRect();
			onChange?.(clamp((clientX - left) / width));
		}
	}

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
			onChange?.(clamp(target(value)));
		}
	}
</script>

<div
	class={['slider', cssClass]}
	bind:this={track}
	role="slider"
	tabindex="0"
	aria-label={label}
	aria-valuemin={0}
	aria-valuemax={100}
	aria-valuenow={Math.round(value * 100)}
	{onpointerdown}
	{onpointermove}
	onpointerup={() => (dragging = false)}
	onpointercancel={() => (dragging = false)}
	{onkeydown}
>
	<div class="line">
		<div class="fill" style:flex-grow={value}></div>
		<div class={['circle', dragging && 'circle--dragging']} style:left="{value * 100}%">
			<div class={['inner-circle', dragging && 'inner-circle--dragging']}></div>
		</div>
	</div>
</div>

<style>
	/* Themeable with --slider-line, --slider-fill, --slider-thumb, --slider-halo and
	   --slider-line-height, e.g. <Slider --slider-fill="red" />. */
	.slider {
		width: 100%;
		height: 20px;
		display: flex;
		align-items: center;
		flex-direction: column;
		justify-content: center;
		border-radius: 5px;
		cursor: pointer;
		touch-action: none;
		outline: none;
	}
	.line {
		background: var(--slider-line, rgba(255, 255, 255, 0.4));
		height: var(--slider-line-height, 2px);
		width: 100%;
		border-radius: 5px;
		display: flex;
		position: relative;
		align-items: center;
	}
	.fill {
		background: var(--slider-fill, #61dafb);
		align-self: stretch;
		flex-basis: auto;
		flex-shrink: 0;
	}
	.circle {
		width: 30px;
		height: 30px;
		margin-left: -15px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		position: absolute;
		transition-duration: 0.2s;
		transition-property: background-color, box-shadow;
		background-color: transparent;
	}
	.circle:hover,
	.slider:focus-visible .circle {
		background-color: var(--slider-halo, rgba(97, 218, 251, 0.15));
	}
	.circle--dragging {
		background-color: var(--slider-halo, rgba(97, 218, 251, 0.15));
	}
	.inner-circle {
		width: 15px;
		height: 15px;
		border-radius: 50%;
		background-color: var(--slider-thumb, var(--slider-fill, #61dafb));
		transform: scale(1);
		transition-duration: 0.1s;
		transition-property: transform;
		box-shadow:
			rgba(0, 0, 0, 0.2) 0 0 7px,
			rgba(0, 0, 0, 0.15) 0 1px 3px 1px;
	}
	.inner-circle--dragging {
		transform: scale(1.2);
	}
</style>

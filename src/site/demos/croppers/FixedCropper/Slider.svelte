<script lang="ts">
	import type { ClassValue } from 'svelte/elements';

	interface Props {
		/** From 0 to 1. */
		value?: number;
		onChange?: (value: number) => void;
		class?: ClassValue;
		/** Colors and sizes as CSS custom properties, e.g. `--slider-fill: red`. */
		style?: string;
		label?: string;
	}

	let { value = 0, onChange, class: className, style, label = 'Zoom' }: Props = $props();

	let line: HTMLDivElement | undefined = $state();
	let focus = $state(false);

	function update(clientX: number) {
		if (line) {
			const { left, width } = line.getBoundingClientRect();
			onChange?.(Math.min(1, Math.max(0, clientX - left) / width));
		}
	}

	function onpointerdown(event: PointerEvent) {
		if (event.button !== 0) return;
		focus = true;
		line?.setPointerCapture(event.pointerId);
		update(event.clientX);
	}

	function onpointermove(event: PointerEvent) {
		if (focus) {
			event.preventDefault();
			update(event.clientX);
		}
	}

	function onkeydown(event: KeyboardEvent) {
		const step = { ArrowLeft: -0.05, ArrowDown: -0.05, ArrowRight: 0.05, ArrowUp: 0.05 }[event.key];
		if (step) {
			event.preventDefault();
			onChange?.(Math.min(1, Math.max(0, value + step)));
		}
	}
</script>

<div
	class={['slider', className]}
	{style}
	bind:this={line}
	role="slider"
	tabindex="0"
	aria-label={label}
	aria-valuemin={0}
	aria-valuemax={100}
	aria-valuenow={Math.round(value * 100)}
	{onpointerdown}
	{onpointermove}
	onpointerup={() => (focus = false)}
	onpointercancel={() => (focus = false)}
	{onkeydown}
>
	<div class="line">
		<div class="fill" style:flex-grow={value}></div>
		<div class={['circle', focus && 'circle--focus']} style:left="{value * 100}%">
			<div class={['inner-circle', focus && 'inner-circle--focus']}></div>
		</div>
	</div>
</div>

<style>
	.slider {
		--slider-line: rgba(255, 255, 255, 0.4);
		--slider-fill: #61dafb;
		--slider-thumb: var(--slider-fill);
		--slider-halo: rgba(97, 218, 251, 0.15);
		--slider-line-height: 2px;
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
		background: var(--slider-line);
		height: var(--slider-line-height);
		width: 100%;
		border-radius: 5px;
		display: flex;
		position: relative;
		align-items: center;
	}
	.fill {
		background: var(--slider-fill);
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
		background-color: var(--slider-halo);
	}
	.circle--focus {
		background-color: var(--slider-halo);
	}
	.inner-circle {
		width: 15px;
		height: 15px;
		border-radius: 50%;
		background-color: var(--slider-thumb);
		transform: scale(1);
		transition-duration: 0.1s;
		transition-property: transform;
		box-shadow:
			rgba(0, 0, 0, 0.2) 0 0 7px,
			rgba(0, 0, 0, 0.15) 0 1px 3px 1px;
	}
	.inner-circle--focus {
		transform: scale(1.2);
	}
</style>

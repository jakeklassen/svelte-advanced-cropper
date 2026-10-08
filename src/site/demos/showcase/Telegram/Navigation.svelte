<script lang="ts">
	import {
		RotateCcw,
		RotateCw,
		TrianglesCenterlineDashedHorizontal,
		TrianglesCenterlineDashedVertical
	} from '@lucide/svelte';
	import type {
		ImmediatelyOptions,
		InteractionOptions,
		NormalizeOptions,
		TransitionOptions
	} from 'svelte-advanced-cropper';
	import RotateComponent from './RotateComponent.svelte';
	import type { PublicNavigationProps } from './types';

	interface Props extends PublicNavigationProps {
		/** The image rotation, in degrees. */
		value: number;
		onRotate?: (
			angle: number,
			options?: TransitionOptions & InteractionOptions & ImmediatelyOptions
		) => void;
		onRotateEnd?: () => void;
		onFlip?: (
			horizontal: boolean,
			vertical?: boolean,
			options?: TransitionOptions & InteractionOptions & ImmediatelyOptions & NormalizeOptions
		) => void;
		disabled?: boolean;
	}

	let {
		value,
		onRotate,
		onRotateEnd,
		onFlip,
		disabled = false,
		class: className,
		buttonClassName,
		rotateComponentClassName,
		barClassName,
		highlightedBarClassName,
		zeroBarClassName,
		valueBarClassName
	}: Props = $props();

	// The last whole quarter turn. At exactly 45° past a quarter, the angle is ambiguous,
	// so the previous quarter is kept.
	let lastQuarter = 0;

	// The rotation split into whole quarter turns plus a fine adjustment within ±45°.
	const rotation = $derived.by(() => {
		const absolute = Math.abs(value);
		const remainder = absolute % 90;
		let quarter = lastQuarter;
		if (remainder > 45) {
			quarter = (absolute - remainder + 90) / 90;
		} else if (remainder < 45) {
			quarter = (absolute - remainder) / 90;
		}
		lastQuarter = quarter;
		return {
			quarter,
			adjustment: Math.sign(value) * (absolute - quarter * 90)
		};
	});

	function rotateBy(angle: number) {
		if (!disabled) {
			onRotate?.(angle, { transitions: false, interaction: true, immediately: true });
		}
	}

	// The quarter buttons first undo the fine adjustment, then snap to the next quarter.
	function rotateLeft() {
		if (disabled) return;
		const { adjustment } = rotation;
		onRotate?.(adjustment > 0 ? -adjustment : adjustment < 0 ? -90 - adjustment : -90);
	}

	function rotateRight() {
		if (disabled) return;
		const { adjustment } = rotation;
		onRotate?.(adjustment > 0 ? 90 - adjustment : adjustment < 0 ? -adjustment : 90);
	}

	// Flips are relative to the screen, so on an odd quarter turn the axes swap.
	function flip(horizontal: boolean, vertical: boolean) {
		const evenQuarter = rotation.quarter % 2 === 0;
		onFlip?.(evenQuarter ? horizontal : vertical, evenQuarter ? vertical : horizontal, {
			normalize: false
		});
	}
</script>

<div class={['telegram-navigation', className]}>
	<button
		type="button"
		class={['button', buttonClassName]}
		aria-label="Flip horizontally"
		onclick={() => flip(true, false)}
	>
		<TrianglesCenterlineDashedVertical size={22} />
	</button>
	<button
		type="button"
		class={['button', buttonClassName]}
		aria-label="Rotate right"
		onclick={rotateRight}
	>
		<RotateCw size={22} />
	</button>
	<RotateComponent
		class={['rotator', rotateComponentClassName]}
		{barClassName}
		{zeroBarClassName}
		{valueBarClassName}
		{highlightedBarClassName}
		onChange={rotateBy}
		onBlur={onRotateEnd}
		from={-45}
		to={45}
		value={rotation.adjustment}
	/>
	<button
		type="button"
		class={['button', buttonClassName]}
		aria-label="Rotate left"
		onclick={rotateLeft}
	>
		<RotateCcw size={22} />
	</button>
	<button
		type="button"
		class={['button', buttonClassName]}
		aria-label="Flip vertically"
		onclick={() => flip(false, true)}
	>
		<TrianglesCenterlineDashedHorizontal size={22} />
	</button>
</div>

<style>
	.telegram-navigation {
		display: flex;
		align-items: center;
		padding: 20px 15px;
	}
	.telegram-navigation :global(.rotator) {
		width: 100%;
		min-width: 0;
		margin-left: 10px;
		margin-right: 10px;
	}
	.button {
		cursor: pointer;
		width: 24px;
		height: 24px;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		margin: 0 5px;
		background: none;
		border: none;
		outline: none;
		color: white;
		transition: transform 0.5s;
		padding: 0;
	}
	.button:hover,
	.button:focus-visible {
		transform: scale(1.1);
	}
</style>

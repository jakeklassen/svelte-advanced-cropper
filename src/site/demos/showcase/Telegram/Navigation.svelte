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
	import RotationDial from './RotateComponent.svelte';
	import type { NavigationStyle } from './types.ts';

	interface Props extends NavigationStyle {
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

	let { value, onRotate, onRotateEnd, onFlip, disabled = false, class: cssClass }: Props = $props();

	// The quarter the previous rotation was closest to. Deliberately not `$state`: it is the
	// memory of the derived below, not something to react to. Exactly 45° past a quarter is
	// as close to one quarter as to the next, and keeping the previous one stops the dial
	// from jumping between +45° and −45°.
	let lastQuarter = 0;

	// The rotation split into whole quarter turns plus a fine adjustment within ±45°.
	const rotation = $derived.by(() => {
		const absolute = Math.abs(value);
		const quarter = absolute % 90 === 45 ? lastQuarter : Math.round(absolute / 90);
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

	// Snaps to the nearest quarter turn in `direction` (1 is clockwise), or turns a full 90°
	// when the image already sits on a quarter.
	function rotateToQuarter(direction: 1 | -1) {
		if (disabled) {
			return;
		}

		// The rotation is the nearest quarter plus `adjustment`.
		const { adjustment } = rotation;
		if (adjustment === 0) {
			onRotate?.(direction * 90);
		} else if (Math.sign(adjustment) === direction) {
			// The nearest quarter is behind: go on to the next one.
			onRotate?.(direction * 90 - adjustment);
		} else {
			// The nearest quarter is ahead: undo the adjustment.
			onRotate?.(-adjustment);
		}
	}

	// Flips are relative to the screen, so on an odd quarter turn the axes swap.
	function flip(horizontal: boolean, vertical: boolean) {
		if (disabled) {
			return;
		}

		const evenQuarter = rotation.quarter % 2 === 0;
		onFlip?.(evenQuarter ? horizontal : vertical, evenQuarter ? vertical : horizontal, {
			normalize: false
		});
	}
</script>

<div class={['telegram-navigation', cssClass]}>
	<button
		type="button"
		class="telegram-navigation__button"
		aria-label="Flip horizontally"
		onclick={() => flip(true, false)}
	>
		<TrianglesCenterlineDashedVertical size={22} />
	</button>
	<button
		type="button"
		class="telegram-navigation__button"
		aria-label="Rotate right"
		onclick={() => rotateToQuarter(1)}
	>
		<RotateCw size={22} />
	</button>
	<RotationDial
		class="telegram-navigation__dial"
		onChange={rotateBy}
		onChangeEnd={onRotateEnd}
		from={-45}
		to={45}
		value={rotation.adjustment}
	/>
	<button
		type="button"
		class="telegram-navigation__button"
		aria-label="Rotate left"
		onclick={() => rotateToQuarter(-1)}
	>
		<RotateCcw size={22} />
	</button>
	<button
		type="button"
		class="telegram-navigation__button"
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
	.telegram-navigation :global(.telegram-navigation__dial) {
		width: 100%;
		min-width: 0;
		margin-left: 10px;
		margin-right: 10px;
	}
	.telegram-navigation__button {
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
	.telegram-navigation__button:hover,
	.telegram-navigation__button:focus-visible {
		transform: scale(1.1);
	}
</style>

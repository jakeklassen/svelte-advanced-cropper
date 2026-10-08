<script lang="ts">
	import {
		RotateCcw,
		RotateCw,
		// Named by the mirror axis that is drawn: a vertical axis means a horizontal flip.
		TrianglesCenterlineDashedHorizontal as FlipVerticalIcon,
		TrianglesCenterlineDashedVertical as FlipHorizontalIcon,
		Undo2
	} from '@lucide/svelte';

	interface Props {
		changed?: boolean;
		onRotate?: (angle: number) => void;
		onFlip?: (horizontal: boolean, vertical: boolean) => void;
		onReset?: () => void;
	}

	let { changed = false, onRotate, onFlip, onReset }: Props = $props();
</script>

<div class="navigation">
	<button
		type="button"
		class="button"
		aria-label="Flip horizontally"
		onclick={() => onFlip?.(true, false)}
	>
		<FlipHorizontalIcon size={22} />
	</button>
	<button type="button" class="button" aria-label="Rotate right" onclick={() => onRotate?.(90)}>
		<RotateCw size={22} />
	</button>
	<div class="delimiter">
		<div class={['dot', changed && 'dot--hidden']}></div>
		<button
			type="button"
			class={['button', 'reset', !changed && 'reset--hidden']}
			aria-label="Reset"
			tabindex={changed ? 0 : -1}
			onclick={onReset}
		>
			<Undo2 size={22} />
		</button>
	</div>
	<button type="button" class="button" aria-label="Rotate left" onclick={() => onRotate?.(-90)}>
		<RotateCcw size={22} />
	</button>
	<button
		type="button"
		class="button"
		aria-label="Flip vertically"
		onclick={() => onFlip?.(false, true)}
	>
		<FlipVerticalIcon size={22} />
	</button>
</div>

<style>
	.navigation {
		background: #080808;
		border-top: solid 1px #171616;
		height: 64px;
		display: flex;
		justify-content: center;
	}
	.delimiter {
		width: 80px;
		display: flex;
		align-items: center;
		justify-content: center;
		position: relative;
		flex-shrink: 1;
	}
	.dot {
		width: 6px;
		height: 6px;
		background: #393939;
		border-radius: 50%;
		transform: scale(1);
		transition: transform 0.5s;
	}
	.dot--hidden {
		transform: scale(0);
	}
	.button {
		cursor: pointer;
		width: 80px;
		min-width: 0;
		flex-shrink: 1;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
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
	.reset {
		position: absolute;
		top: 50%;
		left: 50%;
		transition-delay: 0.25s;
	}
	.reset,
	.reset:hover,
	.reset:focus-visible {
		transform: translate(-50%, -50%) scale(1);
	}
	.reset--hidden,
	.reset--hidden:hover,
	.reset--hidden:focus-visible {
		transition-delay: 0s;
		transform: translate(-50%, -50%) scale(0);
	}
</style>

<script lang="ts">
	import type { ClassValue } from 'svelte/elements';
	import {
		Cropper,
		getCloserAngle,
		isEqualState,
		type CropperProps,
		type CropperRef
	} from 'svelte-advanced-cropper';
	import Navigation from './Navigation.svelte';

	type Props = CropperProps & {
		wrapperClassName?: ClassValue;
	};

	let { wrapperClassName, class: className, onChange, ...props }: Props = $props();

	let cropper: CropperRef | undefined = $state();
	let changed = $state(false);

	// The default state, with its rotation moved to the full turn closest to the current
	// one, so that resetting never spins the image all the way around.
	function getDefaultState() {
		const currentState = cropper?.getState();
		const defaultState = cropper?.getDefaultState();

		return currentState && defaultState
			? {
					...defaultState,
					transforms: {
						...defaultState.transforms,
						rotate: getCloserAngle(currentState.transforms.rotate, defaultState.transforms.rotate)
					}
				}
			: null;
	}

	// Show the reset button only while the state differs from the default one.
	function updateChanged(instance: CropperRef) {
		changed = !isEqualState(instance.getState(), getDefaultState());
		onChange?.(instance);
	}
</script>

<div class={['default-cropper', wrapperClassName]}>
	<Cropper
		{...props}
		onChange={updateChanged}
		class={['default-cropper__cropper', className]}
		bind:this={cropper}
	/>
	<div class="default-cropper__navigation">
		<Navigation
			{changed}
			onReset={() => cropper?.setState(getDefaultState())}
			onFlip={(horizontal, vertical) => cropper?.flipImage(horizontal, vertical)}
			onRotate={(angle) => cropper?.rotateImage(angle)}
		/>
	</div>
</div>

<style>
	.default-cropper {
		display: flex;
		flex-direction: column;
		height: 100%;
		background: black;
	}
	.default-cropper :global(.default-cropper__cropper) {
		height: 100%;
		min-height: 0;
	}
	.default-cropper__navigation {
		height: 64px;
		flex-shrink: 0;
		margin-top: auto;
	}
</style>

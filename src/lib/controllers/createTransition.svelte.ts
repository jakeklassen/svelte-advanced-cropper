import { onDestroy } from 'svelte';
import { Animation, type CropperTransitions } from 'advanced-cropper';

export function createTransition(getTransitions: () => CropperTransitions | null | undefined) {
	const animation = new Animation();
	let active = $state(false);

	onDestroy(() => animation.stop());

	return {
		run(callback: (progress: number) => void) {
			const transitions = getTransitions();
			if (transitions?.active) {
				animation.start({
					...transitions,
					onStart() {
						active = true;
					},
					onProgress: callback,
					onStop() {
						active = false;
					}
				});
			} else if (!animation.active) {
				callback(1);
			}
		},
		get active() {
			return active;
		}
	};
}

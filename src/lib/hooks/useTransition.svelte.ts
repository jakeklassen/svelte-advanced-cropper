import { onDestroy } from 'svelte';
import { Animation, type CropperTransitions } from 'advanced-cropper';

/**
 * Runs a transition with the core `Animation`. Returns a runner and a reactive
 * `active` flag. Used by `ArtificialTransition`.
 */
export function useTransition(getTransitions: () => CropperTransitions | null | undefined) {
	const animation = new Animation();
	let active = $state(false);

	// Upstream leaves the animation running after unmount; stop it with the component.
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

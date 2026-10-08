import { untrack } from 'svelte';

interface ReconcilableCropper {
	hasInteractions: () => boolean;
	reconcileState: () => void;
}

/**
 * Upstream runs `reconcileState` in a dependency-less `useLayoutEffect`, i.e. after
 * every render of the cropper, and that is what makes changed settings take effect.
 * Here the effect re-runs whenever `isConsistent` might change its answer: it reads
 * the state and the settings, and calling the settings' restriction functions also
 * tracks any `$state` they read.
 */
export function useCropperAutoReconcile(
	cropper: ReconcilableCropper,
	enabled: boolean,
	isConsistent: () => boolean
) {
	let active = $state(true);

	$effect(() => {
		const consistent = isConsistent();
		if (enabled && active && !consistent) {
			untrack(() => {
				if (!cropper.hasInteractions()) {
					cropper.reconcileState();
				}
			});
		}
	});

	return {
		pause() {
			active = false;
		},
		resume() {
			active = true;
		}
	};
}

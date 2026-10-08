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
	// A count rather than a flag: reset and refresh can overlap, and reconciling must
	// stay paused until every one of them has resumed.
	let pauseCount = $state(0);

	if (enabled) {
		$effect(() => {
			// While paused, only the count is tracked; resuming re-checks everything.
			if (pauseCount > 0 || isConsistent()) {
				return;
			}

			untrack(() => {
				if (!cropper.hasInteractions()) {
					cropper.reconcileState();
				}
			});
		});
	}

	// Untracked, so that pausing from inside a caller's effect doesn't make that effect
	// depend on the count it just changed.
	return {
		pause() {
			untrack(() => pauseCount++);
		},
		resume() {
			untrack(() => pauseCount--);
		}
	};
}

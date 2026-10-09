import { untrack } from 'svelte';

interface ReconcilableCropper {
	hasInteractions: () => boolean;
	reconcileState: () => void;
}

/** Keeps settings consistent, deferring work until geometry operations and gestures finish. */
export function observeReconciliation(
	cropper: ReconcilableCropper,
	enabled: () => boolean,
	isConsistent: () => boolean
) {
	let pauseCount = $state(0);
	let requested = $state(0);
	let applied = 0;
	$effect(() => {
		if (pauseCount > 0) {
			return;
		}

		const revision = requested;
		const forced = revision !== applied;
		if (!enabled() && !forced) {
			return;
		}

		const interacting = cropper.hasInteractions();
		const consistent = isConsistent();
		if (interacting) {
			return;
		}

		untrack(() => {
			applied = revision;
			if (forced || !consistent) {
				cropper.reconcileState();
			}
		});
	});

	return {
		request() {
			untrack(() => requested++);
		},
		pause() {
			untrack(() => pauseCount++);
			let released = false;

			return () => {
				if (!released) {
					released = true;
					untrack(() => pauseCount--);
				}
			};
		}
	};
}

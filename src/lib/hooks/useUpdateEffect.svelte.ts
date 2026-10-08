import { untrack } from 'svelte';
import { deepCompare } from 'advanced-cropper';

/**
 * Svelte version of upstream's `useUpdateEffect`: runs `effect` whenever the values
 * read by `deps` change, but not on mount.
 *
 * Upstream takes a React dependency array. Here `deps` is a function, and whatever
 * reactive state it reads becomes a dependency. `effect` runs untracked.
 *
 * Svelte runs all of a component's mount effects in one batch, so a value can change
 * before this effect first runs (for example, an image that starts loading in an
 * earlier effect). To still catch that change, the first run compares against the
 * value seen when the hook was created instead of skipping unconditionally.
 */
export function useUpdateEffect(effect: () => void | (() => void), deps: () => unknown): void {
	const initial = untrack(deps);
	let firstRun = true;
	$effect(() => {
		const current = deps();
		if (firstRun) {
			firstRun = false;
			if (deepCompare(initial, current)) return;
		}
		return untrack(effect);
	});
}

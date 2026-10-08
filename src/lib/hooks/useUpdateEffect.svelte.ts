import { onDestroy, untrack } from 'svelte';

function sameDeps(a: unknown, b: unknown): boolean {
	if (Array.isArray(a) && Array.isArray(b)) {
		return a.length === b.length && a.every((value, index) => Object.is(value, b[index]));
	}

	return Object.is(a, b);
}

/**
 * Svelte version of upstream's `useUpdateEffect`: runs `effect` whenever the
 * dependencies returned by `deps` change, but not on mount.
 *
 * As with React, dependencies are compared with `Object.is` (element-wise for arrays).
 * The effect's cleanup runs only before the next run or on destroy, not every time a
 * tracked value changes without changing the dependencies. `effect` runs untracked.
 *
 * Svelte runs all of a component's mount effects in one batch, so a dependency can
 * change before this effect first runs (for example, an image that starts loading in
 * an earlier effect). The comparison starts from the values seen when the hook was
 * created, so such a change still counts.
 */
export function useUpdateEffect(effect: () => void | (() => void), deps: () => unknown): void {
	let previous = untrack(deps);
	let cleanup: void | (() => void);

	$effect(() => {
		const current = deps();
		if (sameDeps(previous, current)) {
			return;
		}

		previous = current;
		untrack(() => {
			cleanup?.();
			cleanup = effect();
		});
	});

	onDestroy(() => cleanup?.());
}

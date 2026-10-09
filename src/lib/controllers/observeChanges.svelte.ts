import { onDestroy, untrack } from 'svelte';

function sameDeps(a: unknown, b: unknown): boolean {
	if (Array.isArray(a) && Array.isArray(b)) {
		return a.length === b.length && a.every((value, index) => Object.is(value, b[index]));
	}

	return Object.is(a, b);
}

export function observeChanges(effect: () => void | (() => void), deps: () => unknown): void {
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

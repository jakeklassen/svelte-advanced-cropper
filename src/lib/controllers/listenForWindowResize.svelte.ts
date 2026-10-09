import { untrack } from 'svelte';
import { on } from 'svelte/events';

export function listenForWindowResize(callback: (...args: unknown[]) => void): void {
	const listener = () => untrack(() => callback());
	$effect(() => {
		const removeResize = on(window, 'resize', listener);
		const removeOrientationChange = on(window, 'orientationchange', listener);

		return () => {
			removeResize();
			removeOrientationChange();
		};
	});
}

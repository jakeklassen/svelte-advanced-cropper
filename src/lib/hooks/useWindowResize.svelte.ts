import { on } from 'svelte/events';

/**
 * Calls `callback` on window `resize` and `orientationchange`. Call it during component
 * initialisation. The listeners are removed when the component is destroyed.
 */
export function useWindowResize(callback: (...args: unknown[]) => void): void {
	// Upstream calls the callback without the event.
	const listener = () => callback();
	$effect(() => {
		const removeResize = on(window, 'resize', listener);
		const removeOrientationChange = on(window, 'orientationchange', listener);

		return () => {
			removeResize();
			removeOrientationChange();
		};
	});
}

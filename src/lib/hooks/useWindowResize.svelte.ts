/**
 * Calls `callback` on window `resize` and `orientationchange`. Call it during component
 * initialisation. The listeners are removed when the component is destroyed.
 */
export function useWindowResize(callback: (...args: unknown[]) => void): void {
	const listener = () => callback();
	$effect(() => {
		window.addEventListener('resize', listener);
		window.addEventListener('orientationchange', listener);
		return () => {
			window.removeEventListener('resize', listener);
			window.removeEventListener('orientationchange', listener);
		};
	});
}

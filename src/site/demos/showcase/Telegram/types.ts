import type { ClassValue } from 'svelte/elements';

/** Navigation styling uses its root class and stable descendant selectors. */
export interface NavigationStyle {
	class?: ClassValue;
}

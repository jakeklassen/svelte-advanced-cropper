import type { ClassValue } from 'svelte/elements';

/** Class names a TelegramCropper user can pass down to its navigation. */
export interface NavigationClassNames {
	class?: ClassValue;
	buttonClassName?: ClassValue;
	rotateComponentClassName?: ClassValue;
	barClassName?: ClassValue;
	highlightedBarClassName?: ClassValue;
	zeroBarClassName?: ClassValue;
	valueBarClassName?: ClassValue;
}

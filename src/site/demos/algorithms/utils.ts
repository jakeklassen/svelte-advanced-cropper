import type { Coordinates } from 'svelte-advanced-cropper';

/** Positions an absolutely placed box at the given coordinates. */
export function coordinatesToStyle(coordinates: Coordinates | null): string {
	return coordinates
		? `width: ${coordinates.width}px; height: ${coordinates.height}px; left: ${coordinates.left}px; top: ${coordinates.top}px;`
		: '';
}

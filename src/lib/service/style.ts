/**
 * The core returns styles as camelCase objects . Svelte
 * takes a style string, so convert them here.
 */
export function styleToString(
	style: Record<string, string | number | null | undefined> | null | undefined
): string {
	if (!style) {
		return '';
	}

	let result = '';
	for (const [key, value] of Object.entries(style)) {
		if (value === undefined || value === null || value === '') {
			continue;
		}

		const property = key.startsWith('--')
			? key
			: key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
		result += `${property}: ${String(value)};`;
	}

	return result;
}

/** Joins style strings, skipping empty parts. Later parts win, as with object spread. */
export function mergeStyles(...styles: (string | null | undefined)[]): string {
	return styles.filter(Boolean).join(';');
}

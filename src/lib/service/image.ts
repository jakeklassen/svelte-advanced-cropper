/** Maps the `crossOrigin` prop to the `<img crossorigin>` attribute: `true` means anonymous. */
export function crossOriginAttribute(
	crossOrigin: 'anonymous' | 'use-credentials' | boolean | undefined
): 'anonymous' | 'use-credentials' | undefined {
	if (crossOrigin === true) {
		return 'anonymous';
	}

	return crossOrigin || undefined;
}

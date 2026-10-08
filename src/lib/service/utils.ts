import { DEV } from 'esm-env';

export function deprecationWarning(text: string) {
	if (DEV) {
		console.warn(`Deprecation warning: ${text}`);
	}
}

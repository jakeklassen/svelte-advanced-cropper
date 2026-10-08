import { deprecationWarning } from '../service/utils';

/** Returns a warn function that prints each distinct message once per component. */
export function useDeprecationWarning() {
	const fired: string[] = [];

	return (message: string) => {
		if (!fired.includes(message)) {
			deprecationWarning(message);
			fired.push(message);
		}
	};
}

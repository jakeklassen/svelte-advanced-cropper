import { asset, resolve } from '$app/paths';

// `resolve` and `asset` are typed against the generated route and asset unions. Docs
// links come from data (nav entries, markdown), so treat them as plain strings.
const resolvePath = resolve as (path: string) => string;
const assetPath = asset as (file: string) => string;

/** A site link that respects the deploy base path. */
export function href(path: string): string {
	return resolvePath(path);
}

/** URL of a demo photo in `static/img/images`. */
export function image(name: string): string {
	return assetPath(`img/images/${name}`);
}

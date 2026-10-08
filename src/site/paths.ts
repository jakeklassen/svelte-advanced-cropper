import { asset, resolve } from '$app/paths';

type Pathname = Parameters<typeof resolve>[0];
type AssetPath = Parameters<typeof asset>[0];

/** A site link that respects the deploy base path. */
export function href(path: string): string {
	return resolve(path as Pathname);
}

/** URL of a demo photo in `static/img/images`. */
export function image(name: string): string {
	return asset(`img/images/${name}` as AssetPath);
}

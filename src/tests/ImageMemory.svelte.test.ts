import { describe, expect, it } from 'vitest';
import { createTestImage, mountCropper, waitFor } from './fixtures';
import orientedPhoto from './images/exif-orientation-6-quadrants.jpg?url';

// For a photo with an EXIF orientation, the cropper (checkOrientation, the default) shows a
// copy of the file under its own object URL. These tests check that copy is released, and
// that the app's own URL never is.

async function isReadable(url: string): Promise<boolean> {
	try {
		const response = await fetch(url);
		await response.body?.cancel();

		return true;
	} catch {
		return false;
	}
}

async function objectUrlOf(url: string): Promise<string> {
	const response = await fetch(url);

	return URL.createObjectURL(await response.blob());
}

async function mountRotatedPhoto() {
	const mounted = await mountCropper({ src: orientedPhoto });
	const copy = mounted.cropper().getImage()?.src;
	if (!copy) {
		throw new Error('no image');
	}

	// The core's copy, not the URL the app passed.
	expect(copy).toMatch(/^blob:/);
	expect(await isReadable(copy)).toBe(true);

	return { ...mounted, copy };
}

describe("the cropper's copy of a rotated photo", () => {
	it('is released when another photo replaces it', async () => {
		const { screen, cropper, copy } = await mountRotatedPhoto();
		await screen.rerender({ src: createTestImage() });
		await waitFor(() => cropper().getImage()?.src !== copy);

		expect(await isReadable(copy)).toBe(false);
	});

	it('is released when src is cleared', async () => {
		const { screen, cropper, copy } = await mountRotatedPhoto();
		await screen.rerender({ src: null });
		await waitFor(() => cropper().getImage() === null);

		expect(await isReadable(copy)).toBe(false);
	});

	it('is released when the cropper is unmounted', async () => {
		const { screen, copy } = await mountRotatedPhoto();
		await screen.unmount();

		expect(await isReadable(copy)).toBe(false);
	});
});

describe("the app's own object URL", () => {
	it.each([
		['a rotated photo', orientedPhoto],
		['an upright photo', createTestImage()]
	])('is left alone after showing %s', async (_name, photo) => {
		const src = await objectUrlOf(photo);
		const { screen, cropper } = await mountCropper({ src });
		const shown = cropper().getImage()?.src;
		await screen.rerender({ src: createTestImage() });
		await waitFor(() => cropper().getImage()?.src !== shown);
		await screen.unmount();

		expect(await isReadable(src)).toBe(true);
		URL.revokeObjectURL(src);
	});
});

import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import type { CropperRef } from '#lib';
import Harness from './Harness.svelte';
import { delay, mountCropper, waitFor } from './fixtures';
import orientedPhoto from './images/exif-orientation-6-quadrants.jpg?url';

// An upload whose object URL was revoked (or whose blob the browser evicted): what a phone
// can hand you some time after the photo was picked.
function revokedBlobUrl() {
	const url = URL.createObjectURL(new Blob(['not a photo'], { type: 'image/jpeg' }));
	URL.revokeObjectURL(url);

	return url;
}

const failingSources = {
	'a 404': () => '/does-not-exist.jpg',
	'corrupt image data': () => 'data:image/jpeg;base64,bm90IGEgcGhvdG8=',
	'a refused connection': () => 'http://127.0.0.1:9/photo.jpg',
	'a revoked blob URL': revokedBlobUrl
};

async function mountFailing(src: string, checkOrientation: boolean) {
	const onReady = vi.fn<(cropper: CropperRef) => void>();
	const onError = vi.fn<(cropper: CropperRef) => void>();
	const screen = await render(Harness, { src, checkOrientation, onReady, onError });

	return { screen, onReady, onError, cropper: () => screen.component.getCropper() };
}

describe('failed image loads', () => {
	for (const checkOrientation of [true, false]) {
		describe(`checkOrientation=${checkOrientation}`, () => {
			for (const [name, source] of Object.entries(failingSources)) {
				it(`reports ${name} through onError`, async () => {
					const { onReady, onError, cropper } = await mountFailing(source(), checkOrientation);
					await waitFor(() => onError.mock.calls.length > 0);
					// Let any late callback arrive before checking there was only one.
					await delay(50);

					expect(onError).toHaveBeenCalledTimes(1);
					expect(onReady).not.toHaveBeenCalled();
					expect(cropper()?.isLoading()).toBe(false);
					expect(cropper()?.isLoaded()).toBe(false);
				});
			}
		});
	}

	it('still loads a readable blob URL, orientation included', async () => {
		// An upload, as an app gets it: an object URL for the picked file.
		const file = await (await fetch(orientedPhoto)).blob();
		const src = URL.createObjectURL(file);
		const { cropper, onReady } = await mountCropper({ src, checkOrientation: true });

		expect(onReady).toHaveBeenCalledTimes(1);
		// Stored 240×180 with EXIF "rotate 90°": oriented, the cropper shows it upright.
		cropper().setCoordinates(
			{ left: 0, top: 0, width: Infinity, height: Infinity },
			{ transitions: false }
		);
		const canvas = cropper().getCanvas();
		expect({ width: canvas?.width, height: canvas?.height }).toEqual({ width: 180, height: 240 });
		URL.revokeObjectURL(src);
	});

	it('does not call onError after the cropper is unmounted mid-load', async () => {
		const { screen, onError } = await mountFailing('/does-not-exist.jpg', false);
		await screen.unmount();
		// Longer than the failed request takes, so a late onError would have arrived.
		await delay(500);

		expect(onError).not.toHaveBeenCalled();
	});
});

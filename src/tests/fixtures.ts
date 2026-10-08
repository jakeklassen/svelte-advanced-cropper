/** A generated test photo: a gradient with a marker, so crops have visible content. */
export function createTestImage(width = 800, height = 600): string {
	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	const context = canvas.getContext('2d');
	if (!context) {
		throw new Error('2d context unavailable');
	}

	const gradient = context.createLinearGradient(0, 0, width, height);
	gradient.addColorStop(0, '#1aa7f9');
	gradient.addColorStop(1, '#f97a1a');
	context.fillStyle = gradient;
	context.fillRect(0, 0, width, height);
	context.fillStyle = '#ffffff';
	context.fillRect(width / 2 - 20, height / 2 - 20, 40, 40);

	return canvas.toDataURL('image/png');
}

export async function waitFor<T>(
	check: () => T | null | undefined | false,
	{ timeout = 3000, interval = 16 } = {}
): Promise<T> {
	const start = performance.now();
	for (;;) {
		const result = check();
		if (result) {
			return result;
		}

		if (performance.now() - start > timeout) {
			throw new Error('waitFor timed out');
		}

		await new Promise((resolve) => setTimeout(resolve, interval));
	}
}

export function nextFrame() {
	return new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)));
}

import { describe, expect, it } from 'vitest';
import { mountCropper } from './fixtures';
import orientedPhoto from './images/exif-orientation-6-quadrants.jpg?url';

// The fixture (from hello-magnets) stores four solid quadrants as a 240×180 landscape
// image, with EXIF Orientation 6: "rotate 90° clockwise to display". Shown correctly it is
// 180×240 portrait. The stored pixels are deliberately not pre-rotated, so an orientation
// that is ignored, or applied twice, puts the colours in the wrong corners.
const ORIENTED_SIZE = { width: 180, height: 240 };

const COLOURS = {
	red: [0xd0, 0x20, 0x20],
	green: [0x20, 0xa0, 0x20],
	blue: [0x20, 0x40, 0xd0],
	yellow: [0xe0, 0xc0, 0x20]
} as const;

type Colour = keyof typeof COLOURS;

// Where each colour must appear once oriented, as fractions of the crop.
const EXPECTED_CORNERS: [x: number, y: number, colour: Colour][] = [
	[0.25, 0.25, 'red'],
	[0.75, 0.25, 'green'],
	[0.75, 0.75, 'blue'],
	[0.25, 0.75, 'yellow']
];

// Nearest reference colour: JPEG compression shifts channels by a few units, but the
// references are far apart.
function nearestColour([red, green, blue]: Uint8ClampedArray): Colour {
	let nearest: Colour = 'red';
	let nearestDistance = Infinity;
	for (const [name, [r, g, b]] of Object.entries(COLOURS) as [Colour, readonly number[]][]) {
		const distance = (red - r) ** 2 + (green - g) ** 2 + (blue - b) ** 2;
		if (distance < nearestDistance) {
			nearest = name;
			nearestDistance = distance;
		}
	}

	return nearest;
}

describe('EXIF orientation', () => {
	it.each([
		['the cropper reads it (checkOrientation, the default)', true],
		['the browser applies it (checkOrientation={false})', false]
	])('shows and exports the photo upright when %s', async (_name, checkOrientation) => {
		const { cropper } = await mountCropper({ src: orientedPhoto, checkOrientation });

		// Crop the whole photo, so the export is the oriented image itself.
		cropper().setCoordinates(
			{ left: 0, top: 0, width: Infinity, height: Infinity },
			{ transitions: false }
		);
		const canvas = cropper().getCanvas();
		if (!canvas) {
			throw new Error('getCanvas() returned null');
		}

		expect({ width: canvas.width, height: canvas.height }).toEqual(ORIENTED_SIZE);

		const context = canvas.getContext('2d');
		if (!context) {
			throw new Error('no 2d context');
		}

		const corners = EXPECTED_CORNERS.map(([x, y]) =>
			nearestColour(
				context.getImageData(Math.round(canvas.width * x), Math.round(canvas.height * y), 1, 1).data
			)
		);
		expect(corners).toEqual(EXPECTED_CORNERS.map(([, , colour]) => colour));
	});
});

// Major brands that mark a HEIF container holding a HEIC photo, as iPhones save them.
const HEIC_BRANDS = new Set([
	'heic',
	'heix',
	'hevc',
	'hevx',
	'heim',
	'heis',
	'hevm',
	'hevs',
	'mif1'
]);

/**
 * Whether a file is HEIC, judged by its first 12 bytes: an `ftyp` box with a HEIC brand.
 * Picked files can arrive without a name or MIME type, so neither is trusted.
 */
async function isHeic(file: Blob): Promise<boolean> {
	const header = new Uint8Array(await file.slice(0, 12).arrayBuffer());
	const boxType = String.fromCharCode(...header.subarray(4, 8));
	const brand = String.fromCharCode(...header.subarray(8, 12));

	return boxType === 'ftyp' && HEIC_BRANDS.has(brand);
}

/** Whether this browser decodes the image itself. Safari decodes HEIC; Chrome and Firefox don't. */
async function canDecode(file: Blob): Promise<boolean> {
	try {
		const bitmap = await createImageBitmap(file);
		bitmap.close();

		return true;
	} catch {
		return false;
	}
}

/**
 * Returns an object URL the cropper can load for a picked photo. A HEIC photo the browser
 * can't decode is converted to JPEG first, with heic-to, which is only downloaded then.
 * Rejects when the conversion fails. Revoke the URL once the photo is replaced.
 */
export async function croppablePhotoUrl(file: File): Promise<string> {
	if ((await isHeic(file)) && !(await canDecode(file))) {
		const { heicTo } = await import('heic-to');
		const jpeg = await heicTo({ blob: file, type: 'image/jpeg', quality: 0.92 });

		return URL.createObjectURL(jpeg);
	}

	return URL.createObjectURL(file);
}

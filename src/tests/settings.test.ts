import { describe, expect, it } from 'vitest';
import { normalizeSettings } from '#lib/controllers/settings.ts';
import { createState, getAspectRatio, ImageRestriction } from 'advanced-cropper';
import { BoundingBoxType } from 'advanced-cropper/extensions/fit-to-image';

const image = {
	src: '/test.png',
	width: 800,
	height: 600,
	transforms: { rotate: 0, flip: { horizontal: false, vertical: false } }
};

describe('settings precedence', () => {
	it('preserves extension values and flat settings through normalization', () => {
		const settings = normalizeSettings({ settings: { dpi: 300 }, minWidth: 100 }, {});
		expect(settings.dpi).toBe(300);
		expect(settings.minWidth).toBe(100);
		expect(settings.imageRestriction).toBe(ImageRestriction.fitArea);
		expect(settings.transformImage?.adjustStencil).toBe(true);
	});
	it('lets explicit cropper ratios override stencil suggestions', () => {
		const settings = normalizeSettings({ aspectRatio: 2 }, { aspectRatio: 1 });
		const state = createState({ boundary: { width: 500, height: 400 }, image }, settings);
		expect(getAspectRatio(state, settings)).toEqual({ minimum: 2, maximum: 2 });
	});
	it('passes unnormalized options to the custom strategy and gives it final authority', () => {
		const settings = normalizeSettings(
			{
				aspectRatio: 2,
				stencilConstraints: (raw, options) => {
					expect(raw.aspectRatio).toBe(2);
					expect(options.boundingBox).toBe(BoundingBoxType.Circle);

					return { aspectRatio: 3 };
				}
			},
			{ aspectRatio: 1, boundingBox: BoundingBoxType.Circle }
		);
		const state = createState({ boundary: { width: 500, height: 400 }, image }, settings);
		expect(getAspectRatio(state, settings)).toEqual({ minimum: 3, maximum: 3 });
	});
});

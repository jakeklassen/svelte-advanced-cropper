import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import { CircleStencil, Cropper, CropperPreview, FixedCropper } from '#lib';

// The docs site prerenders every page, so croppers must render on the server without
// touching browser APIs.
describe('server rendering', () => {
	it('renders Cropper', () => {
		const { body } = render(Cropper, { props: { src: '/photo.jpg' } });
		expect(body).toContain('advanced-cropper');
		expect(body).toContain('advanced-cropper-boundary');
	});

	it('renders FixedCropper with a circle stencil', () => {
		const { body } = render(FixedCropper, {
			props: {
				src: '/photo.jpg',
				stencilSize: { width: 100, height: 100 },
				stencilComponent: CircleStencil
			}
		});
		expect(body).toContain('advanced-cropper');
	});

	it('renders CropperPreview', () => {
		const { body } = render(CropperPreview, { props: {} });
		expect(body).toContain('advanced-cropper-preview');
	});
});

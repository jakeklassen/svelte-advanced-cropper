import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import { Cropper, CropperPreview, FixedCropper } from '#lib';
import Harness from './Harness.svelte';
import StencilHarness from './StencilHarness.svelte';
import CustomStencil from './CustomStencil.svelte';

// The docs site prerenders every page, so croppers must render on the server without
// touching browser APIs.
describe('server rendering', () => {
	it('renders Cropper', () => {
		const { body } = render(Cropper, { props: { src: '/photo.jpg' } });
		expect(body).toContain('advanced-cropper');
		expect(body).toContain('advanced-cropper-boundary');
	});

	it('renders FixedCropper with a circle stencil', () => {
		const { body } = render(Harness, {
			props: {
				src: '/photo.jpg',
				stencilSize: { width: 100, height: 100 },
				component: FixedCropper,
				circle: true
			}
		});
		expect(body).toContain('advanced-cropper');
	});

	it('renders CropperPreview', () => {
		const { body } = render(CropperPreview, { props: {} });
		expect(body).toContain('advanced-cropper-preview');
	});
});

it('rejects duplicate stencils on the server', () => {
	expect(() => render(StencilHarness, { props: { mode: 'duplicate' } }).body).toThrow(
		'at most one registered stencil'
	);
});
it('reports missing context clearly', () => {
	expect(() => render(CustomStencil).body).toThrow('inside a Cropper or FixedCropper');
});
it('renders a nested child stencil without browser work', () => {
	const { body } = render(StencilHarness, { props: { mode: 'nested', src: '/photo.jpg' } });
	expect(body.match(/class="advanced-cropper advanced-cropper-wrapper"/g)).toHaveLength(2);
});

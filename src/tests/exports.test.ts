import { expect, it } from 'vitest';
import * as library from 'svelte-advanced-cropper';
import * as core from 'advanced-cropper';

it('exports the Svelte API without legacy names or internal implementations', () => {
	const forbidden = /(^use[A-Z]|Ref$|Component$|ClassNames?$)/;
	// The installed core has no runtime exports requiring an exception.
	const coreExceptions: string[] = [];
	expect(Object.keys(core).filter((name) => forbidden.test(name))).toEqual(coreExceptions);
	expect(
		Object.keys(library).filter((name) => forbidden.test(name) && !coreExceptions.includes(name))
	).toEqual([]);
	for (const name of [
		'AbstractCropper',
		'CropperCanvas',
		'ArtificialTransition',
		'CropperController',
		'ReactiveCropperEngine',
		'ImageLoader',
		'StencilRegistry',
		'DraggableElement'
	]) {
		expect(Object.keys(library)).not.toContain(name);
	}

	expect(library.DraggableArea).toBeTypeOf('function');
	for (const normalize of [
		library.normalizeMoveImageOptions,
		library.normalizeScaleImageOptions,
		library.normalizeRotateImageOptions
	]) {
		expect(normalize).toBeTypeOf('function');
	}
});

it('normalizes gesture inputs as plain functions', () => {
	expect(library.normalizeMoveImageOptions(true)).toEqual({ touch: true, mouse: true });
	expect(library.normalizeMoveImageOptions(false)).toEqual({ touch: false, mouse: false });
	expect(library.normalizeMoveImageOptions({ mouse: false })).toEqual({
		touch: true,
		mouse: false
	});
	expect(library.normalizeRotateImageOptions({})).toEqual({ touch: true });
	expect(library.normalizeRotateImageOptions(false)).toEqual({ touch: false });
	expect(library.normalizeScaleImageOptions(true)).toEqual({ touch: true, wheel: { ratio: 0.1 } });
	expect(library.normalizeScaleImageOptions(false)).toEqual({ touch: false, wheel: false });
	expect(library.normalizeScaleImageOptions({ wheel: {} })).toEqual({
		touch: true,
		wheel: { ratio: 0.1 }
	});
	expect(library.normalizeScaleImageOptions({ touch: false, wheel: { ratio: 0.2 } })).toEqual({
		touch: false,
		wheel: { ratio: 0.2 }
	});
});

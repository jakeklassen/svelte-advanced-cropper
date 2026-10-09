import { describe, expect, it } from 'vitest';
import { RegistrationSlot } from '#lib/controllers/RegistrationSlot.svelte.ts';
import { StencilRegistry } from '#lib/controllers/StencilRegistry.svelte.ts';

describe('registration ownership', () => {
	it('does not let old cleanup clear a replacement slot', () => {
		const slot = new RegistrationSlot<string>();
		const releaseOld = slot.register('old');
		const releaseNew = slot.register('new');
		releaseOld();
		releaseOld();
		expect(slot.value).toBe('new');
		releaseNew();
		expect(slot.value).toBeNull();
	});
	it('commits replacements and releases stencil tokens idempotently', () => {
		const registry = new StencilRegistry();
		const releaseOld = registry.register(() => ({ aspectRatio: 1 }));
		registry.commit();
		const releaseNew = registry.register(() => ({ aspectRatio: 2 }));
		releaseOld();
		registry.commit();
		releaseOld();
		expect(registry.readOptions().aspectRatio).toBe(2);
		releaseNew();
		registry.commit();
		expect(registry.readOptions()).toEqual({});
	});
});

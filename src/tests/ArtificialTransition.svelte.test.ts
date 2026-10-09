import { expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import ArtificialTransition from '../lib/components/internal/ArtificialTransition.svelte';
import { getElement, nextFrame, waitFor } from './fixtures';

it('renders initial geometry and updates it without animation when transitions are inactive', async () => {
	const screen = await render(ArtificialTransition, { width: 100, height: 80, left: 10, top: 20 });
	const element = getElement(
		screen.container,
		'.advanced-cropper-artificial-transition',
		HTMLDivElement
	);
	expect(element.style.width).toBe('100px');
	expect(element.style.transform).toBe('translate3d(10px, 20px, 0px)');
	await screen.rerender({ width: 200, height: 120, left: 30, top: 40 });
	expect(element.style.width).toBe('200px');
	expect(element.style.height).toBe('120px');
	expect(element.style.transform).toBe('translate3d(30px, 40px, 0px)');
});

it('continues an interrupted animation from its displayed geometry', async () => {
	const screen = await render(ArtificialTransition, {
		width: 100,
		height: 80,
		left: 0,
		top: 0,
		transitions: { active: true, duration: 300, timingFunction: 'linear' }
	});
	const element = getElement(
		screen.container,
		'.advanced-cropper-artificial-transition',
		HTMLDivElement
	);
	await screen.rerender({ width: 200 });
	await waitFor(() => parseFloat(element.style.width) > 100);
	const interrupted = parseFloat(element.style.width);
	expect(interrupted).toBeLessThan(200);
	await screen.rerender({ width: 50 });
	expect(parseFloat(element.style.width)).toBeLessThanOrEqual(interrupted);
	await waitFor(() => element.style.width === '50px');
	expect(element.style.width).toBe('50px');
});

it('cancels animation frames when its element is destroyed', async () => {
	const screen = await render(ArtificialTransition, {
		width: 100,
		height: 80,
		left: 0,
		top: 0,
		transitions: { active: true, duration: 1000, timingFunction: 'linear' }
	});
	const element = getElement(
		screen.container,
		'.advanced-cropper-artificial-transition',
		HTMLDivElement
	);
	await screen.rerender({ width: 200 });
	const cancel = vi.spyOn(window, 'cancelAnimationFrame');
	await screen.unmount();
	expect(cancel).toHaveBeenCalled();
	const width = element.style.width;
	await nextFrame();
	await nextFrame();
	expect(element.style.width).toBe(width);
	cancel.mockRestore();
});

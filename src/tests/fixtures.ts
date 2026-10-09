import { vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Harness from './Harness.svelte';
import type { CropperInstance } from '#lib';

export interface Point {
	x: number;
	y: number;
}

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

export function delay(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export function nextFrame(): Promise<void> {
	return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

/** Polls `check` until it returns a truthy value, and returns that value. */
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

		await delay(interval);
	}
}

/**
 * The first element in `container` matching `selector`. Throws when there is none, or when it is
 * not an instance of `type` (e.g. `HTMLElement`, for its `style`).
 */
export function getElement<T extends Element = Element>(
	container: ParentNode,
	selector: string,
	type?: abstract new () => T
): T {
	const element = container.querySelector(selector);
	if (!element) {
		throw new Error(`No element matches "${selector}"`);
	}

	if (type && !(element instanceof type)) {
		throw new Error(`"${selector}" matches a ${element.constructor.name}, not a ${type.name}`);
	}

	return element as T;
}

interface MountOptions {
	/** Whether the cropper animates changes. Off makes state changes immediate. */
	transitions?: boolean;
	/** Called on top of the internal spy that `mountCropper` waits on. */
	onReady?: (cropper: CropperInstance) => void;
	/** Any other Cropper prop, or `component` to mount another cropper. */
	[prop: string]: unknown;
}

/** Renders a cropper with a generated 800×600 photo and waits until it is ready. */
export async function mountCropper({ onReady: userOnReady, ...props }: MountOptions = {}) {
	const onReady = vi.fn<(cropper: CropperInstance) => void>(userOnReady);
	const screen = await render(Harness, { src: createTestImage(), onReady, ...props });
	const cropper = (): CropperInstance => {
		const ref = screen.component.getCropper();
		if (!ref) {
			throw new Error('The cropper is not mounted');
		}

		return ref;
	};

	await waitFor(() => onReady.mock.calls.length > 0);

	return { screen, cropper, onReady, container: screen.container };
}

/** The center of an element, in client coordinates. */
export function centerOf(element: Element): Point {
	const box = element.getBoundingClientRect();

	return { x: box.left + box.width / 2, y: box.top + box.height / 2 };
}

function dispatchMouse(target: EventTarget, type: string, { x, y }: Point) {
	target.dispatchEvent(
		new MouseEvent(type, {
			bubbles: true,
			cancelable: true,
			clientX: x,
			clientY: y,
			button: 0,
			buttons: 1
		})
	);
}

/**
 * Drags with the left mouse button: presses on `target` at `from`, moves by `delta` and releases.
 * As in a browser, the move and release go to the window.
 */
export function drag(target: Element, from: Point, delta: Point) {
	const to = { x: from.x + delta.x, y: from.y + delta.y };
	dispatchMouse(target, 'mousedown', from);
	dispatchMouse(window, 'mousemove', to);
	dispatchMouse(window, 'mouseup', to);
}

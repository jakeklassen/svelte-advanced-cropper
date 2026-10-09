import { afterEach, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { flushSync } from 'svelte';
import CodeBlock from '../site/components/CodeBlock.svelte';

const code = '<img src=x onerror="alert(1)">\n\nsecond line';
const highlighted = {
	style: '--shiki-light:#000;--shiki-dark:#fff',
	lines: [[{ content: code, offset: 0, style: '--shiki-light:#000;--shiki-dark:#fff' }]]
};

afterEach(() => {
	vi.restoreAllMocks();
	vi.useRealTimers();
});

it('renders source as escaped text and retains a keyboard-focusable code region', async () => {
	const screen = await render(CodeBlock, { code, highlighted });
	const pre = screen.container.querySelector('pre');
	expect(pre?.textContent).toBe(code);
	expect(pre?.getAttribute('tabindex')).toBe('0');
	expect(screen.container.querySelector('img')).toBeNull();
});

it('clears the copy-label timer when unmounted', async () => {
	const write = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
	const screen = await render(CodeBlock, { code, highlighted });
	vi.useFakeTimers();
	const schedule = vi.spyOn(window, 'setTimeout');
	const cancel = vi.spyOn(window, 'clearTimeout');
	screen.container.querySelector('button')?.click();
	await Promise.resolve();
	flushSync();
	expect(write).toHaveBeenCalledWith(code);
	expect(screen.container.querySelector('button')?.textContent).toBe('Copied');
	const index = schedule.mock.calls.findIndex(([, delay]) => delay === 1500);
	const timer = schedule.mock.results[index];
	expect(timer?.type).toBe('return');
	await screen.unmount();
	expect(cancel).toHaveBeenCalledWith(timer?.value);
});

it('does not schedule a timer when clipboard access resolves after unmount', async () => {
	const pending = Promise.withResolvers<void>();
	vi.spyOn(navigator.clipboard, 'writeText').mockReturnValue(pending.promise);
	const screen = await render(CodeBlock, { code, highlighted });
	vi.useFakeTimers();
	const schedule = vi.spyOn(window, 'setTimeout');
	screen.container.querySelector('button')?.click();
	await screen.unmount();
	pending.resolve();
	await Promise.resolve();
	expect(schedule).not.toHaveBeenCalledWith(expect.any(Function), 1500);
});

import { expect, it } from 'vitest';
import { highlightTokens } from './highlight.ts';

it('preserves text, blank lines and theme styles in highlighted tokens', () => {
	const code = '<script>\n\nconst markup = "<img onerror=alert(1)>";\n</script>';
	const result = highlightTokens(code, 'svelte');
	expect(
		result.lines
			.flat()
			.map((token) => token.content)
			.join('')
	).toBe(code);
	expect(result.lines).toHaveLength(4);
	expect(result.style).toContain('--shiki-dark-bg:');
	expect(result.lines.flat().some((token) => token.style.includes('--shiki-light:'))).toBe(true);
});

it('rejects unsupported highlighting languages', () => {
	expect(() => highlightTokens('text', 'not-a-language')).toThrow('No syntax highlighting');
});

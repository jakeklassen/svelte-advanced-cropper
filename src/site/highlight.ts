import { createHighlighter } from 'shiki';
import type { HighlightedCode } from './highlight-types.ts';

// Both themes are emitted as CSS variables (--shiki-light / --shiki-dark); site.css picks
// one from the page's data-theme.
const themes = { light: 'github-light', dark: 'github-dark' } as const;
const languages = [
	'svelte',
	'ts',
	'js',
	'tsx',
	'jsx',
	'html',
	'css',
	'scss',
	'shell',
	'json'
] as const;

const shiki = await createHighlighter({
	themes: Object.values(themes),
	langs: [...languages]
});

function escapeSvelte(html: string) {
	return html.replace(/[{}`\\]/g, (char) => `&#${char.charCodeAt(0)};`);
}

/**
 * Highlights a code string to HTML. A language that isn't loaded above fails the build
 * rather than silently rendering as plain text; use `text` for deliberately plain blocks.
 */
export function highlight(code: string, lang: string): string {
	if (lang !== 'text' && !shiki.getLoadedLanguages().includes(lang)) {
		throw new Error(`No syntax highlighting for "${lang}": add it to the langs in highlight.ts`);
	}

	return shiki.codeToHtml(code.trimEnd(), { lang, themes, defaultColor: false });
}

/** Token text is escaped by Svelte; only build-generated theme styles become attributes. */
export function highlightTokens(code: string, lang: string): HighlightedCode {
	const language = lang === 'text' ? 'text' : languages.find((name) => name === lang);
	if (!language) {
		throw new Error(`No syntax highlighting for "${lang}": add it to the langs in highlight.ts`);
	}

	const result = shiki.codeToTokens(code.trimEnd(), {
		lang: language,
		themes,
		defaultColor: false
	});

	return {
		style: result.rootStyle || '',
		lines: result.tokens.map((line, lineIndex) => {
			const tokens = line.map((token) => ({
				content: token.content,
				offset: token.offset,
				style: Object.entries(token.htmlStyle ?? {})
					.map(([name, value]) => `${name}:${value}`)
					.join(';')
			}));
			if (lineIndex < result.tokens.length - 1) {
				tokens.push({ content: '\n', offset: -1, style: '' });
			}

			return tokens;
		})
	};
}

/** mdsvex highlighter: output is inserted into Svelte markup, so braces must be escaped. */
export function highlighter(code: string, lang: string | null | undefined) {
	return `{@html \`${escapeSvelte(highlight(code, lang ?? 'text'))}\`}`;
}

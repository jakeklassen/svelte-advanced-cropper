import { createHighlighter } from 'shiki';

// Both themes are emitted as CSS variables (--shiki-light / --shiki-dark); site.css picks
// one from the page's data-theme.
const themes = { light: 'github-light', dark: 'github-dark' } as const;

const shiki = await createHighlighter({
	themes: Object.values(themes),
	langs: ['svelte', 'ts', 'js', 'tsx', 'jsx', 'html', 'css', 'scss', 'shell', 'json']
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

/** mdsvex highlighter: output is inserted into Svelte markup, so braces must be escaped. */
export function highlighter(code: string, lang: string | null | undefined) {
	return `{@html \`${escapeSvelte(highlight(code, lang ?? 'text'))}\`}`;
}

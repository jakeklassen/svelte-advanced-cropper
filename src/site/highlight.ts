import { createHighlighter } from 'shiki';

// Both themes are emitted as CSS variables (--shiki-light / --shiki-dark); site.css picks
// one from the page's data-theme.
const themes = { light: 'github-light', dark: 'github-dark' } as const;

const shiki = await createHighlighter({
	themes: Object.values(themes),
	langs: ['svelte', 'ts', 'js', 'html', 'css', 'scss', 'shell', 'json']
});

function escapeSvelte(html: string) {
	return html.replace(/[{}`\\]/g, (char) => `&#${char.charCodeAt(0)};`);
}

/** Highlights a code string to HTML. */
export function highlight(code: string, lang: string): string {
	const language = shiki.getLoadedLanguages().includes(lang) ? lang : 'text';

	return shiki.codeToHtml(code.trimEnd(), { lang: language, themes, defaultColor: false });
}

/** mdsvex highlighter: output is inserted into Svelte markup, so braces must be escaped. */
export function highlighter(code: string, lang: string | null | undefined) {
	return `{@html \`${escapeSvelte(highlight(code, lang ?? 'text'))}\`}`;
}

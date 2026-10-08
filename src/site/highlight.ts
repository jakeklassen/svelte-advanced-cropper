import { createHighlighter } from 'shiki';

const theme = 'github-light';

const shiki = await createHighlighter({
	themes: [theme],
	langs: ['svelte', 'ts', 'js', 'html', 'css', 'scss', 'shell', 'json']
});

function escapeSvelte(html: string) {
	return html.replace(/[{}`\\]/g, (char) => `&#${char.charCodeAt(0)};`);
}

/** Highlights a code string to HTML. */
export function highlight(code: string, lang: string): string {
	const language = shiki.getLoadedLanguages().includes(lang) ? lang : 'text';

	return shiki.codeToHtml(code.trimEnd(), { lang: language, theme });
}

/** mdsvex highlighter: output is inserted into Svelte markup, so braces must be escaped. */
export function highlighter(code: string, lang: string | null | undefined) {
	return `{@html \`${escapeSvelte(highlight(code, lang ?? 'text'))}\`}`;
}

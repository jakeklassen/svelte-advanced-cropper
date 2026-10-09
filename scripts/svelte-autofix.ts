import { readFile, readdir } from 'node:fs/promises';
import { basename, join, relative, resolve } from 'node:path';
import { svelteAutofixer } from '@sveltejs/mcp';
import { preprocess } from 'svelte/compiler';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

export interface ReviewedSuggestion {
	suggestion: string;
	reason: string;
}

export type Allowlist = Record<string, ReviewedSuggestion[]>;

export function parseAllowlist(value: unknown): Allowlist {
	if (!value || typeof value !== 'object' || Array.isArray(value)) {
		throw new Error('The Svelte suggestion allowlist must map files to reviewed suggestions.');
	}

	const result: Allowlist = {};
	for (const [file, entries] of Object.entries(value)) {
		if (!/^src\/.*\.svelte(?:\.[jt]s)?$/.test(file) || file.split('/').includes('..')) {
			throw new Error(`Invalid allowlist path: ${file}`);
		}

		if (!Array.isArray(entries)) {
			throw new Error(`Expected an array of reviewed suggestions for ${file}`);
		}

		result[file] = entries.map((entry: unknown) => {
			if (
				!entry ||
				typeof entry !== 'object' ||
				!('suggestion' in entry) ||
				typeof entry.suggestion !== 'string' ||
				!entry.suggestion.trim() ||
				!('reason' in entry) ||
				typeof entry.reason !== 'string' ||
				!entry.reason.trim()
			) {
				throw new Error(`Each suggestion in ${file} needs exact text and a reason.`);
			}

			return { suggestion: entry.suggestion, reason: entry.reason };
		});
	}

	return result;
}

export async function svelteFiles(directory: string): Promise<string[]> {
	const files: string[] = [];
	for (const entry of await readdir(directory, { withFileTypes: true })) {
		const path = join(directory, entry.name);
		if (entry.isDirectory()) {
			files.push(...(await svelteFiles(path)));
		} else if (/\.svelte(?:\.[jt]s)?$/.test(entry.name)) {
			files.push(path);
		}
	}

	return files.toSorted();
}

export async function analyze(file: string, code: string) {
	// Match the site's style preprocessing. Keep TypeScript and runes intact for analysis.
	// The autofixer otherwise reports valid SCSS as a Svelte CSS parser error.
	const input =
		file.endsWith('.svelte') && /<style\b[^>]*\blang=['"](?:scss|sass|less|stylus)['"]/.test(code)
			? (await preprocess(code, vitePreprocess({ script: false }), { filename: resolve(file) }))
					.code
			: code;

	return svelteAutofixer({ code: input, filename: basename(file), desired_svelte_version: 5 });
}

export function unreviewed(suggestions: string[], reviewed: ReviewedSuggestion[]) {
	return suggestions.filter(
		(suggestion) => !reviewed.some((entry) => entry.suggestion === suggestion)
	);
}

export async function runGate(root: string, report: (message: string) => void = console.log) {
	const raw: unknown = JSON.parse(
		await readFile(join(root, 'scripts/svelte-autofix-allow.json'), 'utf8')
	);
	const allowlist = parseAllowlist(raw);
	const files = await svelteFiles(join(root, 'src'));
	let issues = 0;
	let suggestions = 0;
	let pending = 0;
	// The API is in-process; sequential analysis bounds memory and keeps output deterministic.
	for (const file of files) {
		const name = relative(root, file).split('\\').join('/');
		const result = await analyze(file, await readFile(file, 'utf8'));
		const reviewed = allowlist[name] ?? [];
		const unknown = unreviewed(result.suggestions, reviewed);
		issues += result.issues.length;
		suggestions += result.suggestions.length;
		pending += unknown.length;
		if (result.issues.length || result.suggestions.length) {
			report(`\n${name}`);
			for (const issue of result.issues) {
				report(`  ISSUE: ${issue}`);
			}

			for (const suggestion of result.suggestions) {
				const entry = reviewed.find((item) => item.suggestion === suggestion);
				report(`  ${entry ? 'REVIEWED' : 'UNREVIEWED'}: ${suggestion}`);
				if (entry) {
					report(`    Reason: ${entry.reason}`);
				}
			}
		}
	}

	report(
		`\n${files.length} files: ${issues} issues, ${suggestions} suggestions, ${pending} unreviewed.`
	);

	return { files: files.length, issues, suggestions, pending };
}

if (import.meta.main) {
	const { issues, pending } = await runGate(resolve(import.meta.dirname, '..'));
	if (issues || pending) {
		process.exitCode = 1;
	}
}

import { readFile, readdir } from 'node:fs/promises';
import { basename, join, relative, resolve } from 'node:path';
import { svelteAutofixer } from '@sveltejs/mcp';
import { preprocess } from 'svelte/compiler';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

export interface ReviewedSuggestion {
	suggestion: string;
	reason: string;
	count: number;
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

		const seen = new Set<string>();
		result[file] = entries.map((entry: unknown) => {
			if (
				!entry ||
				typeof entry !== 'object' ||
				!('suggestion' in entry) ||
				typeof entry.suggestion !== 'string' ||
				!entry.suggestion.trim() ||
				!('reason' in entry) ||
				typeof entry.reason !== 'string' ||
				!entry.reason.trim() ||
				!('count' in entry) ||
				typeof entry.count !== 'number' ||
				!Number.isSafeInteger(entry.count) ||
				entry.count < 1
			) {
				throw new Error(
					`Each suggestion in ${file} needs exact text, a reason and a positive count.`
				);
			}

			if (seen.has(entry.suggestion)) {
				throw new Error(`Duplicate reviewed suggestion in ${file}: ${entry.suggestion}`);
			}

			seen.add(entry.suggestion);

			return { suggestion: entry.suggestion, reason: entry.reason, count: entry.count };
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

export function reviewSuggestions(suggestions: string[], reviewed: ReviewedSuggestion[]) {
	// Most autofixer suggestions have no location. Consume exact occurrence budgets
	// per file and text so an existing review cannot approve another occurrence.
	const remaining = new Map(reviewed.map((entry) => [entry.suggestion, entry.count]));
	const occurrences = suggestions.map((suggestion) => {
		const count = remaining.get(suggestion) ?? 0;
		const entry = count > 0 ? reviewed.find((item) => item.suggestion === suggestion) : undefined;
		if (entry) {
			remaining.set(suggestion, count - 1);
		}

		return { suggestion, entry };
	});
	const stale = reviewed.filter((entry) => (remaining.get(entry.suggestion) ?? 0) > 0);

	return { occurrences, stale };
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
	let stale = 0;
	const unseen = new Set(Object.keys(allowlist));
	// The API is in-process; sequential analysis bounds memory and keeps output deterministic.
	for (const file of files) {
		const name = relative(root, file).split('\\').join('/');
		const result = await analyze(file, await readFile(file, 'utf8'));
		const reviewed = allowlist[name] ?? [];
		unseen.delete(name);
		const review = reviewSuggestions(result.suggestions, reviewed);
		issues += result.issues.length;
		suggestions += result.suggestions.length;
		pending += review.occurrences.filter((item) => !item.entry).length;
		stale += review.stale.length;
		if (result.issues.length || result.suggestions.length || review.stale.length) {
			report(`\n${name}`);
			for (const issue of result.issues) {
				report(`  ISSUE: ${issue}`);
			}

			for (const { suggestion, entry } of review.occurrences) {
				report(`  ${entry ? 'REVIEWED' : 'UNREVIEWED'}: ${suggestion}`);
				if (entry) {
					report(`    Reason: ${entry.reason}`);
				}
			}

			for (const entry of review.stale) {
				report(`  STALE: expected ${entry.count} occurrences: ${entry.suggestion}`);
				report(`    Reason: ${entry.reason}`);
			}
		}
	}

	for (const name of unseen) {
		stale += Math.max(1, allowlist[name].length);
		report(`\n${name}: STALE allowlist path (file not found).`);
	}

	report(
		`\n${files.length} files: ${issues} issues, ${suggestions} suggestions, ${pending} unreviewed, ${stale} stale reviews.`
	);

	return { files: files.length, issues, suggestions, pending, stale };
}

if (import.meta.main) {
	const { issues, pending, stale } = await runGate(resolve(import.meta.dirname, '..'));
	if (issues || pending || stale) {
		process.exitCode = 1;
	}
}

import { afterEach, expect, it } from 'vitest';
import { mkdir, mkdtemp, rm, writeFile, readFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import {
	analyze,
	parseAllowlist,
	runGate,
	reviewSuggestions
} from '../../scripts/svelte-autofix.ts';

const scratch: string[] = [];

afterEach(async () => {
	for (const directory of scratch.splice(0)) {
		await rm(directory, { recursive: true, force: true });
	}
});

it('requires file paths, exact suggestion text, and a nonempty review reason', () => {
	expect(() => parseAllowlist([])).toThrow('must map files');
	expect(() => parseAllowlist({ '../outside.svelte': [] })).toThrow('Invalid allowlist path');
	expect(() => parseAllowlist({ 'src/Test.svelte': [{ suggestion: 'text', reason: '' }] })).toThrow(
		'exact text, a reason and a positive count'
	);
	expect(
		parseAllowlist({ 'src/Test.svelte': [{ suggestion: 'text', reason: 'Reviewed', count: 1 }] })
	).toEqual({
		'src/Test.svelte': [{ suggestion: 'text', reason: 'Reviewed', count: 1 }]
	});
});

it('matches whole suggestion texts without treating reviews as patterns', () => {
	expect(
		reviewSuggestions(
			['known', 'known at a new location', 'unknown'],
			[
				{ suggestion: 'known', reason: 'Reviewed', count: 1 },
				{ suggestion: '*', reason: 'Not a wildcard', count: 1 }
			]
		)
	).toMatchObject({
		occurrences: [
			{ suggestion: 'known', entry: { reason: 'Reviewed' } },
			{ suggestion: 'known at a new location', entry: undefined },
			{ suggestion: 'unknown', entry: undefined }
		],
		stale: [{ suggestion: '*' }]
	});
});

it('preprocesses SCSS before analysis without suppressing Svelte issues', async () => {
	const result = await analyze(
		'tmp/Theme.svelte',
		'<div class="theme"></div><style lang="scss">$color: red; .theme { color: $color; }</style>'
	);
	expect(result.issues).toEqual([]);
	expect(result.suggestions).toEqual([]);
});

it('discovers all three file extensions, reports by file, and never allowlists issues', async () => {
	await mkdir(resolve('tmp'), { recursive: true });
	const root = await mkdtemp(resolve('tmp/svelte-autofix-test-'));
	scratch.push(root);
	await mkdir(join(root, 'scripts'));
	await mkdir(join(root, 'src/nested'), { recursive: true });
	const code =
		'<script lang="ts">let element: HTMLDivElement | undefined = $state();</script><div bind:this={element}></div>';
	const result = await analyze('Bound.svelte', code);
	expect(result.suggestions.length).toBeGreaterThan(0);
	await writeFile(join(root, 'src/Bound.svelte'), code);
	await writeFile(
		join(root, 'src/nested/state.svelte.ts'),
		'export const value = $state({ count: 0 });'
	);
	await writeFile(
		join(root, 'src/nested/state.svelte.js'),
		'export const value = $state({ count: 0 });'
	);
	await writeFile(join(root, 'src/ignored.ts'), 'invalid code');
	await writeFile(join(root, 'scripts/svelte-autofix-allow.json'), '{}');
	const output: string[] = [];
	const first = await runGate(root, (line) => output.push(line));
	expect(first).toMatchObject({ files: 3, issues: 0, pending: result.suggestions.length });
	expect(output.join('\n')).toContain('src/Bound.svelte\n  UNREVIEWED:');
	const reviews = {
		'src/Bound.svelte': result.suggestions.map((suggestion) => ({
			suggestion,
			reason: 'Test review',
			count: 1
		}))
	};
	await writeFile(join(root, 'scripts/svelte-autofix-allow.json'), JSON.stringify(reviews));
	expect(await runGate(root, () => {})).toMatchObject({ files: 3, issues: 0, pending: 0 });
	await writeFile(join(root, 'src/Broken.svelte'), '<script>const = ;</script>');
	const broken = await runGate(root, () => {});
	expect(broken.files).toBe(4);
	expect(broken.issues).toBeGreaterThan(0);
});

it('rejects invalid occurrence counts and duplicate approvals', () => {
	for (const count of [undefined, 0, -1, 1.5, '1']) {
		expect(() =>
			parseAllowlist({ 'src/Test.svelte': [{ suggestion: 'text', reason: 'Reviewed', count }] })
		).toThrow('positive count');
	}

	const entry = { suggestion: 'text', reason: 'Reviewed', count: 1 };
	expect(() => parseAllowlist({ 'src/Test.svelte': [entry, entry] })).toThrow('Duplicate');
});

it('rejects the R4 feedback loop added beside an approved animation effect and stale reviews', async () => {
	await mkdir(resolve('tmp'), { recursive: true });
	const root = await mkdtemp(resolve('tmp/svelte-autofix-r4-'));
	scratch.push(root);
	await mkdir(join(root, 'scripts'));
	await mkdir(join(root, 'src'));
	const file = 'src/lib/components/internal/ArtificialTransition.svelte';
	const code = await readFile(resolve(file), 'utf8');
	const allowlist = parseAllowlist(
		JSON.parse(await readFile(resolve('scripts/svelte-autofix-allow.json'), 'utf8'))
	);
	const reviews = allowlist[file];
	expect(reviews.length).toBeGreaterThan(0);
	const target = join(root, 'src/ArtificialTransition.svelte');
	await writeFile(target, code);
	await writeFile(
		join(root, 'scripts/svelte-autofix-allow.json'),
		JSON.stringify({ 'src/ArtificialTransition.svelte': reviews })
	);
	expect(await runGate(root, () => {})).toMatchObject({ issues: 0, pending: 0, stale: 0 });
	// Unrelated line shifts must not invalidate the reviewed occurrence counts.
	await writeFile(target, `\n\n${code}`);
	expect(await runGate(root, () => {})).toMatchObject({ issues: 0, pending: 0, stale: 0 });
	const loop = '$effect(() => { width; untrack(() => { width = (width ?? 0) + 1; }); });';
	await writeFile(target, code.replace('const transition =', `${loop}\nconst transition =`));
	const output: string[] = [];
	const regression = await runGate(root, (line) => output.push(line));
	expect(regression.issues).toBe(0);
	expect(regression.pending).toBeGreaterThan(0);
	expect(output.join('\n')).toContain('UNREVIEWED: You are calling the function `untrack`');
	await writeFile(target, '<div></div>');
	expect(await runGate(root, () => {})).toMatchObject({ pending: 0, stale: reviews.length });
	await rm(target);
	expect(await runGate(root, () => {})).toMatchObject({ files: 0, stale: reviews.length });
});

it('rejects reduced occurrence counts even when a suggestion still exists', () => {
	const reviewed = [{ suggestion: 'same', reason: 'Two reviewed calls', count: 2 }];
	expect(reviewSuggestions(['same'], reviewed).stale).toEqual(reviewed);
	expect(reviewSuggestions(['same', 'same'], reviewed).stale).toEqual([]);
	expect(
		reviewSuggestions(['same', 'same', 'same'], reviewed).occurrences.filter((item) => !item.entry)
	).toEqual([{ suggestion: 'same', entry: undefined }]);
});

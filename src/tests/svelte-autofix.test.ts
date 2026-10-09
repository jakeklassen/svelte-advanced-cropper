import { afterEach, expect, it } from 'vitest';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { analyze, parseAllowlist, runGate, unreviewed } from '../../scripts/svelte-autofix.ts';

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
		'exact text and a reason'
	);
	expect(
		parseAllowlist({ 'src/Test.svelte': [{ suggestion: 'text', reason: 'Reviewed' }] })
	).toEqual({
		'src/Test.svelte': [{ suggestion: 'text', reason: 'Reviewed' }]
	});
});

it('matches whole suggestion texts without treating reviews as patterns', () => {
	expect(
		unreviewed(
			['known', 'known at a new location', 'unknown'],
			[
				{ suggestion: 'known', reason: 'Reviewed' },
				{ suggestion: '*', reason: 'Not a wildcard' }
			]
		)
	).toEqual(['known at a new location', 'unknown']);
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
			reason: 'Test review'
		}))
	};
	await writeFile(join(root, 'scripts/svelte-autofix-allow.json'), JSON.stringify(reviews));
	expect(await runGate(root, () => {})).toMatchObject({ files: 3, issues: 0, pending: 0 });
	await writeFile(join(root, 'src/Broken.svelte'), '<script>const = ;</script>');
	const broken = await runGate(root, () => {});
	expect(broken.files).toBe(4);
	expect(broken.issues).toBeGreaterThan(0);
});

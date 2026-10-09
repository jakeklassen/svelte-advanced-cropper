# Agent skills

Skills that coding agents (Codex reads `.agents/skills/`) load when working in this repo.

`svelte-core-bestpractices` and `svelte-code-writer` come from the official Svelte AI tools
(https://github.com/sveltejs/ai-tools, MIT), copied from the Svelte Claude Code plugin 1.0.9.
`svelte-code-writer` is adapted to run the pinned `@sveltejs/mcp` devDependency
(`mise x -- pnpm exec svelte-mcp ...`) instead of `npx`.

Run the autofixer on every `.svelte` and `.svelte.ts` file you create or change, and fix what it
reports before finishing.

<script lang="ts">
	import { Diamond, FishingHook, Replace } from '@lucide/svelte';
	import { href } from '#site/paths.ts';
	import type { HierarchyNode } from './hierarchy.ts';

	interface Props {
		root: HierarchyNode;
		label: string;
	}

	let { root, label }: Props = $props();

	const kinds = {
		hook: { icon: FishingHook, label: 'Hook' },
		component: { icon: Diamond, label: 'Component' },
		replaceable: { icon: Replace, label: 'Replaceable component' }
	} as const;
</script>

{#snippet item(node: HierarchyNode)}
	{@const Icon = kinds[node.kind].icon}
	<li class="hierarchy__item">
		<div class={['hierarchy__node', `hierarchy__node--${node.kind}`]}>
			<span class="hierarchy__label">
				<span class="hierarchy__icon" title={kinds[node.kind].label}>
					<Icon size={16} aria-hidden="true" />
				</span>
				{#if node.to}
					<a class="hierarchy__title" href={href(node.to)}>{node.title}</a>
				{:else}
					<span class="hierarchy__title">{node.title}</span>
				{/if}
			</span>
			{#if node.note}
				<code class="hierarchy__note">{node.note}</code>
			{/if}
		</div>
		{#if node.children?.length}
			<ul class="hierarchy__children">
				{#each node.children as child, index (index)}
					{@render item(child)}
				{/each}
			</ul>
		{/if}
	</li>
{/snippet}

<figure class="hierarchy" aria-label={label}>
	<ul class="hierarchy__root">
		{@render item(root)}
	</ul>
	<figcaption class="hierarchy__legend">
		{#each Object.values(kinds) as kind (kind.label)}
			{@const Icon = kind.icon}
			<span class="hierarchy__legend-item">
				<Icon size={14} aria-hidden="true" />
				{kind.label}
			</span>
		{/each}
	</figcaption>
</figure>

<style>
	.hierarchy {
		margin: 1.5rem 0;
		padding: 1rem 1.25rem;
		border: 1px solid var(--color-border);
		border-radius: 8px;
		overflow-x: auto;
	}

	ul {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.hierarchy__children {
		margin-left: 0.6rem;
		padding-left: 1rem;
		border-left: 1px dashed var(--color-border);
	}

	.hierarchy__item {
		margin: 0.15rem 0;
	}

	.hierarchy__node {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.25rem 0.5rem;
		padding: 0.15rem 0;
	}

	.hierarchy__label {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
	}

	.hierarchy__icon {
		display: inline-flex;
		color: var(--color-muted);
	}

	.hierarchy__node--hook .hierarchy__icon {
		color: #d97706;
	}

	.hierarchy__node--replaceable .hierarchy__icon {
		color: var(--color-primary);
	}

	.hierarchy__title {
		font-weight: 600;
		white-space: nowrap;
	}

	span.hierarchy__title {
		color: var(--color-text);
	}

	.hierarchy__note {
		font-size: 0.8em;
		color: var(--color-muted);
	}

	@media (max-width: 540px) {
		.hierarchy {
			padding: 0.75rem;
		}

		.hierarchy__children {
			margin-left: 0.45rem;
			padding-left: 0.6rem;
		}
	}

	.hierarchy__legend {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem 1.25rem;
		margin-top: 1rem;
		padding-top: 0.75rem;
		border-top: 1px solid var(--color-border);
		font-size: 0.85em;
		color: var(--color-muted);
	}

	.hierarchy__legend-item {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
	}
</style>

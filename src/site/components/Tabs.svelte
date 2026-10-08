<script lang="ts">
	import type { Snippet } from 'svelte';
	import { setTabsContext } from './tabs';

	interface Props {
		children?: Snippet;
	}

	let { children }: Props = $props();

	let labels: string[] = $state([]);
	let selected: string | undefined = $state();

	setTabsContext({
		register(label) {
			if (!labels.includes(label)) labels.push(label);
		},
		get active() {
			return selected ?? labels[0];
		}
	});
</script>

<div class="tabs">
	<div class="tabs__list" role="tablist">
		{#each labels as label (label)}
			<button
				type="button"
				role="tab"
				class={['tabs__tab', (selected ?? labels[0]) === label && 'tabs__tab--active']}
				aria-selected={(selected ?? labels[0]) === label}
				onclick={() => (selected = label)}
			>
				{label}
			</button>
		{/each}
	</div>
	{@render children?.()}
</div>

<style>
	.tabs {
		margin: 1.25rem 0;
	}
	.tabs__list {
		display: flex;
		gap: 0.25rem;
		border-bottom: 1px solid var(--color-border);
		margin-bottom: 0.75rem;
		overflow-x: auto;
	}
	.tabs__tab {
		appearance: none;
		border: none;
		background: none;
		padding: 0.5rem 0.9rem;
		font: inherit;
		font-weight: 600;
		color: var(--color-muted);
		border-bottom: 2px solid transparent;
		margin-bottom: -1px;
		cursor: pointer;
	}
	.tabs__tab--active {
		color: var(--color-primary);
		border-bottom-color: var(--color-primary);
	}
</style>

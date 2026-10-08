<script lang="ts">
	import type { Snippet } from 'svelte';
	import { setTabsContext } from './tabs';

	interface Props {
		children?: Snippet;
	}

	let { children }: Props = $props();

	let labels: string[] = $state([]);
	let selected: string | undefined = $state();
	const active = $derived(selected ?? labels[0]);

	setTabsContext({
		register(label) {
			if (!labels.includes(label)) {
				labels.push(label);
			}
		},
		get active() {
			return active;
		}
	});
</script>

<!-- Panels render before the tab list so that, during server rendering, every TabItem
     has registered its label by the time the list is rendered. CSS puts the list first. -->
<div class="tabs">
	<div class="tabs__panels">{@render children?.()}</div>
	<div class="tabs__list" role="tablist">
		{#each labels as label (label)}
			<button
				type="button"
				role="tab"
				class={['tabs__tab', active === label && 'tabs__tab--active']}
				aria-selected={active === label}
				onclick={() => (selected = label)}
			>
				{label}
			</button>
		{/each}
	</div>
</div>

<style>
	.tabs {
		margin: 1.25rem 0;
		display: flex;
		flex-direction: column;
	}
	.tabs__panels {
		order: 2;
		min-width: 0;
	}
	.tabs__list {
		display: flex;
		gap: 0.25rem;
		margin-bottom: 0.75rem;
		/* Scrolls sideways when the tabs don't fit. The divider is an inset shadow, not a
		   border the tabs overlap with a negative margin: overflow-x makes the list clip
		   vertically too, so an overlap would show a vertical scrollbar. */
		overflow-x: auto;
		box-shadow: inset 0 -1px 0 var(--color-border);
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
		cursor: pointer;
	}
	.tabs__tab--active {
		color: var(--color-primary);
		border-bottom-color: var(--color-primary);
	}
</style>

<script lang="ts">
	import { untrack, type Snippet } from 'svelte';
	import { getTabsContext } from './tabs';

	interface Props {
		label: string;
		children?: Snippet;
	}

	let { label, children }: Props = $props();

	const tabs = getTabsContext();
	// Registration order is the tab order, so it runs once, at init.
	tabs.register(untrack(() => label));
</script>

{#if tabs.active === label}
	<div role="tabpanel">{@render children?.()}</div>
{/if}

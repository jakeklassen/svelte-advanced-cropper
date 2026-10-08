<script lang="ts">
	import { Moon, Sun } from '@lucide/svelte';
	import { onMount } from 'svelte';

	type Theme = 'light' | 'dark';

	// The page's theme is set before the first paint (see app.html); read it once mounted.
	let theme: Theme = $state('dark');

	onMount(() => {
		theme = document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
	});

	function toggle() {
		theme = theme === 'dark' ? 'light' : 'dark';
		document.documentElement.dataset.theme = theme;
		try {
			localStorage.setItem('theme', theme);
		} catch {
			// Storage can be unavailable (private mode); the choice then lasts for this page.
		}
	}
</script>

<!-- Both icons render; CSS shows the one for the current theme, so the server-rendered
     page never shows the wrong icon before this component mounts. -->
<button
	type="button"
	class="theme-toggle"
	aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
	onclick={toggle}
>
	<Sun class="theme-toggle__sun" size={20} aria-hidden="true" />
	<Moon class="theme-toggle__moon" size={20} aria-hidden="true" />
</button>

<style>
	.theme-toggle {
		display: inline-flex;
		appearance: none;
		padding: 0.35rem;
		border: 0;
		border-radius: 6px;
		background: none;
		color: inherit;
		cursor: pointer;
	}
	.theme-toggle:hover {
		color: var(--color-primary);
	}
	:global(:root[data-theme='dark']) .theme-toggle :global(.theme-toggle__moon),
	:global(:root[data-theme='light']) .theme-toggle :global(.theme-toggle__sun) {
		display: none;
	}
</style>

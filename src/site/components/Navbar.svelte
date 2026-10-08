<script lang="ts">
	import { Menu } from '@lucide/svelte';
	import Logo from './Logo.svelte';
	import ThemeToggle from './ThemeToggle.svelte';
	import { href } from '#site/paths.ts';

	interface Props {
		variant?: 'default' | 'hero';
		onMenu?: () => void;
	}

	let { variant = 'default', onMenu }: Props = $props();
</script>

<nav class={['navbar', `navbar--${variant}`]}>
	{#if onMenu}
		<button type="button" class="navbar__menu" aria-label="Open navigation" onclick={onMenu}>
			<Menu size={22} aria-hidden="true" />
		</button>
	{/if}
	<a class="navbar__brand" href={href('/')}>
		<Logo />
		<span>Svelte Advanced Cropper</span>
	</a>
	<div class="navbar__links">
		<a href={href('/docs/intro')}>Documentation</a>
		<a href="https://github.com/jakeklassen/svelte-advanced-cropper">GitHub</a>
		<ThemeToggle />
	</div>
</nav>

<style>
	.navbar {
		display: flex;
		align-items: center;
		gap: 1rem;
		height: var(--navbar-height);
		padding: 0 24px;
		color: var(--color-navbar-text);
		background: var(--color-navbar);
	}
	.navbar--default {
		position: sticky;
		top: 0;
		z-index: 20;
		border-bottom: 1px solid var(--color-navbar-border);
	}
	/* The home page hero is dark in both themes. */
	.navbar--hero {
		background: transparent;
		padding: 0;
		color: white;
	}
	.navbar a {
		color: inherit;
	}
	.navbar a:hover {
		color: var(--color-primary);
		text-decoration: none;
	}
	.navbar__brand {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		font-weight: 700;
		font-size: 1.05rem;
	}
	.navbar__links {
		margin-left: auto;
		display: flex;
		align-items: center;
		gap: 1.5rem;
		font-weight: 500;
	}
	.navbar__menu {
		display: none;
		appearance: none;
		background: none;
		border: none;
		color: inherit;
		padding: 0.25rem;
		cursor: pointer;
	}
	@media (max-width: 996px) {
		.navbar__menu {
			display: block;
		}
		.navbar__brand span {
			display: none;
		}
	}
</style>

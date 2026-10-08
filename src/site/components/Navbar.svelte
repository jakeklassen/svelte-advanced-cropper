<script lang="ts">
	import Logo from './Logo.svelte';
	import { href } from '../paths';

	interface Props {
		variant?: 'default' | 'hero';
		onMenu?: () => void;
	}

	let { variant = 'default', onMenu }: Props = $props();
</script>

<nav class={['navbar', `navbar--${variant}`]}>
	{#if onMenu}
		<button type="button" class="navbar__menu" aria-label="Open navigation" onclick={onMenu}>
			<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
				><path d="M3 6h18M3 12h18M3 18h18" /></svg
			>
		</button>
	{/if}
	<a class="navbar__brand" href={href('/')}>
		<Logo />
		<span>Svelte Advanced Cropper</span>
	</a>
	<div class="navbar__links">
		<a href={href('/docs/intro')}>Documentation</a>
		<a href="https://github.com/jakeklassen/svelte-advanced-cropper">GitHub</a>
	</div>
</nav>

<style>
	.navbar {
		display: flex;
		align-items: center;
		gap: 1rem;
		height: var(--navbar-height);
		padding: 0 24px;
		color: white;
		background: var(--color-navbar);
	}
	.navbar--default {
		position: sticky;
		top: 0;
		z-index: 20;
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
	}
	.navbar--hero {
		background: transparent;
		padding: 0;
	}
	.navbar a {
		color: white;
	}
	.navbar a:hover {
		color: var(--color-navbar-link-hover);
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

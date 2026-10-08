<script lang="ts">
	import { page } from '$app/state';
	import { isCurrentPage, isGroup, nav } from '#site/nav.ts';
	import { href } from '#site/paths.ts';

	interface Props {
		onNavigate?: () => void;
	}

	let { onNavigate }: Props = $props();

	const isActive = (path: string) => isCurrentPage(page.url.pathname, path);
</script>

<nav class="sidebar" aria-label="Documentation">
	<ul>
		{#each nav as entry (entry.title)}
			{#if isGroup(entry)}
				<li>
					<details open={entry.items.some((item) => isActive(item.href))}>
						<summary>{entry.title}</summary>
						<ul>
							{#each entry.items as item (item.href)}
								<li>
									<a
										href={href(item.href)}
										class={[isActive(item.href) && 'active']}
										aria-current={isActive(item.href) ? 'page' : undefined}
										onclick={onNavigate}>{item.title}</a
									>
								</li>
							{/each}
						</ul>
					</details>
				</li>
			{:else}
				<li>
					<a
						href={href(entry.href)}
						class={['top', isActive(entry.href) && 'active']}
						aria-current={isActive(entry.href) ? 'page' : undefined}
						onclick={onNavigate}>{entry.title}</a
					>
				</li>
			{/if}
		{/each}
	</ul>
</nav>

<style>
	.sidebar {
		padding: 1rem 0.75rem 2rem;
		font-size: 0.95rem;
	}
	ul {
		list-style: none;
		margin: 0;
		padding: 0;
	}
	ul ul {
		padding-left: 0.75rem;
	}
	a,
	summary {
		display: block;
		padding: 0.35rem 0.75rem;
		border-radius: 6px;
		color: var(--color-text);
		cursor: pointer;
	}
	summary {
		font-weight: 600;
		list-style: none;
		position: relative;
	}
	summary::-webkit-details-marker {
		display: none;
	}
	summary::after {
		content: '';
		position: absolute;
		right: 0.75rem;
		top: 50%;
		width: 6px;
		height: 6px;
		border-right: 2px solid var(--color-muted);
		border-bottom: 2px solid var(--color-muted);
		transform: translateY(-70%) rotate(45deg);
		transition: transform 0.15s;
	}
	details:not([open]) > summary::after {
		transform: translateY(-50%) rotate(-45deg);
	}
	a.top {
		font-weight: 600;
	}
	a:hover,
	summary:hover {
		background: #f2f3f5;
		text-decoration: none;
	}
	a.active {
		color: var(--color-primary);
		background: #eaf6fe;
	}
</style>

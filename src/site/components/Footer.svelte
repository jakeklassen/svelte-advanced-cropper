<script lang="ts">
	import { href } from '#site/paths.ts';
</script>

<footer class="footer">
	<div class="footer__columns">
		<div>
			<div class="footer__title">Docs</div>
			<a href={href('/docs/intro')}>Getting started</a>
			<a href={href('/docs/guides/stencils')}>Stencils</a>
			<a href={href('/docs/guides/defaults-and-restrictions')}>Defaults and restrictions</a>
		</div>
		<div>
			<div class="footer__title">Credits</div>
			<a href="https://github.com/advanced-cropper/react-advanced-cropper">
				react-advanced-cropper
			</a>
			<a href="https://github.com/advanced-cropper/advanced-cropper">advanced-cropper core</a>
		</div>
		<div>
			<div class="footer__title">More</div>
			<a href="https://github.com/jakeklassen/svelte-advanced-cropper">GitHub</a>
			<a href="https://www.npmjs.com/package/svelte-advanced-cropper">npm</a>
		</div>
	</div>
	<p class="footer__copyright">
		MIT licensed. Includes code derived from Norserium's MIT-licensed react-advanced-cropper. Not
		affiliated with the Advanced Cropper project. Photos from Unsplash.
	</p>
</footer>

<style>
	.footer {
		background: var(--color-footer);
		color: var(--color-footer-text);
		padding: 2.5rem 24px 2rem;
	}
	.footer__columns {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
		gap: 1.5rem;
		max-width: 1100px;
		margin: 0 auto;
	}
	.footer__columns div {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}
	.footer__title {
		font-weight: 700;
		margin-bottom: 0.25rem;
	}
	.footer a {
		color: var(--color-footer-text);
	}
	.footer a:hover {
		color: var(--color-primary);
	}
	.footer__copyright {
		text-align: center;
		margin: 2rem 0 0;
		font-size: 0.9rem;
		color: var(--color-footer-muted);
	}
</style>

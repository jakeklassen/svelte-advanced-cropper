<script lang="ts">
	import Navbar from '#site/components/Navbar.svelte';
	import Footer from '#site/components/Footer.svelte';
	import CodeBlock from '#site/components/CodeBlock.svelte';
	import { href } from '#site/paths.ts';
	import CroppersWizard from '#site/demos/home/CroppersWizard.svelte';
	import InstallationBlock from '#site/demos/home/InstallationBlock.svelte';
	import gettingStarted from '#site/demos/home/GettingStartedSnippet.svelte?highlight';

	const features = [
		{
			title: 'Make it yours',
			text: 'Use the cropper as it ships, or replace any part of it: the stencil, the handlers, the image gestures, the wrapper. Both the look and the behaviour are open to change.'
		},
		{
			title: 'Touch first',
			text: 'Pinch to zoom, drag to move and resize: touch, mouse and wheel input all work out of the box, and the cropper adapts when its container changes size.'
		},
		{
			title: 'Canvas or coordinates',
			text: 'Get the cropped area as a canvas, ready to upload or preview, or just the coordinates within the original image to crop it on your server.'
		},
		{
			title: 'Precise limits',
			text: 'Fix the aspect ratio or allow a range, set minimum and maximum sizes, and choose how the image is kept within the stencil or the visible area.'
		}
	];
</script>

<svelte:head>
	<title>Svelte Advanced Cropper: build the cropper your design needs</title>
</svelte:head>

<div class="home">
	<section class="landing">
		<div class="container">
			<div class="header">
				<Navbar variant="hero" />
			</div>
			<h1 class="landing-title">Build the cropper your design needs</h1>
			<p class="section-text">
				An image cropper for Svelte 5 that fits your site instead of the other way around. Rotation,
				zoom, smooth transitions, automatic zoom to the stencil and much more come included, and
				every piece can be restyled or swapped out.
			</p>
			<p class="credit">
				Includes code derived from Norserium's MIT-licensed
				<a href="https://github.com/advanced-cropper/react-advanced-cropper"
					>react-advanced-cropper</a
				>
				and is built on the
				<a href="https://github.com/advanced-cropper/advanced-cropper">advanced-cropper</a> core. Not
				affiliated with the Advanced Cropper project.
			</p>
			<div class="showcase">
				<CroppersWizard />
			</div>
		</div>
	</section>

	<section class="features-wrapper">
		<div class="features">
			<div class="section-title-wrapper">
				<h2 class="section-title">Features</h2>
			</div>
			<div class="features-grid">
				{#each features as feature (feature.title)}
					<div class="feature">
						<h3 class="feature-title">{feature.title}</h3>
						<p class="feature-text">{feature.text}</p>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<section class="example">
		<div class="container">
			<div class="section-title-wrapper">
				<h2 class="section-title">How to start?</h2>
			</div>
			<p class="section-text">
				Under the hood this is closer to a toolkit for building croppers than a single widget, yet
				the basic case takes a few lines. Install the package, import the styles once, and drop the
				component into your page.
			</p>
			<div class="installation">
				<InstallationBlock />
			</div>
		</div>
		<div class="code-wrapper">
			<div class="code">
				<CodeBlock
					highlighted={gettingStarted.highlighted}
					code={gettingStarted.code}
					title="GettingStarted.svelte"
				/>
			</div>
		</div>
		<div class="container">
			<p class="section-text">
				The documentation has many more examples for everyday tasks and unusual ones alike, from the
				<a href={href('/docs/guides/stencils')}>stencil guide</a>
				to the
				<a href={href('/docs/guides/defaults-and-restrictions')}>defaults and restrictions</a>.
			</p>
		</div>
	</section>
</div>

<Footer />

<style>
	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 24px;
	}
	.landing {
		background: var(--color-hero);
		color: white;
		padding-bottom: 80px;
	}
	.landing-title {
		font-size: 36px;
		line-height: 1.25;
		margin: 80px 0 42px;
		text-align: center;
	}
	.section-text {
		font-size: 16px;
		line-height: 28px;
		text-align: center;
		width: 600px;
		max-width: 100%;
		margin: 0 auto 24px;
	}
	/* Project attribution. */
	.credit {
		width: 520px;
		max-width: 100%;
		margin: 40px auto 60px;
		padding: 14px 0;
		border-top: solid 1px #262626;
		border-bottom: solid 1px #262626;
		font-size: 14px;
		line-height: 22px;
		text-align: center;
		color: #9a989b;
	}
	.credit a {
		white-space: nowrap;
		color: #cbc8cb;
		text-decoration: underline;
		text-underline-offset: 3px;
	}
	.credit a:hover {
		color: var(--color-accent);
	}
	.showcase {
		display: flex;
		justify-content: center;
		min-width: 0;
	}
	.section-title-wrapper {
		display: flex;
		align-items: center;
	}
	.section-title {
		display: inline-block;
		margin: 40px auto;
		padding-bottom: 6px;
		font-size: 36px;
		line-height: 1.2;
		font-weight: bold;
		text-align: center;
		border-bottom: solid 2px var(--color-accent);
	}
	.features-wrapper {
		background: var(--color-surface);
		color: var(--color-text);
	}
	.features {
		max-width: 800px;
		margin: 0 auto;
		padding: 30px 24px 80px;
	}
	.features-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 32px 64px;
	}
	.feature-title {
		font-size: 24px;
		font-weight: normal;
		margin: 0 0 8px;
	}
	.feature-text {
		margin: 0;
	}
	.example {
		background: var(--color-surface-subtle);
		color: var(--color-text);
		padding: 20px 0 50px;
	}
	.installation {
		max-width: 600px;
		margin: 0 auto 40px;
	}
	.code-wrapper {
		background: var(--color-code);
		padding: 10px 24px;
		margin-bottom: 40px;
		box-shadow: inset 0 0 10px 0 rgb(0 0 0 / 10%);
	}
	.code {
		max-width: 800px;
		margin: 0 auto;
	}
	@media (max-width: 768px) {
		.landing-title {
			margin-top: 40px;
		}
		.showcase {
			margin: 0 -24px;
			background: #1a1919;
		}
		.features-grid {
			grid-template-columns: minmax(0, 1fr);
			text-align: center;
		}
	}
</style>

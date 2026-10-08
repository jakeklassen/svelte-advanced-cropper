<script lang="ts">
	interface Props {
		/** Float the card to the right of the text on wide screens. */
		float?: boolean;
	}

	let { float = false }: Props = $props();

	const fields = ['boundary', 'imageSize', 'transforms', 'visibleArea', 'coordinates'];
</script>

<figure class={['state-diagram', float && 'state-diagram--float']} aria-label="The fields of CropperState">
	<div class="state-diagram__card">
		<div class="state-diagram__title">CropperState</div>
		<ul class="state-diagram__fields">
			{#each fields as field (field)}
				<li>{field}</li>
			{/each}
		</ul>
	</div>
</figure>

<style>
	.state-diagram {
		--corner: 14px;
		position: relative;
		width: 220px;
		margin: 0 auto 1rem;
		padding: 10px;
	}
	/* Accent corner brackets around the card. */
	.state-diagram::before,
	.state-diagram::after,
	.state-diagram__card::before,
	.state-diagram__card::after {
		content: '';
		position: absolute;
		width: var(--corner);
		height: var(--corner);
		border: 2px solid var(--color-primary);
	}
	.state-diagram::before {
		top: 0;
		left: 0;
		border-right: none;
		border-bottom: none;
	}
	.state-diagram::after {
		top: 0;
		right: 0;
		border-left: none;
		border-bottom: none;
	}
	.state-diagram__card::before {
		bottom: -10px;
		left: -10px;
		border-right: none;
		border-top: none;
	}
	.state-diagram__card::after {
		bottom: -10px;
		right: -10px;
		border-left: none;
		border-top: none;
	}
	.state-diagram__card {
		position: relative;
		border: 2px solid var(--color-text);
		background: var(--color-surface);
		font-size: 0.85rem;
		text-align: center;
	}
	.state-diagram__title {
		padding: 0.45rem;
		font-weight: 700;
		border-bottom: 2px solid var(--color-text);
	}
	.state-diagram__fields {
		list-style: none;
		margin: 0;
		padding: 0 0.6rem;
	}
	.state-diagram__fields li {
		margin: 0;
		padding: 0.4rem 0;
		font-family: var(--font-mono);
		font-size: 0.8rem;
		color: var(--color-text);
	}
	.state-diagram__fields li + li {
		border-top: 1px dashed var(--color-border);
	}
	@media (min-width: 720px) {
		.state-diagram--float {
			float: right;
			margin: 0 0 1rem 1.5rem;
		}
	}
</style>

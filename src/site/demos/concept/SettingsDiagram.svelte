<script lang="ts">
	const groups = [
		{
			title: 'CoreSettings',
			fields: [
				'sizeRestrictions',
				'positionRestrictions',
				'areaSizeRestrictions',
				'areaPositionRestrictions',
				'aspectRatio'
			]
		},
		{
			title: 'InitializeSettings',
			fields: ['defaultCoordinates', 'defaultVisibleArea', 'defaultTransforms?', 'priority?']
		}
	];

	const consumers = [
		'createState',
		'moveCoordinates',
		'resizeCoordinates',
		'setCoordinates',
		'setVisibleArea',
		'setBoundary',
		'transformImage',
		'reconcileState',
		'fitCoordinates',
		'fitVisibleArea'
	];
</script>

<figure class="settings-diagram">
	<div class="settings-diagram__settings">
		{#each groups as group (group.title)}
			<div class="settings-diagram__title">{group.title}</div>
			<ul>
				{#each group.fields as name (name)}
					<li>{name}</li>
				{/each}
			</ul>
		{/each}
	</div>
	<div class="settings-diagram__arrow" aria-hidden="true"></div>
	<ul class="settings-diagram__consumers">
		{#each consumers as name (name)}
			<li>{name}</li>
		{/each}
	</ul>
	<figcaption>The modifiers and helpers on the right all read the same settings object.</figcaption>
</figure>

<style>
	.settings-diagram {
		display: grid;
		grid-template-columns: 1fr;
		justify-items: center;
		gap: 0.75rem;
		margin: 1.5rem 0;
		font-size: 0.8rem;
	}
	ul {
		list-style: none;
		margin: 0;
		padding: 0;
	}
	li {
		margin: 0;
		font-family: var(--font-mono);
	}
	.settings-diagram__settings {
		width: min(100%, 250px);
		border: 2px solid var(--color-text);
		outline: 2px solid var(--color-primary);
		outline-offset: 5px;
		background: var(--color-surface);
		text-align: center;
	}
	.settings-diagram__title {
		padding: 0.45rem;
		background: var(--color-surface-subtle);
		font-weight: 700;
		font-size: 0.9rem;
		border-bottom: 2px solid var(--color-text);
	}
	ul + .settings-diagram__title {
		border-top: 2px solid var(--color-text);
	}
	.settings-diagram__settings li {
		padding: 0.35rem 0.5rem;
	}
	.settings-diagram__settings li + li {
		border-top: 1px dashed var(--color-border);
	}
	/* A down arrow on narrow screens, a right arrow beside the list on wide ones. */
	.settings-diagram__arrow {
		position: relative;
		width: 2px;
		height: 28px;
		background: var(--color-muted);
	}
	.settings-diagram__arrow::after {
		content: '';
		position: absolute;
		left: -5px;
		bottom: -2px;
		border: 6px solid transparent;
		border-top-color: var(--color-muted);
		border-bottom: none;
	}
	.settings-diagram__consumers {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
		gap: 0.4rem;
		width: 100%;
	}
	.settings-diagram__consumers li {
		padding: 0.4rem 0.5rem;
		border: 1px solid var(--color-text);
		background: var(--color-surface);
		text-align: center;
	}
	figcaption {
		color: var(--color-muted);
		font-size: 0.8rem;
		text-align: center;
	}
	@media (min-width: 640px) {
		.settings-diagram {
			grid-template-columns: auto 56px minmax(0, 220px);
			justify-content: center;
			align-items: center;
			column-gap: 0;
		}
		.settings-diagram__settings {
			width: 250px;
		}
		.settings-diagram__arrow {
			width: 100%;
			height: 2px;
		}
		.settings-diagram__arrow::after {
			left: auto;
			right: -2px;
			bottom: -5px;
			border: 6px solid transparent;
			border-left-color: var(--color-muted);
			border-right: none;
		}
		.settings-diagram__consumers {
			grid-template-columns: 1fr;
			position: relative;
			padding-left: 18px;
			border-left: 2px solid var(--color-muted);
		}
		.settings-diagram__consumers li {
			position: relative;
		}
		/* A short branch from the bus line to each box. */
		.settings-diagram__consumers li::before {
			content: '';
			position: absolute;
			top: 50%;
			left: -19px;
			width: 18px;
			height: 2px;
			background: var(--color-muted);
		}
		figcaption {
			grid-column: 1 / -1;
			margin-top: 0.5rem;
		}
	}
</style>

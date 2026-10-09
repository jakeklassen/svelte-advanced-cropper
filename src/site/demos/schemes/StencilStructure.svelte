<script lang="ts">
	import SchemeImage from './SchemeImage.svelte';

	const handlers = ['west-north', 'east-north', 'west-south', 'east-south'];
</script>

<figure class="stencil-structure" aria-label="Default stencil structure">
	<div class="stencil-structure__wrapper">
		<span class="stencil-structure__tag stencil-structure__tag--wrapper">Wrapper</span>
		<div class="stencil-structure__stage">
			<SchemeImage class="stencil-structure__image" />
			<div class="stencil-structure__stencil">
				<span class="stencil-structure__line"></span>
				{#each handlers as position (position)}
					<span class="stencil-structure__handler stencil-structure__handler--{position}"></span>
				{/each}
				<span class="stencil-structure__tag stencil-structure__tag--preview">Preview</span>
				<span class="stencil-structure__tag stencil-structure__tag--line">Line</span>
				<span class="stencil-structure__tag stencil-structure__tag--handler">Handler</span>
			</div>
			<span class="stencil-structure__tag stencil-structure__tag--overlay">Overlay</span>
			<span class="stencil-structure__tag stencil-structure__tag--background">Background image</span
			>
		</div>
	</div>
	<figcaption>
		<dl class="stencil-structure__legend">
			<dt>Overlay</dt>
			<dd><code>__overlay</code> selector</dd>
			<dt>Preview</dt>
			<dd><code>__preview</code> selector</dd>
			<dt>Line</dt>
			<dd><code>line</code> snippet, <code>lines</code> prop</dd>
			<dt>Handler</dt>
			<dd><code>handler</code> snippet, <code>handlers</code> prop</dd>
			<dt>Stencil root</dt>
			<dd>
				<code>class</code>, <code>style</code>; <code>--moving</code>,
				<code>--resizing</code>, <code>--disabled</code> state selectors
			</dd>
			<dt>Guides</dt>
			<dd><code>grid</code> prop or a <code>children</code> snippet</dd>
		</dl>
		<p class="stencil-structure__note">
			Set props directly on the child stencil. Scope part selectors under its class: append the
			suffixes above to <code>.advanced-cropper-rectangle-stencil</code>
			or <code>.advanced-cropper-circle-stencil</code>.
		</p>
	</figcaption>
</figure>

<style>
	.stencil-structure {
		margin: 1.5rem 0;
	}

	.stencil-structure__wrapper {
		position: relative;
		max-width: 520px;
		padding: 2.75rem 1.25rem 1.5rem;
		border: 2px dashed #9ca3af;
		border-radius: 6px;
		background: #1f1f1f;
	}

	.stencil-structure__stage {
		position: relative;
		width: 80%;
		aspect-ratio: 3 / 2;
		margin: 0 auto;
		overflow: hidden;
	}

	:global(.stencil-structure__image) {
		position: absolute;
		inset: 0;
	}

	/* Like the real overlay: a huge box-shadow around the stencil dims everything else. */
	.stencil-structure__stencil {
		position: absolute;
		left: 26%;
		top: 20%;
		width: 48%;
		height: 62%;
		box-shadow: 0 0 0 1000px rgba(0, 0, 0, 0.55);
		outline: 2px dashed var(--color-primary);
		outline-offset: -6px;
	}

	.stencil-structure__line {
		position: absolute;
		inset: 0;
		border: 1px solid rgba(255, 255, 255, 0.85);
	}

	.stencil-structure__handler {
		position: absolute;
		width: 10px;
		height: 10px;
		margin: -5px;
		background: #fff;
	}

	.stencil-structure__handler--west-north {
		left: 0;
		top: 0;
	}

	.stencil-structure__handler--east-north {
		left: 100%;
		top: 0;
	}

	.stencil-structure__handler--west-south {
		left: 0;
		top: 100%;
	}

	.stencil-structure__handler--east-south {
		left: 100%;
		top: 100%;
	}

	.stencil-structure__tag {
		position: absolute;
		padding: 0.05rem 0.4rem;
		border-radius: 4px;
		background: #f3f4f6;
		color: #111;
		font-size: 0.7rem;
		font-weight: 600;
		line-height: 1.5;
		white-space: nowrap;
	}

	.stencil-structure__tag--wrapper {
		top: 0.5rem;
		left: 0.5rem;
		font-size: 0.8rem;
		background: #9ca3af;
	}

	.stencil-structure__tag--overlay {
		top: 6%;
		left: 3%;
	}

	.stencil-structure__tag--background {
		left: 3%;
		bottom: 5%;
	}

	.stencil-structure__tag--preview {
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		background: var(--color-primary);
		color: #fff;
	}

	.stencil-structure__tag--line {
		top: 0;
		left: 50%;
		transform: translate(-50%, -50%);
	}

	.stencil-structure__tag--handler {
		top: 100%;
		left: 100%;
		transform: translate(-50%, 6px);
	}

	.stencil-structure__legend {
		display: grid;
		grid-template-columns: max-content 1fr;
		gap: 0.35rem 1rem;
		margin: 0.75rem 0 0;
		font-size: 0.9rem;
	}

	.stencil-structure__legend dt {
		font-weight: 600;
	}

	.stencil-structure__legend dd {
		margin: 0;
	}

	.stencil-structure__note {
		margin: 0.5rem 0 0;
		font-size: 0.85rem;
		color: var(--color-muted);
		overflow-wrap: anywhere;
	}

	@media (max-width: 540px) {
		.stencil-structure__legend {
			grid-template-columns: 1fr;
		}

		.stencil-structure__legend dd {
			margin-bottom: 0.5rem;
		}
	}
</style>
